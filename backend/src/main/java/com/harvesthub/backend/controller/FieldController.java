
package com.harvesthub.backend.controller;

import com.harvesthub.backend.entity.Field;
import com.harvesthub.backend.entity.Farm;
import com.harvesthub.backend.entity.User;
import com.harvesthub.backend.repository.FieldRepository;
import com.harvesthub.backend.repository.FarmRepository;
import com.harvesthub.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api")
public class FieldController {

    private final FieldRepository fieldRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    public FieldController(
            FieldRepository fieldRepository,
            FarmRepository farmRepository,
            UserRepository userRepository) {
        this.fieldRepository = fieldRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
    }

    private Field getOwnedField(
            Long fieldId,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Field not found"));

        Farm farm = farmRepository.findById(field.getFarmId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Farm not found"));

        if (!farm.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You do not own this field");
        }

        return field;
    }

    @PostMapping("/farms/{farmId}/fields")
    @ResponseStatus(HttpStatus.CREATED)
    public Field createField(
            @PathVariable Long farmId,
            @RequestBody Field field,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Farm farm = farmRepository.findById(farmId)
                .filter(existingFarm ->
                        existingFarm.getUserId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Farm not found"));

        field.setFarmId(farm.getId());
        return fieldRepository.save(field);
    }

    @GetMapping("/farms/{farmId}/fields")
    public List<Field> getFields(
            @PathVariable Long farmId,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        farmRepository.findById(farmId)
                .filter(farm -> farm.getUserId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Farm not found"));

        return fieldRepository.findByFarmId(farmId);
    }

    // UPDATE FIELD
    @PutMapping("/fields/{fieldId}")
    public Field updateField(
            @PathVariable Long fieldId,
            @RequestBody Field updatedField,
            Authentication authentication) {

        Field existingField = getOwnedField(fieldId, authentication);

        if (updatedField.getName() == null
                || updatedField.getName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Field name is required");
        }

        if (updatedField.getArea() == null
                || updatedField.getArea() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Area must be greater than zero");
        }

        existingField.setName(updatedField.getName().trim());
        existingField.setArea(updatedField.getArea());
        existingField.setAreaUnit(
                updatedField.getAreaUnit() == null
                        || updatedField.getAreaUnit().isBlank()
                        ? "acres" : updatedField.getAreaUnit());
        existingField.setSoilType(updatedField.getSoilType());
        existingField.setIrrigationType(updatedField.getIrrigationType());

        // Keep the original farmId and createdAt.
        return fieldRepository.save(existingField);
    }

    // DELETE FIELD
    @DeleteMapping("/fields/{fieldId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteField(
            @PathVariable Long fieldId,
            Authentication authentication) {

        Field existingField = getOwnedField(fieldId, authentication);
        fieldRepository.delete(existingField);
    }
}
