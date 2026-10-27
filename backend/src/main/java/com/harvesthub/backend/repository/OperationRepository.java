
package com.harvesthub.backend.repository;

import com.harvesthub.backend.entity.Operation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OperationRepository
        extends JpaRepository<Operation, Long> {

    List<Operation> findByFieldId(Long fieldId);

    List<Operation> findByStatus(String status);
}
