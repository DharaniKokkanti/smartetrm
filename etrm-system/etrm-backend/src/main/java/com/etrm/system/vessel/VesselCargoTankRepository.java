package com.etrm.system.vessel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VesselCargoTankRepository extends JpaRepository<VesselCargoTank, Integer> {
    List<VesselCargoTank> findByVesselId(Integer vesselId);
}
