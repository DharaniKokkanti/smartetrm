package com.etrm.system.nomination;

/**
 * Lightweight leg picker option for the nomination/delivery-instruction
 * "order" field (identifies a tran_leg row, per V258 — the field wasn't
 * renamed since nomination/delivery_instruction's own table names were never
 * order-level) — matches etrm-frontend's TradeOrderOption type. There is no
 * Leg JPA entity in this codebase yet, so
 * NominationController#tradeOrderOptions() always returns an empty list.
 */
public record TradeOrderOption(Integer orderId, String orderReference) {
}
