
package com.harvesthub.backend.controller;

import com.harvesthub.backend.entity.Equipment;
import com.harvesthub.backend.entity.Farm;
import com.harvesthub.backend.entity.User;
import com.harvesthub.backend.repository.EquipmentRepository;
import com.harvesthub.backend.repository.FarmRepository;
import com.harvesthub.backend.repository.UserRepository;
import com.harvesthub.backend.service.EquipmentService;
import com.harvesthub.backend.service.JwtService;

import io.jsonwebtoken.JwtException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class EquipmentController {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentService equipmentService;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public EquipmentController(
            EquipmentRepository equipmentRepository,
            EquipmentService equipmentService,
            FarmRepository farmRepository,
            UserRepository userRepository,
            JwtService jwtService) {
        this.equipmentRepository = equipmentRepository;
        this.equipmentService = equipmentService;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
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
                    .filter(user -> jwtService.isTokenValid(token, user.getEmail()))
                    .orElse(null);

        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    private boolean ownsFarm(Long farmId, Long userId) {
        Farm farm = farmRepository.findById(farmId).orElse(null);

        return farm != null
                && farm.getUserId() != null
                && farm.getUserId().equals(userId);
    }

    private boolean ownsEquipment(Long equipmentId, Long userId) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElse(null);

        return equipment != null
                && ownsFarm(equipment.getFarmId(), userId);
    }

    @GetMapping("/farms/{farmId}/equipment")
    public ResponseEntity<?> getEquipment(
            @PathVariable Long farmId,
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        User user = getCurrentUser(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        if (!ownsFarm(farmId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You cannot access this farm."));
        }

        List<Equipment> equipment =
                equipmentService.getEquipmentByFarm(farmId);

        return ResponseEntity.ok(equipment);
    }

    @PostMapping("/farms/{farmId}/equipment")
    public ResponseEntity<?> addEquipment(
            @PathVariable Long farmId,
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @RequestBody Equipment request) {

        User user = getCurrentUser(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        if (!ownsFarm(farmId, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You cannot access this farm."));
        }

        if (request.getName() == null || request.getName().isBlank()
                || request.getEquipmentType() == null
                || request.getEquipmentType().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "Equipment name and type are required."));
        }

        request.setFarmId(farmId);
        request.setName(request.getName().trim());
        request.setEquipmentType(request.getEquipmentType().trim());

        Equipment saved = equipmentService.addEquipment(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/equipment/{id}")
    public ResponseEntity<?> updateEquipment(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @RequestBody Equipment request) {

        User user = getCurrentUser(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        if (!ownsEquipment(id, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "You cannot access this equipment."));
        }

        if (request.getName() == null || request.getName().isBlank()
                || request.getEquipmentType() == null
                || request.getEquipmentType().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "Equipment name and type are required."));
        }

        Equipment updated = equipmentService.updateEquipment(id, request);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/equipment/{id}")
    public ResponseEntity<?> deleteEquipment(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        User user = getCurrentUser(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        if (!ownsEquipment(id, user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "You cannot access this equipment."));
        }

        equipmentService.deleteEquipment(id);

        return ResponseEntity.ok(
                Map.of("message", "Equipment deleted successfully."));
    }
}
