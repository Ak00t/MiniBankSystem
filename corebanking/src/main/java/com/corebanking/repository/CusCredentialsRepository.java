package com.corebanking.repository;

import com.corebanking.entity.CustomerCredentials;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CusCredentialsRepository
        extends JpaRepository<CustomerCredentials, UUID> {

    /**
     * Stable Customer LOGIN lock. Fetch the owner in the locking read so status
     * validation does not reuse a pre-lock snapshot under MySQL REPEATABLE READ.
     * Call inside the transaction that performs the authentication updates.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT c FROM CustomerCredentials c
            JOIN FETCH c.customer
            WHERE c.customerId = :customerId
            """)
    Optional<CustomerCredentials> findByCustomerIdForUpdate(@Param("customerId") UUID customerId);
}
