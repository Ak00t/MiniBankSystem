package com.corebanking.repository;

import com.corebanking.entity.CorporateUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CusCorporateUserRepository
        extends JpaRepository<CorporateUser, UUID> {

    @Query("""
            SELECT u FROM CorporateUser u
            JOIN u.companyInfo company
            JOIN company.customer customer
            WHERE customer.customerCode = :companyCustomerCode
              AND customer.customerType = com.corebanking.entity.enums.CustomerType.COMPANY
              AND u.corporateUserCode = :corporateUserCode
            """)
    Optional<CorporateUser> findForLogin(
            @Param("companyCustomerCode") String companyCustomerCode,
            @Param("corporateUserCode") String corporateUserCode
    );
}
