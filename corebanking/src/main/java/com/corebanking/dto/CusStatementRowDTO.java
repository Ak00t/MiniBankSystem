package com.corebanking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * G1 Customer Account Statement - Transaction Movement Row DTO.
 * Represents a single posted ledger movement for the selected customer account.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CusStatementRowDTO {

    private LocalDateTime transactionDate;
    private String transactionRef;
    private String description;
    private BigDecimal creditAmount;
    private BigDecimal debitAmount;
    private BigDecimal balance;
}
