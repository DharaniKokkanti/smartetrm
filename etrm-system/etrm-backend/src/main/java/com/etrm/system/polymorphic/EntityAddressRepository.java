package com.etrm.system.polymorphic;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EntityAddressRepository extends JpaRepository<EntityAddress, Integer> {
    List<EntityAddress> findByEntityTypeAndEntityId(EntityType entityType, Long entityId);
    List<EntityAddress> findByEntityTypeAndEntityIdAndIsActiveTrue(EntityType entityType, Long entityId);
}
