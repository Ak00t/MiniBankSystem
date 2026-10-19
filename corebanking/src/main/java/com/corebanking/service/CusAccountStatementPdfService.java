package com.corebanking.service;

import com.corebanking.dto.CusAccountStatementDTO;
import com.corebanking.dto.CusStatementRowDTO;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Presentation-only PDF Export Service for G1 Customer Account Statements.
 * Compiles the JRXML report once on application startup, caches the immutable
 * JasperReport in memory, and fills/exports statements on demand using JRBeanCollectionDataSource.
 */
@Slf4j
@Service
public class CusAccountStatementPdfService {

    public static final String JRXML_PATH = "reports/account_statement.jrxml";
    public static final String LOGO_PATH = "reports/assets/logo.png";

    private volatile JasperReport cachedReport;
    private volatile byte[] cachedLogoBytes;
    private final AtomicInteger compileCount = new AtomicInteger(0);

    @PostConstruct
    public void init() {
        compileAndCacheReport();
        loadAndCacheLogo();
    }

    /**
     * Compiles the JRXML template from classpath once and stores it in memory.
     */
    public synchronized void compileAndCacheReport() {
        if (cachedReport != null) {
            return;
        }
        log.info("Compiling G1 Account Statement JRXML template: {}", JRXML_PATH);
        long start = System.currentTimeMillis();
        try {
            ClassPathResource resource = new ClassPathResource(JRXML_PATH);
            if (!resource.exists()) {
                throw new IllegalStateException("JRXML template not found on classpath: " + JRXML_PATH);
            }
            try (InputStream is = resource.getInputStream()) {
                this.cachedReport = JasperCompileManager.compileReport(is);
                compileCount.incrementAndGet();
            }
            long duration = System.currentTimeMillis() - start;
            log.info("Successfully compiled JRXML in {} ms (compile count: {})", duration, compileCount.get());
        } catch (Exception e) {
            log.error("Failed to compile G1 Account Statement JRXML template", e);
            throw new RuntimeException("Failed to initialize Account Statement PDF report engine: " + e.getMessage(), e);
        }
    }

    /**
     * Loads the Customer Portal brand logo from classpath and caches it as a byte array.
     */
    public synchronized void loadAndCacheLogo() {
        if (cachedLogoBytes != null) {
            return;
        }
        try {
            ClassPathResource resource = new ClassPathResource(LOGO_PATH);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    this.cachedLogoBytes = is.readAllBytes();
                    log.info("Loaded brand logo from classpath: {} ({} bytes)", LOGO_PATH, cachedLogoBytes.length);
                }
            } else {
                log.warn("Brand logo not found on classpath: {}, report will render without embedded logo", LOGO_PATH);
            }
        } catch (Exception e) {
            log.warn("Could not load brand logo from classpath: {}. Report will proceed without logo.", LOGO_PATH, e);
        }
    }

    /**
     * Exports a CusAccountStatementDTO to PDF byte array using the cached JasperReport.
     * Thread-safe: parameters, datasource, and JasperPrint are created strictly within method scope.
     *
     * @param statement The populated statement DTO from CusAccountStatementService
     * @return Generated PDF byte array
     */
    public byte[] generateAccountStatementPdf(CusAccountStatementDTO statement) {
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
        parameters.put("GENERATED_DATE", LocalDate.now());

        if (cachedLogoBytes != null && cachedLogoBytes.length > 0) {
            parameters.put("LOGO", new ByteArrayInputStream(cachedLogoBytes));
        }

        List<CusStatementRowDTO> rows = statement.getTransactions();
        if (rows == null) {
            rows = Collections.emptyList();
        }

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(rows);

        try {
            JasperPrint jasperPrint = JasperFillManager.fillReport(report, parameters, dataSource);
            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (JRException e) {
            log.error("Failed to generate Account Statement PDF for account: {}", statement.getAccountNumber(), e);
            throw new RuntimeException("Failed to generate Account Statement PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Returns the cached JasperReport instance, compiling it on demand if not yet initialized.
     */
    public JasperReport getOrCompileReport() {
        if (cachedReport == null) {
            compileAndCacheReport();
        }
        return cachedReport;
    }

    /**
     * Returns the total number of times the JRXML was compiled (must be exactly 1 in normal execution).
     */
    public int getCompileCount() {
        return compileCount.get();
    }
}
