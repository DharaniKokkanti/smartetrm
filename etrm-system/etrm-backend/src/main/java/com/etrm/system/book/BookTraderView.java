package com.etrm.system.book;

/** Denormalized display shape for Book.traders — not persisted. */
public record BookTraderView(Integer traderId, String traderName, String role, Boolean isActive) {
}
