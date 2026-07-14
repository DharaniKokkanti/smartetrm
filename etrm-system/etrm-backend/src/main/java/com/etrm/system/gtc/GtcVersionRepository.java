package com.etrm.system.gtc;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GtcVersionRepository extends JpaRepository<GtcVersion, Integer> {
    List<GtcVersion> findByGtcId(Integer gtcId);
    Optional<GtcVersion> findByGtcIdAndIsCurrentTrue(Integer gtcId);
}
