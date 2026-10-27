
package com.harvesthub.backend.repository;

import com.harvesthub.backend.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Long> {
    List<Crop> findByFieldId(Long fieldId);
}
