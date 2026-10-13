package com.corebanking.security.audit;

import com.corebanking.entity.AuditLogs;
import com.corebanking.entity.enums.ActorType;
import com.corebanking.repository.AuditLogsRepository;
import com.corebanking.repository.CustomerRepository;
import com.corebanking.repository.StaffUsersRepository;
import com.corebanking.security.audit.dto.AuditSearchCriteria;
import com.corebanking.security.audit.service.AuditTrailServiceImpl;
import com.corebanking.security.audit.util.AuditContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * High-performance Unit and Functional Test suite for {@link AuditTrailServiceImpl}.
 * Validates immutable logging, JSON serialization, defensive error boundaries,
 * and dynamic search criteria execution.
 */
@ExtendWith(MockitoExtension.class)
class AuditTrailServiceTest {

    @Mock
    private AuditLogsRepository auditLogsRepository;

    @Mock
    private StaffUsersRepository staffUsersRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AuditTrailServiceImpl auditTrailService;

    @Test
    @DisplayName("Unit Test 1: logDataChange correctly serializes before/after states into JSON")
    void testLogDataChange_SerializesJsonDiffs() {
        // Arrange
        Map<String, Object> oldState = Map.of("accountNumber", "1001000001", "status", "ACTIVE", "balance", 500000);
        Map<String, Object> newState = Map.of("accountNumber", "1001000001", "status", "FROZEN", "balance", 500000);

        // Act
        auditTrailService.logDataChange(
                "FREEZE_ACCOUNT",
                "ACCOUNT",
                "1001000001",
                oldState,
                newState,
                "Account frozen by compliance officer"
        );

        // Assert
        ArgumentCaptor<AuditLogs> captor = ArgumentCaptor.forClass(AuditLogs.class);
        verify(auditLogsRepository, times(1)).save(captor.capture());

        AuditLogs captured = captor.getValue();
        assertThat(captured.getActionType()).isEqualTo("FREEZE_ACCOUNT");
        assertThat(captured.getEntityType()).isEqualTo("ACCOUNT");
        assertThat(captured.getEntityId()).isEqualTo("1001000001");
        assertThat(captured.getActionCategory()).isEqualTo("ACCOUNT");
        assertThat(captured.getOldValues()).contains("\"status\":\"ACTIVE\"");
        assertThat(captured.getNewValues()).contains("\"status\":\"FROZEN\"");
        assertThat(captured.getDescription()).isEqualTo("Account frozen by compliance officer");
        assertThat(captured.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Unit Test 2: logActivity records high-level operational events")
    void testLogActivity_RecordsEvent() {
        // Act
        auditTrailService.logActivity(
                "SECURITY",
                "ADMIN_PASSWORD_RESET",
                "Password reset requested for staff member"
        );

        // Assert
        ArgumentCaptor<AuditLogs> captor = ArgumentCaptor.forClass(AuditLogs.class);
        verify(auditLogsRepository, times(1)).save(captor.capture());

        AuditLogs captured = captor.getValue();
        assertThat(captured.getActionCategory()).isEqualTo("SECURITY");
        assertThat(captured.getActionType()).isEqualTo("ADMIN_PASSWORD_RESET");
        assertThat(captured.getDescription()).isEqualTo("Password reset requested for staff member");
    }

    @Test
    @DisplayName("Unit Test 3: logActivity with entity details captures target entity")
    void testLogActivity_WithEntityDetails() {
        // Act
        auditTrailService.logActivity(
                "TRANSACTION",
                "EXPORT_STATEMENT",
                "ACCOUNT",
                "ACC-554433",
                "Monthly account statement exported as PDF"
        );

        // Assert
        ArgumentCaptor<AuditLogs> captor = ArgumentCaptor.forClass(AuditLogs.class);
        verify(auditLogsRepository, times(1)).save(captor.capture());

        AuditLogs captured = captor.getValue();
        assertThat(captured.getActionCategory()).isEqualTo("TRANSACTION");
        assertThat(captured.getActionType()).isEqualTo("EXPORT_STATEMENT");
        assertThat(captured.getEntityType()).isEqualTo("ACCOUNT");
        assertThat(captured.getEntityId()).isEqualTo("ACC-554433");
    }

    @Test
    @DisplayName("Unit Test 4: searchAuditLogs delegates to dynamic JPA specification and pagination")
    void testSearchAuditLogs_PaginationAndFiltering() {
        // Arrange
        AuditSearchCriteria criteria = AuditSearchCriteria.builder()
                .actionCategory("SECURITY")
                .actionType("STAFF_LOGIN")
                .startDate(LocalDateTime.now().minusDays(7))
                .endDate(LocalDateTime.now())
                .build();
        Pageable pageable = PageRequest.of(0, 10);

        AuditLogs mockLog = AuditLogs.builder()
                .auditId(101L)
                .actionType("STAFF_LOGIN")
                .build();
        when(auditLogsRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(mockLog)));

        // Act
        Page<AuditLogs> result = auditTrailService.searchAuditLogs(criteria, pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getAuditId()).isEqualTo(101L);
        verify(auditLogsRepository, times(1)).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("Unit Test 5: Defensive Error Handling suppresses DB exceptions so business logic never fails")
    void testDefensiveHandling_NeverFailsBusinessTransaction() {
        // Arrange
        doThrow(new RuntimeException("Simulated Database Outage"))
                .when(auditLogsRepository).save(any(AuditLogs.class));

        // Act & Assert - must not throw exception
        assertThatCode(() -> auditTrailService.logDataChange(
                "UPDATE_STATUS",
                "ACCOUNT",
                "1001000002",
                Map.of("status", "ACTIVE"),
                Map.of("status", "CLOSED"),
                "Account closure"
        )).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Unit Test 6: AuditContextUtil handles out-of-scope non-web context safely")
    void testAuditContextUtil_SafeFallbacks() {
        // When running in isolated test or async worker with no active web request:
        assertThat(AuditContextUtil.getClientIpAddress()).isEqualTo("127.0.0.1");
        assertThat(AuditContextUtil.getUserAgent()).isEqualTo("SYSTEM");
        assertThat(AuditContextUtil.getRequestUrl()).isEqualTo("SYSTEM_TASK");
        assertThat(AuditContextUtil.resolveActorType()).isEqualTo(ActorType.SYSTEM);
    }
}
