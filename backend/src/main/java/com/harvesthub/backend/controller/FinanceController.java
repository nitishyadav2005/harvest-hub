
package com.harvesthub.backend.controller;

import com.harvesthub.backend.entity.FinanceTransaction;
import com.harvesthub.backend.service.FinanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "http://localhost:5173")
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    // Get all transactions for a farm
    @GetMapping("/farms/{farmId}/transactions")
    public ResponseEntity<List<FinanceTransaction>> getAllTransactions(
            @PathVariable Long farmId) {

        return ResponseEntity.ok(
                financeService.getAllTransactions(farmId));
    }

    // Get transactions by type: INCOME or EXPENSE
    @GetMapping("/farms/{farmId}/transactions/type/{type}")
    public ResponseEntity<List<FinanceTransaction>> getTransactionsByType(
            @PathVariable Long farmId,
            @PathVariable String type) {

        return ResponseEntity.ok(
                financeService.getTransactionsByType(farmId, type));
    }

    // Get one transaction
    @GetMapping("/farms/{farmId}/transactions/{transactionId}")
    public ResponseEntity<FinanceTransaction> getTransactionById(
            @PathVariable Long farmId,
            @PathVariable Long transactionId) {

        return ResponseEntity.ok(
                financeService.getTransactionById(farmId, transactionId));
    }

    // Add a transaction
    @PostMapping("/transactions")
    public ResponseEntity<FinanceTransaction> addTransaction(
            @RequestBody FinanceTransaction transaction) {

        FinanceTransaction saved =
                financeService.addTransaction(transaction);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Update a transaction
    @PutMapping("/farms/{farmId}/transactions/{transactionId}")
    public ResponseEntity<FinanceTransaction> updateTransaction(
            @PathVariable Long farmId,
            @PathVariable Long transactionId,
            @RequestBody FinanceTransaction transaction) {

        return ResponseEntity.ok(
                financeService.updateTransaction(
                        farmId, transactionId, transaction));
    }

    // Delete a transaction
    @DeleteMapping("/farms/{farmId}/transactions/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long farmId,
            @PathVariable Long transactionId) {

        financeService.deleteTransaction(farmId, transactionId);

        return ResponseEntity.noContent().build();
    }

    // Get income, expenses and net profit summary
    @GetMapping("/farms/{farmId}/summary")
    public ResponseEntity<Map<String, BigDecimal>> getSummary(
            @PathVariable Long farmId) {

        Map<String, BigDecimal> summary = new HashMap<>();

        summary.put("totalIncome",
                financeService.getTotalIncome(farmId));

        summary.put("totalExpenses",
                financeService.getTotalExpenses(farmId));

        summary.put("netProfit",
                financeService.getNetProfit(farmId));

        return ResponseEntity.ok(summary);
    }
}
