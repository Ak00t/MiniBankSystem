package com.corebanking.repository;

import com.corebanking.entity.AuthSessions;

import jakarta.persistence.LockModeType; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock; 
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface AuthSessionsRepository
        extends JpaRepository<AuthSessions, UUID> {

    Optional<AuthSessions> findBySessionUuid(
            String sessionUuid
    );

   
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AuthSessions> findByRefreshTokenHash(
            String refreshTokenHash
    );
    
    
    @Modifying
    @Query("UPDATE AuthSessions a SET a.revokedAt = CURRENT_TIMESTAMP, a.revokeReason = 'Security Breach: Token Reuse Detected' WHERE a.staff.staffId = :staffId AND a.revokedAt IS NULL")
    void revokeAllActiveSessionsByStaffId(@Param("staffId") UUID staffId);
}