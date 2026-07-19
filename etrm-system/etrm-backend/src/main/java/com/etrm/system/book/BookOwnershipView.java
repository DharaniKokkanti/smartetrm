package com.etrm.system.book;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Denormalized display shape for a book_ownership row — not persisted. */
public record BookOwnershipView(
        Integer bookOwnershipId,
        Integer bookId,
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
