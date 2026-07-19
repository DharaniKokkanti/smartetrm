package com.etrm.system.legalentity;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Denormalized display shape for a legal_entity_ownership row — not persisted. */
public record LegalEntityOwnershipView(
        Integer ownershipId,
        Integer jvEntityId,
        String ownerType,
        Integer ownerRefId,
        String externalOwnerName,
        String ownerDisplayName,
        BigDecimal ownershipPct,
        Boolean isOperator,
        String consolidationMethod,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        Boolean isActive,
        String notes) {
}
