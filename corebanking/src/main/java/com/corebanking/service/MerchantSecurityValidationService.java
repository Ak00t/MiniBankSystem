package com.corebanking.service;

import com.corebanking.entity.CustomerCredentials;
import com.corebanking.exception.CusAccountLockedException;
import com.corebanking.exception.InvalidPinException;
import com.corebanking.repository.CustomerCredentialsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * MerchantSecurityValidationService
 * Dedicated PIN validation and security enforcement for Merchant Payment Authorization.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantSecurityValidationService {

    private final CustomerCredentialsRepository credentialsRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerSecurityService customerSecurityService; // Integrates with Member 1's lock service

    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = {SecurityException.class, CusAccountLockedException.class, InvalidPinException.class})
    public void validateTransactionPin(UUID customerId, String rawPin) {
        CustomerCredentials credentials = credentialsRepository.findById(customerId)
                .orElseThrow(() -> new SecurityException("Customer credentials not found"));

        if (credentials.getPinLockedUntil() != null && credentials.getPinLockedUntil().isAfter(LocalDateTime.now())) {
            log.warn("PIN validation blocked: Customer {} is locked until {}", customerId, credentials.getPinLockedUntil());
            throw new CusAccountLockedException("PIN locked due to excessive failed attempts. Please reset your PIN via OTP.");
        }

        if (credentials.getTransactionPinHash() == null || !passwordEncoder.matches(rawPin, credentials.getTransactionPinHash())) {
            log.warn("Invalid transaction PIN for customer {}", customerId);
            // Delegate to Member 1's official lock logic
            customerSecurityService.recordFailedPinAttemptAndCheckLock(customerId);
            throw new InvalidPinException("Invalid Transaction PIN. Please try again.");
        }

        // PIN is correct, reset failure counter using Member 1's reset logic
        customerSecurityService.resetFailedPinCount(customerId);
    }
}
