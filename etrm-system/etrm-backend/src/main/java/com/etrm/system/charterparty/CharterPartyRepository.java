package com.etrm.system.charterparty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CharterPartyRepository extends JpaRepository<CharterParty, Integer> {
    List<CharterParty> findByVesselId(Integer vesselId);

    List<CharterParty> findByCounterpartyId(Integer counterpartyId);
}
