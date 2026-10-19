package com.corebanking.controller;

import com.corebanking.dto.OtcTransactionRequestDto;
import com.corebanking.dto.OtcTransactionResponseDto;
import com.corebanking.service.OtcTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions/otc")
@RequiredArgsConstructor
public class OtcTransactionController {

    private final OtcTransactionService otcTransactionService;

    /**
     * Over-the-Counter Cash Deposit
     * POST /api/transactions/otc/deposit
     */
    @PostMapping("/deposit")
    public ResponseEntity<OtcTransactionResponseDto> processDeposit(
            @Valid @RequestBody OtcTransactionRequestDto request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {

        OtcTransactionResponseDto response = otcTransactionService.processDeposit(request, idempotencyKey);
        return ResponseEntity.ok(response);
    }

    /**
     * Over-the-Counter Cash Withdrawal
     * POST /api/transactions/otc/withdraw
     */
    @PostMapping("/withdraw")
    public ResponseEntity<OtcTransactionResponseDto> processWithdrawal(
            @Valid @RequestBody OtcTransactionRequestDto request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {

        OtcTransactionResponseDto response = otcTransactionService.processWithdrawal(request, idempotencyKey);
        return ResponseEntity.ok(response);
    }
}
