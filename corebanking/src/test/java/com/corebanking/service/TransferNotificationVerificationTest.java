package com.corebanking.service;

import com.corebanking.dto.NotificationResponseDto;
import com.corebanking.entity.Accounts;
import com.corebanking.entity.BankTransactions;
import com.corebanking.entity.Customers;
import com.corebanking.entity.Notifications;
import com.corebanking.entity.enums.NotificationType;
import com.corebanking.entity.enums.TransactionType;
import com.corebanking.repository.BankTransactionRepository;
import com.corebanking.repository.CustomerRepository;
import com.corebanking.repository.NotificationRepository;
import com.corebanking.websocket.NotificationWebSocketHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TransferNotificationVerificationTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationWebSocketHandler notificationWebSocketHandler;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BankTransactionRepository bankTransactionRepository;

    private AsyncNotificationService asyncNotificationService;

    private Customers sender;
    private Customers receiver;
    private Accounts sourceAccount;
    private Accounts destAccount;
    private BankTransactions transaction;

    private final UUID senderId = UUID.randomUUID();
    private final UUID receiverId = UUID.randomUUID();
    private final UUID txnId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        asyncNotificationService = new AsyncNotificationService(
                notificationRepository,
                notificationWebSocketHandler,
                customerRepository,
                bankTransactionRepository
        );

        sender = Customers.builder()
                .customerId(senderId)
                .fullName("U Ba")
                .build();

        receiver = Customers.builder()
                .customerId(receiverId)
                .fullName("Daw Mya")
                .build();

        sourceAccount = Accounts.builder()
                .accountNumber("2001111111")
                .customer(sender)
                .build();

        destAccount = Accounts.builder()
                .accountNumber("2002222222")
                .customer(receiver)
                .build();

        transaction = BankTransactions.builder()
                .transactionId(txnId)
                .transactionRef("TXN-P2P-20261021-0001")
                .transactionType(TransactionType.INTERNAL_TRANSFER)
                .sourceAccount(sourceAccount)
                .destinationAccount(destAccount)
                .amount(new BigDecimal("50000.0000"))
                .serviceFee(BigDecimal.ZERO)
                .currency("MMK")
                .completedAt(LocalDateTime.now())
                .build();

        when(customerRepository.findById(senderId)).thenReturn(Optional.of(sender));
        when(customerRepository.findById(receiverId)).thenReturn(Optional.of(receiver));
        when(bankTransactionRepository.findById(txnId)).thenReturn(Optional.of(transaction));

        when(notificationRepository.save(any(Notifications.class))).thenAnswer(invocation -> {
            Notifications notif = invocation.getArgument(0);
            return Notifications.builder()
                    .notificationId(101L)
                    .customer(notif.getCustomer())
                    .transaction(notif.getTransaction())
                    .notificationType(notif.getNotificationType())
                    .title(notif.getTitle())
                    .message(notif.getMessage())
                    .createdAt(LocalDateTime.now())
                    .build();
        });
    }

    @Test
    @DisplayName("Verify that both Sender and Receiver notifications are saved and pushed via WebSocket")
    void testBothSenderAndReceiverNotificationsCreated() {
        // Execute notification dispatch
        asyncNotificationService.sendTransferNotificationsAsync(sender, receiver, transaction);

        // 1. Verify two notification rows are persisted in DB
        ArgumentCaptor<Notifications> notiCaptor = ArgumentCaptor.forClass(Notifications.class);
        verify(notificationRepository, times(2)).save(notiCaptor.capture());

        List<Notifications> savedNotifications = notiCaptor.getAllValues();
        assertEquals(2, savedNotifications.size(), "Should save exactly 2 notifications (1 sender, 1 receiver)");

        // Sender notification assertions
        Notifications senderNotif = savedNotifications.get(0);
        assertEquals(senderId, senderNotif.getCustomer().getCustomerId());
        assertEquals("Transfer Sent", senderNotif.getTitle());
        assertEquals(NotificationType.TRANSFER, senderNotif.getNotificationType());
        assertTrue(senderNotif.getMessage().contains("You have transferred"));
        assertTrue(senderNotif.getMessage().contains("50000.0000 MMK"));
        assertTrue(senderNotif.getMessage().contains("Daw Mya"));

        // Receiver notification assertions
        Notifications receiverNotif = savedNotifications.get(1);
        assertEquals(receiverId, receiverNotif.getCustomer().getCustomerId());
        assertEquals("Funds Received", receiverNotif.getTitle());
        assertEquals(NotificationType.TRANSFER, receiverNotif.getNotificationType());
        assertTrue(receiverNotif.getMessage().contains("You received"));
        assertTrue(receiverNotif.getMessage().contains("50000.0000 MMK"));
        assertTrue(receiverNotif.getMessage().contains("U Ba"));

        // 2. Verify WebSocket pushes were called for both customers
        ArgumentCaptor<NotificationResponseDto> wsDtoCaptor = ArgumentCaptor.forClass(NotificationResponseDto.class);

        verify(notificationWebSocketHandler).sendNotification(eq(senderId.toString()), wsDtoCaptor.capture());
        NotificationResponseDto senderWsDto = wsDtoCaptor.getValue();
        assertEquals("SENT", senderWsDto.getTransferDirection());
        assertEquals("Transfer Sent", senderWsDto.getTitle());
        assertEquals("Daw Mya", senderWsDto.getCounterpartyName());
        assertEquals("2002222222", senderWsDto.getCounterpartyAccountNumber());

        verify(notificationWebSocketHandler).sendNotification(eq(receiverId.toString()), wsDtoCaptor.capture());
        NotificationResponseDto receiverWsDto = wsDtoCaptor.getValue();
        assertEquals("RECEIVED", receiverWsDto.getTransferDirection());
        assertEquals("Funds Received", receiverWsDto.getTitle());
        assertEquals("U Ba", receiverWsDto.getCounterpartyName());
        assertEquals("2001111111", receiverWsDto.getCounterpartyAccountNumber());
    }
}
