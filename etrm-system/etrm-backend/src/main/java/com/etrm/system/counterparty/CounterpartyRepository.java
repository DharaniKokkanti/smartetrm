package com.etrm.system.counterparty;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CounterpartyRepository extends JpaRepository<Counterparty, Integer> {
    boolean existsByCpCodeIgnoreCase(String cpCode);
}
