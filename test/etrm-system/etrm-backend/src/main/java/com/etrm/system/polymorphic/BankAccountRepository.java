package com.etrm.system.polymorphic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByEntityTypeAndEntityId(EntityType entityType, Long entityId);
}
