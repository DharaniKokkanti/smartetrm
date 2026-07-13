package com.etrm.system.fieldpermission;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ObjectLockRuleRepository extends JpaRepository<ObjectLockRule, Integer> {
    List<ObjectLockRule> findByScreenCodeAndIsActiveTrueOrderBySortOrder(String screenCode);
}
