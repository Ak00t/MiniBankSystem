package com.corebanking.service;

import com.corebanking.dto.CusCorporateLoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CusCorporateAuthService {

    private final CusCorporateCredentialService corporateCredentialService;

    public UUID authenticateCredentials(CusCorporateLoginRequest request) {
        return corporateCredentialService.authenticateCredentials(request);
    }
}
