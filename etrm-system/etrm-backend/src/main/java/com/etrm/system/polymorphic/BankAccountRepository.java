package com.etrm.system.polymorphic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BankAccountRepository extends JpaRepository<BankAccount, Integer> {
    List<BankAccount> findByEntityTypeAndEntityId(EntityType entityType, Integer entityId);
}
