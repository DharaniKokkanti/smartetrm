package com.etrm.system.vessel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VesselCertificateRepository extends JpaRepository<VesselCertificate, Integer> {
    List<VesselCertificate> findByVesselId(Integer vesselId);
}
