
package com.harvesthub.backend.service;

import com.harvesthub.backend.entity.Equipment;
import com.harvesthub.backend.entity.Maintenance;
import com.harvesthub.backend.repository.EquipmentRepository;
import com.harvesthub.backend.repository.MaintenanceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final EquipmentRepository equipmentRepository;

    public MaintenanceService(
            MaintenanceRepository maintenanceRepository,
            EquipmentRepository equipmentRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.equipmentRepository = equipmentRepository;
    }

    public List<Maintenance> getAllMaintenance() {
        return maintenanceRepository.findAll();
    }

    public List<Maintenance> getMaintenanceByEquipment(Long equipmentId) {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw new RuntimeException("Equipment not found");
        }

        return maintenanceRepository.findByEquipmentId(equipmentId);
    }

    public Maintenance addMaintenance(Maintenance maintenance) {
        Equipment equipment = equipmentRepository.findById(
                maintenance.getEquipmentId()
        ).orElseThrow(() -> new RuntimeException("Equipment not found"));

        maintenance.setStatus("UPCOMING");
        maintenance.setCost(
                maintenance.getCost() == null ? 0.0 : maintenance.getCost()
        );

        return maintenanceRepository.save(maintenance);
    }

    public Maintenance updateMaintenance(Long id, Maintenance updated) {
        Maintenance existing = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance not found"));

        existing.setMaintenanceType(updated.getMaintenanceType());
        existing.setScheduledDate(updated.getScheduledDate());
        existing.setCompletedDate(updated.getCompletedDate());
        existing.setCost(updated.getCost());
        existing.setStatus(updated.getStatus());
        existing.setNotes(updated.getNotes());

        return maintenanceRepository.save(existing);
    }

    public Maintenance markCompleted(Long id) {
        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance not found"));

        maintenance.setStatus("COMPLETED");
        maintenance.setCompletedDate(LocalDate.now());

        Equipment equipment = equipmentRepository.findById(
                maintenance.getEquipmentId()
        ).orElseThrow(() -> new RuntimeException("Equipment not found"));

        equipment.setLastServiceDate(LocalDate.now());
        equipmentRepository.save(equipment);

        return maintenanceRepository.save(maintenance);
    }

    public void deleteMaintenance(Long id) {
        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance not found"));

        maintenanceRepository.delete(maintenance);
    }
}
