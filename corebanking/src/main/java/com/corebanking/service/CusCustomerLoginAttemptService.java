package com.corebanking.service;

import com.corebanking.entity.Customers;
import com.corebanking.entity.LoginAttempt;
import com.corebanking.entity.enums.SessionSubjectType;
import com.corebanking.repository.CusLoginAttemptsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Persists Customer login history at the existing facade call sites.
 * Transaction ownership and rollback rules remain with the caller.
 */
@Service
@RequiredArgsConstructor
public class CusCustomerLoginAttemptService {

    private final CusLoginAttemptsRepository loginAttemptsRepository;

    public void saveLoginAttempt(
            String identifier,
            Customers customer,
            boolean success,
            String failureReason) {

        LoginAttempt attempt =
                LoginAttempt.builder()

                        .actorType(
                                SessionSubjectType.CUSTOMER
                        )

                        .loginIdentifier(
                                identifier
                        )

                        .customer(
                                customer
                        )

                        .success(
                                success
                        )

                        .failureReason(
                                failureReason
                        )

                        .build();


        loginAttemptsRepository.save(
                attempt
        );
    }


    public void saveInvalidLoginAttempt(
            String identifier,
            String failureReason) {

        LoginAttempt attempt =
                LoginAttempt.builder()

                        .actorType(
                                SessionSubjectType.CUSTOMER
                        )

                        .loginIdentifier(
                                identifier
                        )

                        .success(false)

                        .failureReason(
                                failureReason
                        )

                        .build();


        loginAttemptsRepository.save(
                attempt
        );
    }
}
