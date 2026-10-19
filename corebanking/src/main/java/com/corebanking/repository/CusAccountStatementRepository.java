package com.corebanking.repository;

import com.corebanking.dto.CusAccountStatementDTO;
import com.corebanking.dto.CusStatementRowDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Repository for G1 Customer Account Statement.
 * Executes the dedicated stored procedure `sp_get_customer_account_statement`
 * and maps the two returned ResultSets into G1 DTOs.
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class CusAccountStatementRepository {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Executes the stored procedure to retrieve the customer account statement.
     *
     * @param customerId    Authenticated customer UUID
     * @param accountNumber Selected account number
     * @param fromDate      Statement start date (inclusive)
     * @param toDate        Statement end date (inclusive)
     * @return Mapped statement DTO with header, summary, and transaction rows
     * @throws DataAccessException if execution fails or SP raises SQLSTATE '45000'
     */
    public CusAccountStatementDTO getAccountStatement(
            UUID customerId,
            String accountNumber,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        log.debug("Executing sp_get_customer_account_statement for customer: {}, account: {}, from: {}, to: {}",
                customerId, accountNumber, fromDate, toDate);

        return jdbcTemplate.execute((Connection con) -> {
            CallableStatement cs = con.prepareCall("{CALL sp_get_customer_account_statement(?, ?, ?, ?)}");
            cs.setString(1, customerId.toString());
            cs.setString(2, accountNumber);
            cs.setDate(3, java.sql.Date.valueOf(fromDate));
            cs.setDate(4, java.sql.Date.valueOf(toDate));
            return cs;
        }, (CallableStatement cs) -> {
            boolean hasRs = cs.execute();
            CusAccountStatementDTO statement = null;
            List<CusStatementRowDTO> rows = new ArrayList<>();

            // -------------------------------------------------------------
            // Result Set 1: Header & Summary
            // -------------------------------------------------------------
            if (hasRs) {
                try (ResultSet rs = cs.getResultSet()) {
                    if (rs.next()) {
                        java.sql.Date sqlFromDate = rs.getDate("from_date");
                        java.sql.Date sqlToDate = rs.getDate("to_date");

                        statement = CusAccountStatementDTO.builder()
                                .accountNumber(rs.getString("account_number"))
                                .accountType(rs.getString("account_type"))
                                .customerName(rs.getString("customer_name"))
                                .phone(rs.getString("phone"))
                                .nrc(rs.getString("nrc"))
                                .currency(rs.getString("currency"))
                                .fromDate(sqlFromDate != null ? sqlFromDate.toLocalDate() : null)
                                .toDate(sqlToDate != null ? sqlToDate.toLocalDate() : null)
                                .openingBalance(rs.getBigDecimal("opening_balance"))
                                .closingBalance(rs.getBigDecimal("closing_balance"))
                                .numberOfCreditEntries(rs.getInt("number_of_credit_entries"))
                                .totalCredit(rs.getBigDecimal("total_credit"))
                                .numberOfDebitEntries(rs.getInt("number_of_debit_entries"))
                                .totalDebit(rs.getBigDecimal("total_debit"))
                                .build();
                    }
                }
                hasRs = cs.getMoreResults();
            }

            // -------------------------------------------------------------
            // Result Set 2: Transaction Rows
            // -------------------------------------------------------------
            if (hasRs) {
                try (ResultSet rs = cs.getResultSet()) {
                    while (rs.next()) {
                        Timestamp txnTimestamp = rs.getTimestamp("transaction_date");

                        rows.add(CusStatementRowDTO.builder()
                                .transactionDate(txnTimestamp != null ? txnTimestamp.toLocalDateTime() : null)
                                .transactionRef(rs.getString("transaction_ref"))
                                .description(rs.getString("description"))
                                .creditAmount(rs.getBigDecimal("credit_amount"))
                                .debitAmount(rs.getBigDecimal("debit_amount"))
                                .balance(rs.getBigDecimal("balance"))
                                .build());
                    }
                }
            }

            if (statement != null) {
                statement.setTransactions(rows);
            }

            return statement;
        });
    }
}
