package com.etrm.system.charterparty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CharterOffHireEventRepository extends JpaRepository<CharterOffHireEvent, Integer> {
    List<CharterOffHireEvent> findByCharterPartyId(Integer charterPartyId);
}
