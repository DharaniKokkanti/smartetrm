package com.etrm.system.railcar;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RailcarRepository extends JpaRepository<Railcar, Integer> {
    boolean existsByCarNumberIgnoreCase(String carNumber);
}
