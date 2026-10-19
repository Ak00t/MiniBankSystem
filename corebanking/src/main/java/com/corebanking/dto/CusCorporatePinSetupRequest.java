package com.corebanking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CusCorporatePinSetupRequest {

    @NotBlank(message = "Challenge group ID is required")
    private String challengeGroupId;

    @NotBlank(message = "Transaction PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "Transaction PIN must be exactly 6 digits")
    private String transactionPin;

    @NotBlank(message = "Confirm transaction PIN is required")
    private String confirmTransactionPin;
}
