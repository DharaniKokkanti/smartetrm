package com.etrm.system.fieldpermission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RoleFieldProfileRepository extends JpaRepository<RoleFieldProfile, Long> {

    @Query("""
        SELECT rfp FROM RoleFieldProfile rfp
        WHERE rfp.role.roleId IN :roleIds
          AND rfp.profile.screenCode = :screenCode
          AND rfp.profile.isActive = true
        """)
    List<RoleFieldProfile> findByRoleIdsAndScreenCode(
            @Param("roleIds") List<Long> roleIds,
            @Param("screenCode") String screenCode);
}
