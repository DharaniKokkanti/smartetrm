package com.etrm.system.bunker;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VesselBunkerRobLedgerRepository extends JpaRepository<VesselBunkerRobLedger, Integer> {
    List<VesselBunkerRobLedger> findByVesselIdOrderByEventTimeDesc(Integer vesselId);

    List<VesselBunkerRobLedger> findByVesselIdAndFuelGradeIdOrderByEventTimeDesc(Integer vesselId, Integer fuelGradeId);

    List<VesselBunkerRobLedger> findAllByOrderByEventTimeDesc();
}
