package com.corebanking.service;

import com.corebanking.dto.CusCorporateFirstLoginPasswordRequest;
import com.corebanking.dto.CusCorporatePinSetupRequest;
import com.corebanking.entity.CorporateCredential;
import com.corebanking.entity.CorporateUser;
import com.corebanking.entity.Customers;
import com.corebanking.entity.OtpChallenge;
import com.corebanking.entity.enums.CorporateUserStatus;
import com.corebanking.entity.enums.CustomerStatus;
import com.corebanking.entity.enums.CustomerType;
import com.corebanking.entity.enums.OtpPurpose;
import com.corebanking.entity.enums.OtpStatus;
import com.corebanking.entity.enums.OtpSubjectType;
import com.corebanking.entity.enums.UpdatedByType;
import com.corebanking.exception.CusAuthenticationException;
import com.corebanking.exception.CusOtpException;
import com.corebanking.exception.CusSessionExpiredException;
import com.corebanking.exception.CusValidationException;
import com.corebanking.repository.CusCorporateCredentialRepository;
import com.corebanking.repository.CusOtpChallengesRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CusCorporateFirstLoginService {

    private static final int SETUP_WINDOW_MINUTES = 10;
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 10;

    private final CusOtpChallengesRepository otpChallengesRepository;
    private final CusCorporateCredentialRepository corporateCredentialRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Returns true if transaction PIN setup is still required.
     * Call through the injected Spring bean so the transaction applies.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean changeFirstLoginPassword(CusCorporateFirstLoginPasswordRequest request) {
        if (request == null
                || request.getChallengeGroupId() == null
                || request.getChallengeGroupId().isBlank()
                || request.getNewPassword() == null
                || request.getNewPassword().isBlank()
                || request.getConfirmPassword() == null
                || request.getConfirmPassword().isBlank()) {
            throw new CusValidationException("All password setup fields are required.");
        }
        String newPassword = request.getNewPassword();
        if (!newPassword.equals(request.getConfirmPassword())) {
            throw new CusValidationException("New password and confirm password do not match.");
        }

        String challengeGroupId = request.getChallengeGroupId().trim();
        UUID corporateUserId = resolveCorporateUserId(challengeGroupId);
        // Discard provisional entities before the authoritative locking reads.
        entityManager.clear();
        CorporateCredential credentials = corporateCredentialRepository
                .findByCorporateUserIdForUpdate(corporateUserId)
                .orElseThrow(() -> new CusAuthenticationException("Invalid login credentials."));
        validateCurrentLoginGroup(corporateUserId, challengeGroupId);

        OtpChallenge challenge = otpChallengesRepository
                .findFirstByChallengeGroupIdAndSubjectTypeAndPurposeOrderByOtpIdDesc(
                        challengeGroupId,
                        OtpSubjectType.CORPORATE_USER,
                        OtpPurpose.LOGIN
                )
                .orElseThrow(() -> new CusOtpException("Invalid OTP challenge."));
        validateSetupBinding(challenge);

        CorporateUser user = challenge.getCorporateUser();
        if (user == null || !corporateUserId.equals(user.getCorporateUserId())
                || challenge.getCustomer() != null) {
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

        validateSetupBinding(challenge);
        if (!credentials.isMustChangePassword()) {
            throw new CusValidationException("Password change is not required.");
        }
        if (passwordEncoder.matches(newPassword, credentials.getPasswordHash())) {
            throw new CusValidationException("New password must be different from the temporary password.");
        }
        if (!isValidPassword(newPassword)) {
            throw new CusValidationException(
                    "Password must contain between 8 and 10 characters, "
                            + "including at least one uppercase letter, "
                            + "one lowercase letter, one number, "
                            + "and one special character. Whitespace is not allowed."
            );
        }

        credentials.setPasswordHash(passwordEncoder.encode(newPassword));
        credentials.setMustChangePassword(false);
        credentials.setPasswordChangedAt(LocalDateTime.now());
        credentials.setUpdatedByType(UpdatedByType.CORPORATE_USER);
        credentials.setUpdatedById(corporateUserId);
        corporateCredentialRepository.save(credentials);

        return credentials.getTransactionPinHash() == null
                || credentials.getTransactionPinHash().isBlank();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void setupTransactionPin(CusCorporatePinSetupRequest request) {
        if (request == null
                || request.getChallengeGroupId() == null
                || request.getChallengeGroupId().isBlank()
                || request.getTransactionPin() == null
                || request.getTransactionPin().isBlank()
                || request.getConfirmTransactionPin() == null
                || request.getConfirmTransactionPin().isBlank()) {
            throw new CusValidationException("All PIN setup fields are required.");
        }
        String transactionPin = request.getTransactionPin();
        if (!transactionPin.equals(request.getConfirmTransactionPin())) {
            throw new CusValidationException("PIN and confirm PIN do not match.");
        }
        if (!transactionPin.matches("\\d{6}")) {
            throw new CusValidationException("Transaction PIN must be exactly 6 digits.");
        }

        String challengeGroupId = request.getChallengeGroupId().trim();
        UUID corporateUserId = resolveCorporateUserId(challengeGroupId);
        // Discard provisional entities before the authoritative locking reads.
        entityManager.clear();
        CorporateCredential credentials = corporateCredentialRepository
                .findByCorporateUserIdForUpdate(corporateUserId)
                .orElseThrow(() -> new CusAuthenticationException("Invalid login credentials."));
        validateCurrentLoginGroup(corporateUserId, challengeGroupId);

        OtpChallenge challenge = otpChallengesRepository
                .findFirstByChallengeGroupIdAndSubjectTypeAndPurposeOrderByOtpIdDesc(
                        challengeGroupId,
                        OtpSubjectType.CORPORATE_USER,
                        OtpPurpose.LOGIN
                )
                .orElseThrow(() -> new CusOtpException("Invalid OTP challenge."));
        validateSetupBinding(challenge);

        CorporateUser user = challenge.getCorporateUser();
        if (user == null || !corporateUserId.equals(user.getCorporateUserId())
                || challenge.getCustomer() != null) {
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

        validateSetupBinding(challenge);
        if (credentials.isMustChangePassword()) {
            throw new CusValidationException(
                    "Please change the temporary password before setting the transaction PIN."
            );
        }
        if (credentials.getTransactionPinHash() != null
                && !credentials.getTransactionPinHash().isBlank()) {
            throw new CusValidationException("Transaction PIN has already been set.");
        }

        credentials.setTransactionPinHash(passwordEncoder.encode(transactionPin));
        credentials.setPinChangedAt(LocalDateTime.now());
        credentials.setFailedPinAttemptCount(0);
        credentials.setPinLockedUntil(null);
        credentials.setUpdatedByType(UpdatedByType.CORPORATE_USER);
        credentials.setUpdatedById(corporateUserId);
        corporateCredentialRepository.save(credentials);
    }

    private UUID resolveCorporateUserId(String challengeGroupId) {
        OtpChallenge provisional = otpChallengesRepository
                .findTopByChallengeGroupIdAndSubjectTypeAndPurposeOrderByOtpIdDesc(
                        challengeGroupId, OtpSubjectType.CORPORATE_USER, OtpPurpose.LOGIN)
                .orElseThrow(() -> new CusOtpException("Invalid OTP challenge."));
        CorporateUser user = provisional.getCorporateUser();
        if (user == null || user.getCorporateUserId() == null || provisional.getCustomer() != null) {
            throw new CusOtpException("Invalid corporate OTP challenge.");
        }
        return user.getCorporateUserId();
    }

    private void validateCurrentLoginGroup(UUID corporateUserId, String challengeGroupId) {
        OtpChallenge original = otpChallengesRepository
                .findFirstByCorporateUser_CorporateUserIdAndSubjectTypeAndPurposeAndResendNoOrderByOtpIdDesc(
                        corporateUserId, OtpSubjectType.CORPORATE_USER, OtpPurpose.LOGIN, 0)
                .orElseThrow(() -> new CusOtpException("Invalid current login challenge. Please login again."));
        if (!challengeGroupId.equals(original.getChallengeGroupId())) {
            throw new CusOtpException("This login challenge has been superseded. Please login again.");
        }
    }

    private void validateSetupBinding(OtpChallenge challenge) {
        if (challenge.getStatus() != OtpStatus.CONSUMED) {
            throw new CusOtpException("OTP verification is required.");
        }
        if (challenge.getConsumedAt() == null
                || challenge.getConsumedAt().plusMinutes(SETUP_WINDOW_MINUTES)
                        .isBefore(LocalDateTime.now())) {
            throw new CusSessionExpiredException(
                    "First-login setup session has expired. Please login again."
            );
        }
    }

    private boolean isValidPassword(String password) {
        if (password == null
                || password.length() < MIN_PASSWORD_LENGTH
                || password.length() > MAX_PASSWORD_LENGTH
                || password.matches(".*\\s.*")) {
            return false;
        }
        return password.matches(".*[A-Z].*")
                && password.matches(".*[a-z].*")
                && password.matches(".*\\d.*")
                && password.matches(".*[^A-Za-z0-9\\s].*");
    }
}
