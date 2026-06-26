package com.etrm.system.counterparty;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CounterpartyRepository extends JpaRepository<Counterparty, Long> {
    boolean existsByCpCodeIgnoreCase(String cpCode);
}
