
package com.harvesthub.backend.service;

import com.harvesthub.backend.entity.Equipment;
import com.harvesthub.backend.repository.EquipmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    public EquipmentService(EquipmentRepository equipmentRepository) {
        this.equipmentRepository = equipmentRepository;
    }

    public List<Equipment> getEquipmentByFarm(Long farmId) {
        return equipmentRepository.findByFarmId(farmId);
    }

    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
    }

    public Equipment addEquipment(Equipment equipment) {
        equipment.setStatus("ACTIVE");
        return equipmentRepository.save(equipment);
    }

    public Equipment updateEquipment(Long id, Equipment updatedEquipment) {
        Equipment existing = getEquipmentById(id);

        existing.setName(updatedEquipment.getName());
        existing.setEquipmentType(updatedEquipment.getEquipmentType());
        existing.setBrand(updatedEquipment.getBrand());
        existing.setModel(updatedEquipment.getModel());
        existing.setPurchaseDate(updatedEquipment.getPurchaseDate());
        existing.setLastServiceDate(updatedEquipment.getLastServiceDate());
        existing.setNextServiceDate(updatedEquipment.getNextServiceDate());
        existing.setStatus(updatedEquipment.getStatus());
        existing.setNotes(updatedEquipment.getNotes());

        return equipmentRepository.save(existing);
    }

    public void deleteEquipment(Long id) {
        Equipment equipment = getEquipmentById(id);
        equipmentRepository.delete(equipment);
    }
}
