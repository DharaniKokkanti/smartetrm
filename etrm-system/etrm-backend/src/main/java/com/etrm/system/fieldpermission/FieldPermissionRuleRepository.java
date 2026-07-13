package com.etrm.system.fieldpermission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface FieldPermissionRuleRepository extends JpaRepository<FieldPermissionRule, Integer> {

    List<FieldPermissionRule> findByProfileProfileId(Integer profileId);

    @Query("""
        SELECT r FROM FieldPermissionRule r
        JOIN r.profile p
        WHERE p.screenCode = :screenCode
          AND r.profile.profileId IN :profileIds
        """)
    List<FieldPermissionRule> findByScreenCodeAndProfileIds(
            @Param("screenCode") String screenCode,
            @Param("profileIds") List<Integer> profileIds);

    void deleteByProfileProfileId(Integer profileId);
}
