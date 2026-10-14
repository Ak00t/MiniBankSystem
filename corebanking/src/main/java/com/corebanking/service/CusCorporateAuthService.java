package com.corebanking.service;

import com.corebanking.dto.CusCorporateLoginRequest;
import com.corebanking.dto.CusCorporateLoginResponse;
import com.corebanking.dto.CusCorporateOtpVerifyRequest;
import com.corebanking.dto.CusCorporateOtpVerifyResponse;
import com.corebanking.dto.CusTokenResponse;
import com.corebanking.entity.CorporateCredential;
import com.corebanking.entity.OtpChallenge;
import com.corebanking.exception.CusAuthenticationException;
import com.corebanking.repository.CusCorporateCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CusCorporateAuthService {

    private final CusCorporateCredentialService corporateCredentialService;
    private final CusCorporateOtpService corporateOtpService;
    private final CusCorporateSessionService corporateSessionService;
    private final CusCorporateCredentialRepository corporateCredentialRepository;

    public CusCorporateLoginResponse login(CusCorporateLoginRequest request) {
        UUID corporateUserId = corporateCredentialService.authenticateCredentials(request);
        OtpChallenge challenge = corporateOtpService.createLoginOtp(corporateUserId);
        return new CusCorporateLoginResponse(
                true,
                "OTP has been sent to your registered email.",
                true,
                challenge.getChallengeGroupId()
        );
    }

    public UUID authenticateCredentials(CusCorporateLoginRequest request) {
        return corporateCredentialService.authenticateCredentials(request);
    }

    public CusCorporateOtpVerifyResponse verifyLoginOtp(CusCorporateOtpVerifyRequest request) {
        UUID corporateUserId = corporateOtpService.verifyLoginOtp(request);
        CorporateCredential credentials = corporateCredentialRepository.findById(corporateUserId)
                .orElseThrow(() -> new CusAuthenticationException("Invalid login credentials."));
        boolean passwordChangeRequired = credentials.isMustChangePassword();
        boolean pinSetupRequired = credentials.getTransactionPinHash() == null
                || credentials.getTransactionPinHash().isBlank();
        if (passwordChangeRequired || pinSetupRequired) {
            return new CusCorporateOtpVerifyResponse(
                    true,
                    "OTP verified. Please complete first-time setup.",
                    true,
                    passwordChangeRequired,
                    pinSetupRequired,
                    null,
                    null
            );
        }
        CusTokenResponse tokens = corporateSessionService.createAuthenticatedSession(
                request.getChallengeGroupId()
        );
        return completedLoginResponse(tokens, "OTP verified successfully.");
    }

    public CusCorporateOtpVerifyResponse completeFirstLogin(String challengeGroupId) {
        CusTokenResponse tokens = corporateSessionService.createAuthenticatedSession(challengeGroupId);
        return completedLoginResponse(tokens, "Login successful.");
    }

    private CusCorporateOtpVerifyResponse completedLoginResponse(CusTokenResponse tokens, String message) {
        return new CusCorporateOtpVerifyResponse(
                true, message, false, false, false, tokens.getAccessToken(), tokens.getRefreshToken()
        );
    }
}
