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

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;

    // Regla de negocio: importes superiores a 10.000 € activan alerta de fraude
    private static final BigDecimal FRAUD_THRESHOLD = new BigDecimal("10000.00");

    @Transactional
    public Transaction processTransaction(TransactionRequestDTO request, String clientIP) {
        boolean isSuspicious = request.getAmount().compareTo(FRAUD_THRESHOLD) > 0;
        int calculatedRisk = isSuspicious ? 85 : 10;
        TransactionStatus status = isSuspicious ? TransactionStatus.FLAGGED : TransactionStatus.APPROVED;

        Transaction transaction = Transaction.builder()
                .sourceAccount(request.getSourceAccount())
                .destinationAccount(request.getDestinationAccount())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .clientIp(clientIP)
                .riskScore(calculatedRisk)
                .isFraudulent(isSuspicious)
                .status(status)
                .build();

        return transactionRepository.save(transaction);
    }

    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}
