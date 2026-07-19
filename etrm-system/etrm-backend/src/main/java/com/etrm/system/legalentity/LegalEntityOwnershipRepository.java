package com.etrm.system.legalentity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LegalEntityOwnershipRepository extends JpaRepository<LegalEntityOwnership, Integer> {
    List<LegalEntityOwnership> findByJvEntityId(Integer jvEntityId);
    Optional<LegalEntityOwnership> findByJvEntityIdAndIsOperatorTrueAndIsActiveTrue(Integer jvEntityId);
    boolean existsByJvEntityIdAndOwnerTypeAndOwnerRefIdAndIsActiveTrue(Integer jvEntityId, String ownerType, Integer ownerRefId);
}
