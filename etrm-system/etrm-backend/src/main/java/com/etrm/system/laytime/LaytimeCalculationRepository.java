package com.etrm.system.laytime;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LaytimeCalculationRepository extends JpaRepository<LaytimeCalculation, Integer> {
    List<LaytimeCalculation> findByVoyageIdOrderByPortLocationIdAscVersionNumberAsc(Integer voyageId);

    Optional<LaytimeCalculation> findByVoyageIdAndPortLocationIdAndIsCurrentVersionTrue(Integer voyageId, Integer portLocationId);
}
