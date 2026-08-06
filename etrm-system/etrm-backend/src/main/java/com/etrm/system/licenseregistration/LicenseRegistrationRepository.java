package com.etrm.system.licenseregistration;

import com.etrm.system.polymorphic.EntityType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LicenseRegistrationRepository extends JpaRepository<LicenseRegistration, Integer> {
    List<LicenseRegistration> findByEntityTypeAndEntityId(EntityType entityType, Integer entityId);
}
