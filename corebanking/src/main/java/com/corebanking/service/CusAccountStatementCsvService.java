package com.corebanking.service;

import com.corebanking.dto.CusAccountStatementDTO;
import com.corebanking.dto.CusStatementRowDTO;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.JRCsvExporter;
import net.sf.jasperreports.export.SimpleCsvExporterConfiguration;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleWriterExporterOutput;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Presentation-only CSV Export Service for G1 Customer Account Statements.
 * Compiles the dedicated CSV JRXML template once on application startup, caches
 * the immutable JasperReport in memory, and exports statements to clean CSV format.
 */
@Slf4j
@Service
public class CusAccountStatementCsvService {

    public static final String CSV_JRXML_PATH = "reports/account_statement_csv.jrxml";

    private volatile JasperReport cachedReport;
    private final AtomicInteger compileCount = new AtomicInteger(0);

    @PostConstruct
    public void init() {
        compileAndCacheReport();
    }

    /**
     * Compiles the CSV JRXML template from classpath once and stores it in memory.
     */
    public synchronized void compileAndCacheReport() {
        if (cachedReport != null) {
            return;
        }
        log.info("Compiling G1 Account Statement CSV JRXML template: {}", CSV_JRXML_PATH);
        long start = System.currentTimeMillis();
        try {
            ClassPathResource resource = new ClassPathResource(CSV_JRXML_PATH);
            if (!resource.exists()) {
                throw new IllegalStateException("CSV JRXML template not found on classpath: " + CSV_JRXML_PATH);
            }
            try (InputStream is = resource.getInputStream()) {
                this.cachedReport = JasperCompileManager.compileReport(is);
                compileCount.incrementAndGet();
            }
            long duration = System.currentTimeMillis() - start;
            log.info("Successfully compiled CSV JRXML in {} ms (compile count: {})", duration, compileCount.get());
        } catch (Exception e) {
            log.error("Failed to compile G1 Account Statement CSV JRXML template", e);
            throw new RuntimeException("Failed to initialize Account Statement CSV report engine: " + e.getMessage(), e);
        }
    }

    /**
     * Exports a CusAccountStatementDTO to CSV byte array using the cached JasperReport.
     * Thread-safe: parameters, datasource, and JasperPrint are created strictly within method scope.
     *
     * @param statement The populated statement DTO from CusAccountStatementService
     * @return Generated CSV byte array encoded in UTF-8
     */
    public byte[] generateAccountStatementCsv(CusAccountStatementDTO statement) {
        if (statement == null) {
            throw new IllegalArgumentException("Statement data cannot be null");
        }

        JasperReport report = getOrCompileReport();

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("CUSTOMER_NAME", statement.getCustomerName());
        parameters.put("PHONE", statement.getPhone());
        parameters.put("NRC", statement.getNrc());
        parameters.put("ACCOUNT_NUMBER", statement.getAccountNumber());
        parameters.put("ACCOUNT_TYPE", statement.getAccountType());
        parameters.put("CURRENCY", statement.getCurrency());
        parameters.put("FROM_DATE", statement.getFromDate());
        parameters.put("TO_DATE", statement.getToDate());
        parameters.put("OPENING_BALANCE", statement.getOpeningBalance());
        parameters.put("CLOSING_BALANCE", statement.getClosingBalance());
        parameters.put("NUMBER_OF_CREDIT_ENTRIES", statement.getNumberOfCreditEntries());
        parameters.put("TOTAL_CREDIT", statement.getTotalCredit());
        parameters.put("NUMBER_OF_DEBIT_ENTRIES", statement.getNumberOfDebitEntries());
        parameters.put("TOTAL_DEBIT", statement.getTotalDebit());

        List<CusStatementRowDTO> rows = statement.getTransactions();
        if (rows == null) {
            rows = Collections.emptyList();
        }

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(rows);

        try {
            JasperPrint jasperPrint = JasperFillManager.fillReport(report, parameters, dataSource);

            JRCsvExporter exporter = new JRCsvExporter();
            exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            exporter.setExporterOutput(new SimpleWriterExporterOutput(baos, StandardCharsets.UTF_8.name()));

            SimpleCsvExporterConfiguration config = new SimpleCsvExporterConfiguration();
            config.setFieldDelimiter(",");
            config.setRecordDelimiter("\n");
            exporter.setConfiguration(config);

            exporter.exportReport();

            String rawCsv = baos.toString(StandardCharsets.UTF_8);
            String formattedCsv = formatCsvStructure(rawCsv);
            return formattedCsv.getBytes(StandardCharsets.UTF_8);

        } catch (JRException e) {
            log.error("Failed to generate Account Statement CSV for account: {}", statement.getAccountNumber(), e);
            throw new RuntimeException("Failed to generate Account Statement CSV: " + e.getMessage(), e);
        }
    }

    /**
     * Cleans metadata trailing grid delimiters and ensures standard blank line spacing:
     * - Trims trailing empty commas on single key-value metadata rows.
     * - Inserts a blank line before the table header and a blank line before closing balance.
     */
    private String formatCsvStructure(String rawCsv) {
        String[] lines = rawCsv.split("\r?\n");
        StringBuilder sb = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }

            // Clean trailing empty commas on metadata rows
            if (isMetadataRow(line)) {
                line = line.replaceAll(",+$", "");
            }

            // Insert blank line before table header
            if (line.startsWith("Transaction Date & Time,")) {
                sb.append("\n");
            }
            // Insert blank line before summary block
            else if (line.startsWith("Closing Balance,")) {
                sb.append("\n");
            }

            sb.append(line).append("\n");
        }

        return sb.toString();
    }

    private boolean isMetadataRow(String line) {
        return line.startsWith("Account Number,") ||
               line.startsWith("Account Type,") ||
               line.startsWith("Account Holder Name,") ||
               line.startsWith("Phone Number,") ||
               line.startsWith("NRC,") ||
               line.startsWith("Currency,") ||
               line.startsWith("From Date,") ||
               line.startsWith("To Date,") ||
               line.startsWith("Opening Balance,") ||
               line.startsWith("Closing Balance,") ||
               line.startsWith("No. of Credit,") ||
               line.startsWith("Credit Total,") ||
               line.startsWith("No. of Debit,") ||
               line.startsWith("Debit Total,");
    }

    public JasperReport getOrCompileReport() {
        if (cachedReport == null) {
            compileAndCacheReport();
        }
        return cachedReport;
    }

    public int getCompileCount() {
        return compileCount.get();
    }
}
