package com.corebanking.service;

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
