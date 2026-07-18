package com.etrm.system.book;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookClassificationRepository extends JpaRepository<BookClassification, Integer> {
    List<BookClassification> findByBookId(Integer bookId);
    List<BookClassification> findByDimensionIdAndValueCodeIgnoreCase(Integer dimensionId, String valueCode);
    Optional<BookClassification> findByBookIdAndDimensionIdAndIsPrimaryTrue(Integer bookId, Integer dimensionId);
    boolean existsByBookIdAndDimensionIdAndValueCodeIgnoreCase(Integer bookId, Integer dimensionId, String valueCode);
}
