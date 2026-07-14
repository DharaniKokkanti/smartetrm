package com.etrm.system.priceindex;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PriceIndexRepository extends JpaRepository<PriceIndex, Integer> {
    boolean existsByIndexCodeIgnoreCase(String indexCode);
}
