package com.corewatch.backend.controller;

import com.corewatch.backend.dto.TransactionRequestDTO;
import com.corewatch.backend.model.Transaction;
import com.corewatch.backend.service.TransactionNotificationService;
import com.corewatch.backend.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;
    private final TransactionNotificationService notificationService;

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(
            @Valid @RequestBody TransactionRequestDTO request,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        Transaction processed = transactionService.processTransaction(request, clientIp);
        return new ResponseEntity<>(processed, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> listTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        return notificationService.subscribe();
    }
}
