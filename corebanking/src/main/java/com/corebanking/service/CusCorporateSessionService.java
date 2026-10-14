package com.corebanking.service;

import com.corebanking.dto.CusTokenResponse;
import com.corebanking.dto.CusRefreshTokenRequest;
import com.corebanking.entity.AuditLogs;
import com.corebanking.entity.AuthSession;
import com.corebanking.entity.CorporateCredential;
import com.corebanking.entity.CorporateUser;
import com.corebanking.entity.Customers;
import com.corebanking.entity.LoginAttempt;
import com.corebanking.entity.OtpChallenge;
import com.corebanking.entity.enums.ActorType;
import com.corebanking.entity.enums.CorporateUserStatus;
import com.corebanking.entity.enums.CustomerStatus;
import com.corebanking.entity.enums.CustomerType;
import com.corebanking.entity.enums.OtpPurpose;
import com.corebanking.entity.enums.OtpStatus;
import com.corebanking.entity.enums.OtpSubjectType;
import com.corebanking.entity.enums.SessionSubjectType;
import com.corebanking.entity.enums.UpdatedByType;
import com.corebanking.exception.CusAuthenticationException;
import com.corebanking.exception.CusOtpException;
import com.corebanking.exception.CusSessionExpiredException;
import com.corebanking.exception.CusValidationException;
import com.corebanking.repository.CusAuditLogsRepository;
import com.corebanking.repository.CusAuthSessionsRepository;
import com.corebanking.repository.CusCorporateCredentialRepository;
import com.corebanking.repository.CusLoginAttemptsRepository;
import com.corebanking.repository.CusOtpChallengesRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CusCorporateSessionService {

    private static final int SETUP_WINDOW_MINUTES = 10;

    private final CusSessionService cusSessionService;
    private final CusJwtService cusJwtService;
    private final CusOtpChallengesRepository otpChallengesRepository;
    private final CusCorporateCredentialRepository corporateCredentialRepository;
    private final CusAuthSessionsRepository authSessionsRepository;
    private final CusLoginAttemptsRepository loginAttemptsRepository;
    private final CusAuditLogsRepository auditLogsRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CusTokenResponse createAuthenticatedSession(String challengeGroupId) {
        if (challengeGroupId == null || challengeGroupId.isBlank()) {
            throw new CusValidationException("OTP challenge information is required.");
        }
        OtpChallenge challenge = otpChallengesRepository
                .findFirstByChallengeGroupIdAndSubjectTypeAndPurposeOrderByOtpIdDesc(
                        challengeGroupId.trim(), OtpSubjectType.CORPORATE_USER, OtpPurpose.LOGIN
                )
                .orElseThrow(() -> new CusOtpException("Invalid OTP challenge."));
        validateCompletionBinding(challenge);

        CorporateUser user = challenge.getCorporateUser();
        if (user == null || user.getCorporateUserId() == null || challenge.getCustomer() != null) {
            throw new CusOtpException("Invalid corporate OTP challenge.");
        }
        Customers company = user.getCompanyInfo() == null
                ? null : user.getCompanyInfo().getCustomer();
        if (user.getStatus() != CorporateUserStatus.ACTIVE
                || company == null
                || company.getCustomerType() != CustomerType.COMPANY
                || company.getStatus() != CustomerStatus.ACTIVE) {
            throw new CusAuthenticationException("Corporate user or company is not active or invalid.");
        }
        UUID corporateUserId = user.getCorporateUserId();
        CorporateCredential credentials = corporateCredentialRepository
                .findByCorporateUserIdForUpdate(corporateUserId)
                .orElseThrow(() -> new CusAuthenticationException("Invalid login credentials."));
        validateCompletionBinding(challenge);
        if (credentials.getTokenVersion() == null) {
            throw new CusAuthenticationException("Invalid credential token version.");
        }
        boolean passwordChangeRequired = credentials.isMustChangePassword();
        boolean pinSetupRequired = credentials.getTransactionPinHash() == null
                || credentials.getTransactionPinHash().isBlank();
        if (passwordChangeRequired || pinSetupRequired) {
            throw new CusValidationException("Please complete first-time password and PIN setup.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime absoluteDeadline = now.plusHours(CusJwtService.SESSION_LIFETIME_HOURS);
        String sessionUuid = UUID.randomUUID().toString();
        String accessToken = cusJwtService.generateCorporateAccessToken(
                corporateUserId, sessionUuid, credentials.getTokenVersion()
        );
        String refreshToken = cusJwtService.generateCorporateRefreshToken(
                corporateUserId,
                sessionUuid,
                credentials.getTokenVersion(),
                Date.from(absoluteDeadline.atZone(ZoneId.systemDefault()).toInstant())
        );
        AuthSession session = AuthSession.builder()
                .sessionUuid(sessionUuid)
                .subjectType(SessionSubjectType.CORPORATE_USER)
                .corporateUser(user)
                .customer(null)
                .staff(null)
                .refreshTokenHash(cusSessionService.hashRefreshToken(refreshToken))
                .tokenVersionAtIssue(credentials.getTokenVersion())
                .issuedAt(now)
                .lastSeenAt(now)
                .refreshExpiresAt(absoluteDeadline)
                .idleTimeoutMinutes(5)
                .updatedByType(UpdatedByType.CORPORATE_USER)
                .updatedById(corporateUserId)
                .build();
        authSessionsRepository.saveAndFlush(session);

        credentials.setLastLoginAt(now);
        credentials.setUpdatedByType(UpdatedByType.CORPORATE_USER);
        credentials.setUpdatedById(corporateUserId);
        corporateCredentialRepository.saveAndFlush(credentials);

        loginAttemptsRepository.saveAndFlush(LoginAttempt.builder()
                .actorType(SessionSubjectType.CORPORATE_USER)
                .corporateUser(user)
                .customer(null)
                .staff(null)
                .loginIdentifier(loginIdentifier(company.getCustomerCode(), user.getCorporateUserCode()))
                .success(true)
                .failureReason(null)
                .updatedByType(UpdatedByType.CORPORATE_USER)
                .updatedById(corporateUserId)
                .build());

        auditLogsRepository.saveAndFlush(AuditLogs.builder()
                .actorType(ActorType.CORPORATE_USER)
                .actorCorporateUser(user)
                .actorCustomer(null)
                .actorStaff(null)
                .actionType("AUTH_SESSION_CREATED")
                .entityType("AUTH_SESSION")
                .entityId(sessionUuid)
                .newValues("{\"status\":\"ACTIVE\",\"idleTimeoutMinutes\":5}")
                .build());

        // EXPIRED also terminates this consumed setup binding after completion.
        challenge.setStatus(OtpStatus.EXPIRED);
        challenge.setUpdatedByType(UpdatedByType.CORPORATE_USER);
        challenge.setUpdatedById(corporateUserId);
        otpChallengesRepository.saveAndFlush(challenge);

        return new CusTokenResponse(true, "Login successful.", accessToken, refreshToken);
    }

    @Transactional(noRollbackFor = CusSessionExpiredException.class)
    public CusTokenResponse refreshToken(CusRefreshTokenRequest request) {
        if (request == null
                || request.getRefreshToken() == null
                || request.getRefreshToken().isBlank()) {
            throw new CusAuthenticationException("Refresh token is required.");
        }
        String oldRefreshToken = request.getRefreshToken().trim();
        Claims claims = cusJwtService.getClaims(oldRefreshToken);
        AuthSession session = validateRefreshSession(claims, oldRefreshToken);
        CorporateUser user = session.getCorporateUser();
        if (user == null || user.getCorporateUserId() == null) {
            throw new CusAuthenticationException("Corporate session is invalid.");
        }
        UUID corporateUserId = user.getCorporateUserId();
        CorporateCredential credentials = corporateCredentialRepository.findById(corporateUserId)
                .orElseThrow(() -> new CusAuthenticationException("Corporate credentials not found."));
        if (credentials.getTokenVersion() == null) {
            throw new CusAuthenticationException("Invalid credential token version.");
        }

        LocalDateTime absoluteDeadline =
                session.getIssuedAt().plusHours(CusJwtService.SESSION_LIFETIME_HOURS);
        LocalDateTime effectiveDeadline =
                session.getRefreshExpiresAt().isBefore(absoluteDeadline)
                        ? session.getRefreshExpiresAt()
                        : absoluteDeadline;
        String newAccessToken = cusJwtService.generateCorporateAccessToken(
                corporateUserId, session.getSessionUuid(), credentials.getTokenVersion()
        );
        String newRefreshToken = cusJwtService.generateCorporateRefreshToken(
                corporateUserId,
                session.getSessionUuid(),
                credentials.getTokenVersion(),
                Date.from(effectiveDeadline.atZone(ZoneId.systemDefault()).toInstant())
        );
        String expectedOldHash = cusSessionService.hashRefreshToken(oldRefreshToken);
        String newRefreshHash = cusSessionService.hashRefreshToken(newRefreshToken);
        LocalDateTime now = LocalDateTime.now();
        int updatedRows = authSessionsRepository.rotateRefreshTokenIfMatch(
                session.getSessionUuid(),
                expectedOldHash,
                newRefreshHash,
                effectiveDeadline,
                now,
                UpdatedByType.CORPORATE_USER,
                corporateUserId
        );
        if (updatedRows != 1) {
            throw new CusAuthenticationException(
                    "Refresh token has already been used or is no longer valid."
            );
        }
        auditLogsRepository.save(AuditLogs.builder()
                .actorType(ActorType.CORPORATE_USER)
                .actorCorporateUser(user)
                .actorCustomer(null)
                .actorStaff(null)
                .actionType("TOKEN_REFRESHED")
                .entityType("AUTH_SESSION")
                .entityId(session.getSessionUuid())
                .newValues("{\"status\":\"ACTIVE\",\"refreshTokenRotated\":true}")
                .build());
        return new CusTokenResponse(
                true, "Token refreshed successfully.", newAccessToken, newRefreshToken
        );
    }

    private void validateCompletionBinding(OtpChallenge challenge) {
        if (challenge.getStatus() != OtpStatus.CONSUMED) {
            throw new CusOtpException("OTP verification is required or login has already completed.");
        }
        if (challenge.getConsumedAt() == null
                || challenge.getConsumedAt().plusMinutes(SETUP_WINDOW_MINUTES)
                        .isBefore(LocalDateTime.now())) {
            throw new CusSessionExpiredException(
                    "First-login setup session has expired. Please login again."
            );
        }
    }

    private String loginIdentifier(String companyCode, String userCode) {
        String identifier = companyCode.length() + ":" + companyCode + ":" + userCode;
        return identifier.substring(0, Math.min(identifier.length(), 191));
    }

    public AuthSession validateAccessSession(Claims claims) {
        return cusSessionService.validateCorporateAccessSession(claims);
    }

    public AuthSession validateRefreshSession(Claims claims, String rawRefreshToken) {
        return cusSessionService.validateCorporateRefreshSession(claims, rawRefreshToken);
    }

    public AuthSession validateAccessSessionForLogout(Claims claims) {
        return cusSessionService.validateCorporateAccessSessionForLogout(claims);
    }

    public String hashRefreshToken(String refreshToken) {
        return cusSessionService.hashRefreshToken(refreshToken);
    }

    public boolean revokeSession(AuthSession session, String reason) {
        if (session == null || session.getSubjectType() != SessionSubjectType.CORPORATE_USER
                || session.getCorporateUser() == null
                || session.getCorporateUser().getCorporateUserId() == null) {
            throw new CusAuthenticationException("Corporate session is invalid.");
        }
        return cusSessionService.revokeSession(
                session,
                reason,
                UpdatedByType.CORPORATE_USER,
                session.getCorporateUser().getCorporateUserId()
        );
    }
}
