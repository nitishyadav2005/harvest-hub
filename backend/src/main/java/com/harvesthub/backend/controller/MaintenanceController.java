
package com.harvesthub.backend.controller;

import com.harvesthub.backend.entity.Equipment;
import com.harvesthub.backend.entity.Farm;
import com.harvesthub.backend.entity.Maintenance;
import com.harvesthub.backend.entity.User;
import com.harvesthub.backend.repository.EquipmentRepository;
import com.harvesthub.backend.repository.FarmRepository;
import com.harvesthub.backend.repository.MaintenanceRepository;
import com.harvesthub.backend.repository.UserRepository;
import com.harvesthub.backend.service.JwtService;
import com.harvesthub.backend.service.MaintenanceService;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class MaintenanceController {

    private final MaintenanceRepository maintenanceRepository;
    private final EquipmentRepository equipmentRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final MaintenanceService maintenanceService;
    private final JwtService jwtService;

    public MaintenanceController(
            MaintenanceRepository maintenanceRepository,
            EquipmentRepository equipmentRepository,
            FarmRepository farmRepository,
            UserRepository userRepository,
            MaintenanceService maintenanceService,
            JwtService jwtService) {
        this.maintenanceRepository = maintenanceRepository;
        this.equipmentRepository = equipmentRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
        this.maintenanceService = maintenanceService;
        this.jwtService = jwtService;
    }

    private User getCurrentUser(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }

        String token = authorization.substring(7);

        try {
            String email = jwtService.extractEmail(token);

            return userRepository.findByEmail(email)
                    .filter(user ->
                            jwtService.isTokenValid(token, user.getEmail()))
                    .orElse(null);

        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    private boolean ownsEquipment(Long equipmentId, Long userId) {
        Equipment equipment = equipmentRepository
                .findById(equipmentId)
                .orElse(null);

        if (equipment == null) {
            return false;
        }

        Farm farm = farmRepository
                .findById(equipment.getFarmId())
                .orElse(null);

        return farm != null
                && farm.getUserId() != null
                && farm.getUserId().equals(userId);
    }

    private boolean ownsMaintenance(Long maintenanceId, Long userId) {
        Maintenance maintenance = maintenanceRepository
                .findById(maintenanceId)
                .orElse(null);

        return maintenance != null
                && ownsEquipment(maintenance.getEquipmentId(), userId);
    }

    @GetMapping("/equipment/{equipmentId}/maintenance")
    public ResponseEntity<?> getMaintenance(
            @PathVariable Long equipmentId,
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        User user = getCurrentUser(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        if (!ownsEquipment(equipmentId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "You cannot access this equipment."));
        }

        List<Maintenance> records =
                maintenanceService.getMaintenanceByEquipment(equipmentId);

        return ResponseEntity.ok(records);
    }

    @PostMapping("/equipment/{equipmentId}/maintenance")
    public ResponseEntity<?> addMaintenance(
            @PathVariable Long equipmentId,
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @RequestBody Maintenance request) {

        User user = getCurrentUser(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        if (!ownsEquipment(equipmentId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "You cannot access this equipment."));
        }

        if (request.getMaintenanceType() == null
                || request.getMaintenanceType().isBlank()
                || request.getScheduledDate() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "Maintenance type and scheduled date are required."));
        }

        if (request.getCost() != null && request.getCost() < 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "Maintenance cost cannot be negative."));
        }

        request.setEquipmentId(equipmentId);
        request.setMaintenanceType(request.getMaintenanceType().trim());

        Maintenance saved = maintenanceService.addMaintenance(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/maintenance/{id}")
    public ResponseEntity<?> updateMaintenance(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @RequestBody Maintenance request) {

        User user = getCurrentUser(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        if (!ownsMaintenance(id, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "You cannot access this maintenance record."));
        }

        if (request.getMaintenanceType() == null
                || request.getMaintenanceType().isBlank()
                || request.getScheduledDate() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "Maintenance type and scheduled date are required."));
        }

        if (request.getCost() != null && request.getCost() < 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "Maintenance cost cannot be negative."));
        }

        Maintenance updated =
                maintenanceService.updateMaintenance(id, request);

        return ResponseEntity.ok(updated);
    }

    @PutMapping("/maintenance/{id}/complete")
    public ResponseEntity<?> markCompleted(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        User user = getCurrentUser(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        if (!ownsMaintenance(id, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "You cannot access this maintenance record."));
        }

        Maintenance completed =
                maintenanceService.markCompleted(id);

        return ResponseEntity.ok(completed);
    }

    @DeleteMapping("/maintenance/{id}")
    public ResponseEntity<?> deleteMaintenance(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        User user = getCurrentUser(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        if (!ownsMaintenance(id, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "You cannot access this maintenance record."));
        }

        maintenanceService.deleteMaintenance(id);

        return ResponseEntity.ok(
                Map.of("message", "Maintenance deleted successfully."));
    }
}
