
package com.harvesthub.backend.controller;

import com.harvesthub.backend.entity.Farm;
import com.harvesthub.backend.entity.Field;
import com.harvesthub.backend.entity.Operation;
import com.harvesthub.backend.entity.User;
import com.harvesthub.backend.repository.FarmRepository;
import com.harvesthub.backend.repository.FieldRepository;
import com.harvesthub.backend.repository.OperationRepository;
import com.harvesthub.backend.repository.UserRepository;
import com.harvesthub.backend.service.JwtService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class OperationController {

    private final OperationRepository operationRepository;
    private final FieldRepository fieldRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public OperationController(
            OperationRepository operationRepository,
            FieldRepository fieldRepository,
            FarmRepository farmRepository,
            UserRepository userRepository,
            JwtService jwtService) {

        this.operationRepository = operationRepository;
        this.fieldRepository = fieldRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    // Get currently logged-in user from JWT token
    private Optional<User> getCurrentUser(HttpHeaders headers) {

        String authHeader = headers.getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }

        String token = authHeader.substring(7);

        try {
            String email = jwtService.extractEmail(token);
            return userRepository.findByEmail(email);
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    // Check whether the field belongs to the logged-in user
    private boolean ownsField(Long fieldId, Long userId) {

        Optional<Field> fieldOptional = fieldRepository.findById(fieldId);

        if (fieldOptional.isEmpty()) {
            return false;
        }

        Field field = fieldOptional.get();

        Optional<Farm> farmOptional =
                farmRepository.findById(field.getFarmId());

        if (farmOptional.isEmpty()) {
            return false;
        }

        Farm farm = farmOptional.get();

        return farm.getUserId().equals(userId);
    }

    // Add a new operation for a field
    @PostMapping("/fields/{fieldId}/operations")
    public ResponseEntity<?> addOperation(
            @PathVariable Long fieldId,
            @RequestHeader HttpHeaders headers,
            @RequestBody Operation request) {

        Optional<User> userOptional = getCurrentUser(headers);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        User user = userOptional.get();

        if (!ownsField(fieldId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You do not have permission to access this field."
                    ));
        }

        if (request.getTitle() == null
                || request.getTitle().isBlank()
                || request.getOperationType() == null
                || request.getOperationType().isBlank()
                || request.getScheduledDate() == null) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Title, operation type and scheduled date are required."
                    ));
        }

        BigDecimal cost = request.getOperationCost();

        if (cost == null) {
            cost = BigDecimal.ZERO;
        }

        if (cost.signum() < 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Operation cost cannot be negative."
                    ));
        }

        Operation operation = new Operation();

        operation.setFieldId(fieldId);
        operation.setTitle(request.getTitle().trim());
        operation.setOperationType(request.getOperationType().trim());
        operation.setScheduledDate(request.getScheduledDate());
        operation.setStatus("PLANNED");
        operation.setOperationCost(cost);
        operation.setNotes(request.getNotes());

        Operation savedOperation = operationRepository.save(operation);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedOperation);
    }

    // Get all operations for a field
    @GetMapping("/fields/{fieldId}/operations")
    public ResponseEntity<?> getOperationsByField(
            @PathVariable Long fieldId,
            @RequestHeader HttpHeaders headers) {

        Optional<User> userOptional = getCurrentUser(headers);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        User user = userOptional.get();

        if (!ownsField(fieldId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You do not have permission to access this field."
                    ));
        }

        List<Operation> operations =
                operationRepository.findByFieldId(fieldId);

        return ResponseEntity.ok(operations);
    }

    // Update an existing operation, including its cost
    @PutMapping("/operations/{operationId}")
    public ResponseEntity<?> updateOperation(
            @PathVariable Long operationId,
            @RequestHeader HttpHeaders headers,
            @RequestBody Operation request) {

        Optional<User> userOptional = getCurrentUser(headers);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        User user = userOptional.get();

        Optional<Operation> operationOptional =
                operationRepository.findById(operationId);

        if (operationOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Operation not found."));
        }

        Operation operation = operationOptional.get();

        if (!ownsField(operation.getFieldId(), user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You do not have permission to update this operation."
                    ));
        }

        if (request.getTitle() == null
                || request.getTitle().isBlank()
                || request.getOperationType() == null
                || request.getOperationType().isBlank()
                || request.getScheduledDate() == null) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Title, operation type and scheduled date are required."
                    ));
        }

        if (request.getOperationCost() != null
                && request.getOperationCost().signum() < 0) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Operation cost cannot be negative."
                    ));
        }

        operation.setTitle(request.getTitle().trim());
        operation.setOperationType(request.getOperationType().trim());
        operation.setScheduledDate(request.getScheduledDate());
        operation.setNotes(request.getNotes());

        // Preserve existing cost if no cost is sent
        if (request.getOperationCost() != null) {
            operation.setOperationCost(request.getOperationCost());
        }


        if (request.getStatus() != null
                && !request.getStatus().isBlank()) {

            String newStatus = request.getStatus().trim();

            if ("COMPLETED".equalsIgnoreCase(newStatus)) {

                // Save completion date only the first time
                if (!"COMPLETED".equalsIgnoreCase(operation.getStatus())) {
                    operation.setCompletedAt(java.time.LocalDateTime.now());
                }

                operation.setStatus("COMPLETED");

            } else {
                operation.setStatus(newStatus);
                operation.setCompletedAt(null);
            }
        }

        Operation updatedOperation = operationRepository.save(operation);

        return ResponseEntity.ok(updatedOperation);
    }

    // Delete an operation
    @DeleteMapping("/operations/{operationId}")
    public ResponseEntity<?> deleteOperation(
            @PathVariable Long operationId,
            @RequestHeader HttpHeaders headers) {

        Optional<User> userOptional = getCurrentUser(headers);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first."));
        }

        User user = userOptional.get();

        Optional<Operation> operationOptional =
                operationRepository.findById(operationId);

        if (operationOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Operation not found."));
        }

        Operation operation = operationOptional.get();

        if (!ownsField(operation.getFieldId(), user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You do not have permission to delete this operation."
                    ));
        }

        operationRepository.delete(operation);

        return ResponseEntity.ok(
                Map.of("message", "Operation deleted successfully.")
        );
    }
}
