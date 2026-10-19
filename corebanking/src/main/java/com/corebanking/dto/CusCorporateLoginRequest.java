package com.corebanking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CusCorporateLoginRequest {

    @NotBlank(message = "Company customer code is required")
    private String companyCustomerCode;

    @NotBlank(message = "Corporate user code is required")
    private String corporateUserCode;

    @NotBlank(message = "Password is required")
    private String password;
}
