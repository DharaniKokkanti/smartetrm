package com.etrm.system.book;

/** Denormalized display shape for Book.classifications — not persisted. */
public record BookClassificationView(
        Integer bookClassificationId,
        String dimensionCode,
        String dimensionName,
        String valueCode,
        String valueLabel,
        Boolean isPrimary) {
}
