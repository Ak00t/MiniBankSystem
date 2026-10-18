package com.corebanking.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtcTransactionRequestDto {

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotNull(message = "Transaction amount is required")
    @DecimalMin(value = "100.00", message = "Minimum transaction amount is 100 MMK")
    private BigDecimal amount;

    private String currency; // default MMK if null

    private String remark;

    private String depositorOrWithdrawerName; // Over the counter person's name

    private String nrcOrId; // Identity number of the person at counter
}
