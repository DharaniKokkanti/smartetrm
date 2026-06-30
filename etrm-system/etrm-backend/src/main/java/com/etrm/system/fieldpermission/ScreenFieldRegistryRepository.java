package com.etrm.system.fieldpermission;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScreenFieldRegistryRepository extends JpaRepository<ScreenFieldRegistry, Long> {
    List<ScreenFieldRegistry> findByScreenCodeAndIsActiveTrueOrderBySortOrder(String screenCode);
    List<String> findDistinctScreenCodeByIsActiveTrue();
}
