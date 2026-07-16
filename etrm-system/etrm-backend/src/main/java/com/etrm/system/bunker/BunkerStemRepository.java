package com.etrm.system.bunker;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BunkerStemRepository extends JpaRepository<BunkerStem, Integer> {
    List<BunkerStem> findByVoyageId(Integer voyageId);

    List<BunkerStem> findByVesselId(Integer vesselId);
}
