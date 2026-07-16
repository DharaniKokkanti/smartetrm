package com.etrm.system.voyage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoyageRepository extends JpaRepository<Voyage, Integer> {
    List<Voyage> findByVesselId(Integer vesselId);

    List<Voyage> findByCharterPartyId(Integer charterPartyId);

    Optional<Voyage> findByVoyageNumberIgnoreCase(String voyageNumber);
}
