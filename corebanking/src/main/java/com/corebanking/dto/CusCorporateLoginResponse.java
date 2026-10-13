package com.corebanking.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CusCorporateLoginResponse {

    private boolean success;

    private String message;

    private boolean otpRequired;

    private String challengeGroupId;
}
