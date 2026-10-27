
package com.harvesthub.backend.controller;

import com.harvesthub.backend.entity.Crop;
import com.harvesthub.backend.entity.Field;
import com.harvesthub.backend.entity.Farm;
import com.harvesthub.backend.entity.User;
import com.harvesthub.backend.repository.CropRepository;
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
public class CropController {

    private final CropRepository cropRepository;
    private final FieldRepository fieldRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    public CropController(
            CropRepository cropRepository,
            FieldRepository fieldRepository,
            FarmRepository farmRepository,
            UserRepository userRepository) {
        this.cropRepository = cropRepository;
        this.fieldRepository = fieldRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
    }

    private Field getOwnedField(
            Long fieldId,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found"));

        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Field not found"));

        Farm farm = farmRepository.findById(field.getFarmId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Farm not found"));

        if (!farm.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not own this field");
        }

        return field;
    }

    private void validateCrop(Crop crop) {
        if (crop.getName() == null || crop.getName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Crop name is required");
        }

        if (crop.getSowingDate() != null
                && crop.getExpectedHarvestDate() != null
                && crop.getExpectedHarvestDate()
                .isBefore(crop.getSowingDate())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Harvest date cannot be before sowing date");
        }
    }

    // ADD CROP
    @PostMapping("/fields/{fieldId}/crops")
    @ResponseStatus(HttpStatus.CREATED)
    public Crop addCrop(
            @PathVariable Long fieldId,
            @RequestBody Crop crop,
            Authentication authentication) {

        getOwnedField(fieldId, authentication);
        validateCrop(crop);

        crop.setFieldId(fieldId);
        crop.setStatus("PLANNED");

        return cropRepository.save(crop);
    }

    // GET CROPS OF A FIELD
    @GetMapping("/fields/{fieldId}/crops")
    public List<Crop> getCrops(
            @PathVariable Long fieldId,
            Authentication authentication) {

        getOwnedField(fieldId, authentication);

        return cropRepository.findByFieldId(fieldId);
    }

    // UPDATE CROP
    @PutMapping("/crops/{cropId}")
    public Crop updateCrop(
            @PathVariable Long cropId,
            @RequestBody Crop updatedCrop,
            Authentication authentication) {

        Crop existingCrop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Crop not found"));

        getOwnedField(existingCrop.getFieldId(), authentication);
        validateCrop(updatedCrop);

        existingCrop.setName(updatedCrop.getName().trim());
        existingCrop.setSeason(updatedCrop.getSeason());
        existingCrop.setSowingDate(updatedCrop.getSowingDate());
        existingCrop.setExpectedHarvestDate(
                updatedCrop.getExpectedHarvestDate());

        // Keep existing fieldId, status and createdAt unchanged.
        return cropRepository.save(existingCrop);
    }

    // DELETE CROP
    @DeleteMapping("/crops/{cropId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCrop(
            @PathVariable Long cropId,
            Authentication authentication) {

        Crop existingCrop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Crop not found"));

        getOwnedField(existingCrop.getFieldId(), authentication);

        cropRepository.delete(existingCrop);
    }
}
