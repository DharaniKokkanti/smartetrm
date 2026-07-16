package com.etrm.system.sof;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VoyageSofEventRepository extends JpaRepository<VoyageSofEvent, Integer> {
    List<VoyageSofEvent> findByVoyageIdOrderByPortCallSequenceAscEventTimestampAsc(Integer voyageId);
}
