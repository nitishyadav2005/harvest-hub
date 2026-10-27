
package com.harvesthub.backend.repository;

import com.harvesthub.backend.entity.FinanceTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinanceTransactionRepository
        extends JpaRepository<FinanceTransaction, Long> {

    List<FinanceTransaction> findByFarmId(Long farmId);

    List<FinanceTransaction> findByFarmIdAndType(
            Long farmId,
            String type
    );

    List<FinanceTransaction> findByFarmIdOrderByTransactionDateDesc(
            Long farmId
    );
}
