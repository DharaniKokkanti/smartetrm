package com.etrm.system.vessel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VesselPerformanceCurveRepository extends JpaRepository<VesselPerformanceCurve, Integer> {
    List<VesselPerformanceCurve> findByVesselId(Integer vesselId);
}
