package com.etrm.system.book;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookClassificationDimensionRepository extends JpaRepository<BookClassificationDimension, Integer> {
    List<BookClassificationDimension> findByIsActiveTrueOrderBySortOrder();
    Optional<BookClassificationDimension> findByDimensionCodeIgnoreCase(String dimensionCode);
}
