package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LookupCategoryRepository extends JpaRepository<LookupCategory, Integer> {
    Optional<LookupCategory> findByCategoryCodeIgnoreCase(String categoryCode);
}
