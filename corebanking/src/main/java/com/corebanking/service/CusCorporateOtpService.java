package com.corebanking.service;

import com.corebanking.dto.CusCorporateOtpVerifyRequest;
import com.corebanking.entity.CorporateUser;
import com.corebanking.entity.Customers;
import com.corebanking.entity.OtpChallenge;
import com.corebanking.entity.enums.CorporateUserStatus;
import com.corebanking.entity.enums.CustomerStatus;
import com.corebanking.entity.enums.CustomerType;
import com.corebanking.entity.enums.DeliveryChannel;
import com.corebanking.entity.enums.OtpPurpose;
import com.corebanking.entity.enums.OtpStatus;
import com.corebanking.entity.enums.OtpSubjectType;
import com.corebanking.entity.enums.UpdatedByType;
import com.corebanking.exception.CusAuthenticationException;
import com.corebanking.exception.CusEmailException;
import com.corebanking.exception.CusOtpException;
import com.corebanking.repository.CusCorporateCredentialRepository;
import com.corebanking.repository.CusCorporateUserRepository;
import com.corebanking.repository.CusOtpChallengesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CusCorporateOtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int MAX_OTP_RESENDS = 5;

    private final CusCorporateUserRepository corporateUserRepository;
    private final CusCorporateCredentialRepository corporateCredentialRepository;
    private final CusOtpChallengesRepository otpChallengesRepository;
    private final CusEmailService cusEmailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = CusEmailException.class
    )
    public OtpChallenge createLoginOtp(UUID corporateUserId) {
        if (corporateUserId == null) {
            throw new CusAuthenticationException("Invalid corporate user.");
        }
        corporateCredentialRepository.findByCorporateUserIdForUpdate(corporateUserId)
                .orElseThrow(() -> new CusAuthenticationException("Invalid login credentials."));

        CorporateUser user = corporateUserRepository.findById(corporateUserId)
                .orElseThrow(() -> new CusAuthenticationException("Invalid corporate user."));
        Customers company = user.getCompanyInfo() == null
                ? null : user.getCompanyInfo().getCustomer();
        if (user.getStatus() != CorporateUserStatus.ACTIVE
                || company == null
                || company.getCustomerType() != CustomerType.COMPANY
                || company.getStatus() != CustomerStatus.ACTIVE) {
            throw new CusAuthenticationException("Corporate user or company is not active or invalid.");
        }
        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            throw new CusAuthenticationException("No registered email address is available for MFA.");
        }

        var activeOtps = otpChallengesRepository.findByCorporateUserAndSubjectTypeAndPurposeAndStatus(
                user, OtpSubjectType.CORPORATE_USER, OtpPurpose.LOGIN, OtpStatus.ACTIVE);
        for (OtpChallenge oldOtp : activeOtps) {
            oldOtp.setStatus(OtpStatus.EXPIRED);
            oldOtp.setUpdatedByType(UpdatedByType.CORPORATE_USER);
            oldOtp.setUpdatedById(corporateUserId);
        }
        otpChallengesRepository.saveAll(activeOtps);

        String rawOtp = String.valueOf(100000 + SECURE_RANDOM.nextInt(900000));
        LocalDateTime now = LocalDateTime.now();
        OtpChallenge challenge = OtpChallenge.builder()
                .subjectType(OtpSubjectType.CORPORATE_USER)
                .corporateUser(user)
                .customer(null)
                .purpose(OtpPurpose.LOGIN)
                .otpHash(passwordEncoder.encode(rawOtp))
                .deliveryChannel(DeliveryChannel.EMAIL)
                .destinationMasked(maskEmail(email))
                .attemptCount(0)
                .maxAttempts(MAX_OTP_ATTEMPTS)
                .expiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES))
                .status(OtpStatus.ACTIVE)
                .challengeGroupId(UUID.randomUUID().toString())
                .lastSentAt(now)
                .maxResendAttempts(MAX_OTP_RESENDS)
                .resendNo(0)
                .updatedByType(UpdatedByType.CORPORATE_USER)
                .updatedById(corporateUserId)
                .build();
        OtpChallenge savedOtp = otpChallengesRepository.saveAndFlush(challenge);

        try {
            cusEmailService.sendCorporateLoginOtp(email, rawOtp);
        } catch (MailException ex) {
            savedOtp.setStatus(OtpStatus.EXPIRED);
            savedOtp.setUpdatedByType(UpdatedByType.SYSTEM);
            savedOtp.setUpdatedById(null);
            otpChallengesRepository.saveAndFlush(savedOtp);
            throw new CusEmailException("Unable to send OTP email. Please try again.", ex);
        }
        return savedOtp;
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = CusOtpException.class
    )
    public UUID verifyLoginOtp(CusCorporateOtpVerifyRequest request) {
        if (request == null
                || request.getChallengeGroupId() == null
                || request.getChallengeGroupId().isBlank()
                || request.getOtp() == null
                || request.getOtp().isBlank()) {
            throw new CusOtpException("OTP verification information is required.");
        }
        String rawOtp = request.getOtp();
        if (!rawOtp.matches("\\d{6}")) {
            throw new CusOtpException("OTP must be exactly 6 digits.");
        }

        OtpChallenge challenge = otpChallengesRepository
                .findFirstByChallengeGroupIdAndSubjectTypeAndPurposeOrderByOtpIdDesc(
                        request.getChallengeGroupId().trim(),
                        OtpSubjectType.CORPORATE_USER,
                        OtpPurpose.LOGIN
                )
                .orElseThrow(() -> new CusOtpException("Invalid OTP challenge."));

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
            throw new CusOtpException("Corporate user or company is not active or invalid.");
        }

        if (challenge.getStatus() == OtpStatus.CONSUMED) {
            throw new CusOtpException("This OTP has already been used.");
        }
        if (challenge.getStatus() == OtpStatus.EXPIRED) {
            throw new CusOtpException("OTP has expired.");
        }
        if (challenge.getStatus() == OtpStatus.BLOCKED) {
            throw new CusOtpException("OTP verification has been blocked.");
        }
        if (challenge.getStatus() != OtpStatus.ACTIVE) {
            throw new CusOtpException("OTP is not active.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (challenge.getExpiresAt() == null || !challenge.getExpiresAt().isAfter(now)) {
            challenge.setStatus(OtpStatus.EXPIRED);
            saveVerificationUpdate(challenge, UpdatedByType.SYSTEM, null);
            throw new CusOtpException("OTP has expired.");
        }
        if (challenge.getAttemptCount() >= challenge.getMaxAttempts()) {
            challenge.setStatus(OtpStatus.BLOCKED);
            saveVerificationUpdate(challenge, UpdatedByType.SYSTEM, null);
            throw new CusOtpException("OTP verification has been blocked.");
        }

        UUID corporateUserId = user.getCorporateUserId();
        if (!passwordEncoder.matches(rawOtp, challenge.getOtpHash())) {
            int attempts = challenge.getAttemptCount() + 1;
            challenge.setAttemptCount(attempts);
            if (attempts >= challenge.getMaxAttempts()) {
                challenge.setStatus(OtpStatus.BLOCKED);
            }
            saveVerificationUpdate(challenge, UpdatedByType.CORPORATE_USER, corporateUserId);
            throw new CusOtpException("Invalid OTP.");
        }

        challenge.setStatus(OtpStatus.CONSUMED);
        challenge.setConsumedAt(now);
        saveVerificationUpdate(challenge, UpdatedByType.CORPORATE_USER, corporateUserId);
        return corporateUserId;
    }

    private void saveVerificationUpdate(OtpChallenge challenge,
                                        UpdatedByType updatedByType, UUID updatedById) {
        challenge.setUpdatedByType(updatedByType);
        challenge.setUpdatedById(updatedById);
        otpChallengesRepository.save(challenge);
    }

    private String maskEmail(String email) {
        if (!email.contains("@")) {
            return "******";
        }
        String[] parts = email.split("@", 2);
        String masked = parts[0].length() <= 2
                ? "**@" + parts[1]
                : parts[0].substring(0, 2) + "****@" + parts[1];
        return masked.substring(0, Math.min(masked.length(), 100));
    }
}
