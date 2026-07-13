package com.etrm.system.polymorphic;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EntityContactRepository extends JpaRepository<EntityContact, Integer> {
    List<EntityContact> findByEntityTypeAndEntityId(EntityType entityType, Long entityId);
    List<EntityContact> findByEntityTypeAndEntityIdAndIsActiveTrue(EntityType entityType, Long entityId);
}
