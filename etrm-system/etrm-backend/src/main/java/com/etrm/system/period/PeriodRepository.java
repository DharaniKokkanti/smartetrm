package com.etrm.system.period;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PeriodRepository extends JpaRepository<Period, Integer> {
    boolean existsByPeriodCodeIgnoreCase(String periodCode);
}
