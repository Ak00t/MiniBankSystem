package com.corebanking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CusCorporateFirstLoginPasswordRequest {

    @NotBlank(message = "Challenge group ID is required")
    private String challengeGroupId;

    @NotBlank(message = "New password is required")
    private String newPassword;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;
}
