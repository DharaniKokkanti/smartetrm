package com.etrm.system.volatilitypoint;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VolatilityPointRepository extends JpaRepository<VolatilityPoint, Integer> {
    List<VolatilityPoint> findByOptionIndexLinkId(Integer optionIndexLinkId);
}
