package com.etrm.system.taxregistration;

import com.etrm.system.polymorphic.EntityType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaxRegistrationRepository extends JpaRepository<TaxRegistration, Integer> {
    List<TaxRegistration> findByEntityTypeAndEntityId(EntityType entityType, Integer entityId);
}
