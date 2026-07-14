package com.etrm.system.vessel;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VesselRepository extends JpaRepository<Vessel, Integer> {
    boolean existsByImoNumberIgnoreCase(String imoNumber);
}
