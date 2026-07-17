package com.etrm.system.nomination;

/**
 * Lightweight order picker option for the nomination/delivery-instruction
 * "order" field — matches etrm-frontend's TradeOrderOption type. There is no
 * TradeOrder JPA entity in this codebase yet, so
 * NominationController#tradeOrderOptions() always returns an empty list.
 */
public record TradeOrderOption(Integer orderId, String orderReference) {
}
