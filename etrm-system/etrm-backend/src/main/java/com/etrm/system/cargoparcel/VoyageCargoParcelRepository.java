package com.etrm.system.cargoparcel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VoyageCargoParcelRepository extends JpaRepository<VoyageCargoParcel, Integer> {
    List<VoyageCargoParcel> findByVoyageId(Integer voyageId);
}
