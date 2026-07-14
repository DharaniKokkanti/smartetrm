package com.etrm.system.incoterm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IncotermRepository extends JpaRepository<Incoterm, Integer> {
    Optional<Incoterm> findByCodeIgnoreCase(String code);
}
