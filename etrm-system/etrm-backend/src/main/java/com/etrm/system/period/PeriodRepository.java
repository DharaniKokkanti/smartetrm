package com.etrm.system.period;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PeriodRepository extends JpaRepository<Period, Long> {
    boolean existsByPeriodCodeIgnoreCaseAndMarketProductLinkId(String periodCode, Integer marketProductLinkId);

    List<Period> findByMarketProductLinkId(Integer marketProductLinkId);

    /** Latest (by period_start, falling back to period_id) period for a given market_product_link — the auto-generate feature's roll-forward anchor. */
    Optional<Period> findFirstByMarketProductLinkIdOrderByStartDateDescPeriodIdDesc(Integer marketProductLinkId);
}
