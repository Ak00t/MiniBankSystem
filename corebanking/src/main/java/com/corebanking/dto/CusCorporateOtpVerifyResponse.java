package com.corebanking.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CusCorporateOtpVerifyResponse {

    private boolean success;

    private String message;

    private boolean firstLogin;

    private boolean passwordChangeRequired;

    private boolean pinSetupRequired;

    private String accessToken;

    private String refreshToken;
}
