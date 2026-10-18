package com.corebanking.repository;

import com.corebanking.entity.CorporateAccountAccess;
import com.corebanking.entity.enums.CorporateAccessStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CusCorporateAccountAccessRepository
        extends JpaRepository<CorporateAccountAccess, UUID> {

    List<CorporateAccountAccess> findByCorporateUser_CorporateUserIdAndStatus(
            UUID corporateUserId,
            CorporateAccessStatus status
    );

    Optional<CorporateAccountAccess> findByCorporateUser_CorporateUserIdAndAccount_AccountIdAndStatus(
            UUID corporateUserId,
            UUID accountId,
            CorporateAccessStatus status
    );
}
