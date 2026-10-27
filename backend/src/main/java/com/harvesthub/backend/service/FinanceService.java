
package com.harvesthub.backend.service;

import com.harvesthub.backend.entity.FinanceTransaction;
import com.harvesthub.backend.repository.FinanceTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class FinanceService {

    private final FinanceTransactionRepository repository;

    public FinanceService(FinanceTransactionRepository repository) {
        this.repository = repository;
    }

    public List<FinanceTransaction> getAllTransactions(Long farmId) {
        return repository.findByFarmIdOrderByTransactionDateDesc(farmId);
    }

    public List<FinanceTransaction> getTransactionsByType(
            Long farmId,
            String type
    ) {
        validateType(type);
        return repository.findByFarmIdAndType(
                farmId,
                type.toUpperCase()
        );
    }

    public FinanceTransaction getTransactionById(
            Long farmId,
            Long transactionId
    ) {
        return repository.findById(transactionId)
                .filter(transaction ->
                        transaction.getFarmId().equals(farmId))
                .orElseThrow(() ->
                        new RuntimeException("Finance transaction not found"));
    }

    @Transactional
    public FinanceTransaction addTransaction(FinanceTransaction transaction) {
        validateTransaction(transaction);

        transaction.setType(transaction.getType().toUpperCase());

        return repository.save(transaction);
    }

    @Transactional
    public FinanceTransaction updateTransaction(
            Long farmId,
            Long transactionId,
            FinanceTransaction updatedTransaction
    ) {
        validateTransaction(updatedTransaction);

        FinanceTransaction existing =
                getTransactionById(farmId, transactionId);

        existing.setType(updatedTransaction.getType().toUpperCase());
        existing.setCategory(updatedTransaction.getCategory());
        existing.setTitle(updatedTransaction.getTitle());
        existing.setAmount(updatedTransaction.getAmount());
        existing.setTransactionDate(
                updatedTransaction.getTransactionDate());
        existing.setNotes(updatedTransaction.getNotes());

        return repository.save(existing);
    }

    @Transactional
    public void deleteTransaction(Long farmId, Long transactionId) {
        FinanceTransaction transaction =
                getTransactionById(farmId, transactionId);

        repository.delete(transaction);
    }

    public BigDecimal getTotalIncome(Long farmId) {
        return calculateTotal(farmId, "INCOME");
    }

    public BigDecimal getTotalExpenses(Long farmId) {
        return calculateTotal(farmId, "EXPENSE");
    }

    public BigDecimal getNetProfit(Long farmId) {
        return getTotalIncome(farmId)
                .subtract(getTotalExpenses(farmId));
    }

    private BigDecimal calculateTotal(Long farmId, String type) {
        return repository.findByFarmIdAndType(farmId, type)
                .stream()
                .map(FinanceTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void validateType(String type) {
        if (type == null ||
                (!type.equalsIgnoreCase("INCOME")
                        && !type.equalsIgnoreCase("EXPENSE"))) {
            throw new IllegalArgumentException(
                    "Type must be INCOME or EXPENSE");
        }
    }

    private void validateTransaction(FinanceTransaction transaction) {
        if (transaction == null) {
            throw new IllegalArgumentException(
                    "Transaction details are required");
        }

        validateType(transaction.getType());

        if (transaction.getFarmId() == null) {
            throw new IllegalArgumentException("Farm ID is required");
        }

        if (transaction.getCategory() == null
                || transaction.getCategory().isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }

        if (transaction.getTitle() == null
                || transaction.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        if (transaction.getAmount() == null
                || transaction.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Amount must be greater than zero");
        }

        if (transaction.getTransactionDate() == null) {
            throw new IllegalArgumentException(
                    "Transaction date is required");
        }
    }
}
