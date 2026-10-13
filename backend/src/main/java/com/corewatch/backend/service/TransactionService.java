package com.corewatch.backend.service;

import com.corewatch.backend.dto.TransactionRequestDTO;
import com.corewatch.backend.model.Transaction;
import com.corewatch.backend.model.TransactionStatus;
import com.corewatch.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionNotificationService notificationService;

    // Regla 1: Umbral económico (> 10.000 €)
    private static final BigDecimal FRAUD_THRESHOLD = new BigDecimal("10000.00");

    @Transactional
    public Transaction processTransaction(TransactionRequestDTO request, String clientIp) {
        // Regla 2: Comprobación de velocidad (ráfaga en los últimos 60s.)
        LocalDateTime oneMinuteAgo = LocalDateTime.now().minus(1, ChronoUnit.MINUTES);
        long recentTxCount = transactionRepository.countBySourceAccountAndTimestampAfter(
                request.getSourceAccount(),
                oneMinuteAgo
        );

        boolean isHighVelocity = recentTxCount >= 2;
        boolean isHighAmount = request.getAmount().compareTo(FRAUD_THRESHOLD) > 0;

        int calculatedRisk;
        TransactionStatus status;
        boolean isSuspicious;

        if(isHighVelocity) {
            // Ráfaga sospechosa de transferencias repetidas
            calculatedRisk = 95;
            isSuspicious = true;
            status = TransactionStatus.FLAGGED;
        } else if(isHighAmount) {
            // Importe superior al umbral
            calculatedRisk = 85;
            isSuspicious = true;
            status = TransactionStatus.FLAGGED;
        } else {
            // Transacción normal
            calculatedRisk = 10;
            isSuspicious = true;
            status = TransactionStatus.APPROVED;
        }

        Transaction transaction = Transaction.builder()
                .sourceAccount(request.getSourceAccount())
                .destinationAccount(request.getDestinationAccount())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .clientIp(clientIp)
                .riskScore(calculatedRisk)
                .isFraudulent(isSuspicious)
                .status(status)
                .build();

        Transaction savedTransaction = transactionRepository.save(transaction);
        notificationService.broadcastTransaction(savedTransaction);
        return savedTransaction;
    }

    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}
