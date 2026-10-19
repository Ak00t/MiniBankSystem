package com.corebanking.repository;

import com.corebanking.entity.CorporateCredential;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CusCorporateCredentialRepository
        extends JpaRepository<CorporateCredential, UUID> {

    /**
     * Call within a write transaction that also updates the login counters.
     * The row lock is held until that transaction completes.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT c FROM CorporateCredential c
            WHERE c.corporateUserId = :corporateUserId
            """)
    Optional<CorporateCredential> findByCorporateUserIdForUpdate(
            @Param("corporateUserId") UUID corporateUserId
    );
}
