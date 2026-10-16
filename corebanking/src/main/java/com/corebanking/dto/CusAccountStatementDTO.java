package com.corebanking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * G1 Customer Account Statement DTO.
 * Encapsulates the header/summary statement result (RS1) and ordered transaction rows (RS2).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CusAccountStatementDTO {

    private String accountNumber;
    private String accountType;
    private String customerName;
    private String phone;
    private String nrc;
    private String currency;
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
    private Integer numberOfCreditEntries;
    private BigDecimal totalCredit;
    private Integer numberOfDebitEntries;
    private BigDecimal totalDebit;

    @Builder.Default
    private List<CusStatementRowDTO> transactions = new ArrayList<>();
}
