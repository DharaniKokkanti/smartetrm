package com.etrm.system.polymorphic;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContactRepository extends JpaRepository<Contact, Long> {
    List<Contact> findByIsActiveTrue();
    List<Contact> findByEntityTypeAndEntityId(EntityType entityType, Long entityId);
}
