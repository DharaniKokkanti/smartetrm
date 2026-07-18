package com.etrm.system.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocationRepository extends JpaRepository<Location, Integer> {
    boolean existsByLocationCodeIgnoreCase(String locationCode);
    List<Location> findByTradingDeskIndTrueAndIsActiveTrueOrderByLocationCodeAsc();
}
