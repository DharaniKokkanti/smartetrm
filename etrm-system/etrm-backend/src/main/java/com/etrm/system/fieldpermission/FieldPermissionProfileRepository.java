package com.etrm.system.fieldpermission;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FieldPermissionProfileRepository extends JpaRepository<FieldPermissionProfile, Long> {
    List<FieldPermissionProfile> findByScreenCodeAndIsActiveTrueOrderByProfileName(String screenCode);
    Optional<FieldPermissionProfile> findByProfileCode(String profileCode);
}
