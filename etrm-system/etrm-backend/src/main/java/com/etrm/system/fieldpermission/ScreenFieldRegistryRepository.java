package com.etrm.system.fieldpermission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ScreenFieldRegistryRepository extends JpaRepository<ScreenFieldRegistry, Integer> {
    List<ScreenFieldRegistry> findByScreenCodeAndIsActiveTrueOrderBySortOrder(String screenCode);

    // Was a derived query (findDistinctScreenCodeByIsActiveTrue) — Hibernate
    // 6.5's SQM parser rejected it at runtime ("Query selection type
    // ScreenFieldRegistry - multiple selections: use Tuple or array"),
    // 500ing GET /permissions/screens unconditionally. Explicit JPQL
    // sidesteps whatever derived-query-naming ambiguity caused that.
    @Query("SELECT DISTINCT s.screenCode FROM ScreenFieldRegistry s WHERE s.isActive = true")
    List<String> findDistinctScreenCodeByIsActiveTrue();
}
