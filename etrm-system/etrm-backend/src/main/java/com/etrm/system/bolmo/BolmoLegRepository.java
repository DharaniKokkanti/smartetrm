package com.etrm.system.bolmo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BolmoLegRepository extends JpaRepository<BolmoLeg, Integer> {
    List<BolmoLeg> findByBolmoId(Integer bolmoId);
}
