package com.etrm.system.nomination;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NominationRepository extends JpaRepository<Nomination, Integer> {
    boolean existsByNominationReferenceIgnoreCase(String nominationReference);
}
