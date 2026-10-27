
package com.harvesthub.backend.repository;

import com.harvesthub.backend.entity.Field;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FieldRepository extends JpaRepository<Field, Long> {

    List<Field> findByFarmId(Long farmId);
}
