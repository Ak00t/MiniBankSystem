package com.corebanking.service;

import com.corebanking.dto.CusCorporateLoginRequest;
import com.corebanking.dto.CusCorporateLoginResponse;
import com.corebanking.entity.OtpChallenge;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CusCorporateAuthService {

    private final CusCorporateCredentialService corporateCredentialService;
    private final CusCorporateOtpService corporateOtpService;

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
}
