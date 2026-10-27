
package com.harvesthub.backend.repository;

import com.harvesthub.backend.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FarmRepository extends JpaRepository<Farm, Long> {

    List<Farm> findByUserId(Long userId);
}
