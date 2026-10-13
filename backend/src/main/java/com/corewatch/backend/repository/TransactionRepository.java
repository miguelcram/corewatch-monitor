package com.corewatch.backend.repository;

import com.corewatch.backend.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.time.LocalDateTime;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    // Cuenta transacciones de una cuenta posteriores a un instante dado
    long countBySourceAccountAndTimestampAfter(String sourceAccount, LocalDateTime after);
}
