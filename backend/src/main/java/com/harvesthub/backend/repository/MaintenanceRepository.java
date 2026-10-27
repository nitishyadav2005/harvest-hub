
package com.harvesthub.backend.repository;

import com.harvesthub.backend.entity.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {

    List<Maintenance> findByEquipmentId(Long equipmentId);

    List<Maintenance> findByStatus(String status);

}
