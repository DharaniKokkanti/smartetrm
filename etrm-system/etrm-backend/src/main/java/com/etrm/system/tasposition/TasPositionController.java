package com.etrm.system.tasposition;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Stub — GET /api/v1/pricing/tas-positions returns an empty list rather than
 * 404ing (matches TasDashboardPage.tsx's own path). This is deliberately a
 * stub, not a bug: the real feature is a live view over trade order legs
 * with an active TAS (Trade-at-Settlement) pricing rule — but this codebase
 * has never modeled trade/trade_order as a JPA entity at all (an explicit,
 * repeatedly-confirmed scope boundary from earlier sessions: "trade/
 * trade_order/trade_item/position remain explicitly out of the Master Data
 * build's scope"), so there is nothing to query yet. The PATCH
 * .../{orderId}/lock-price action is intentionally NOT implemented here —
 * with no real rows there's nothing to lock, and an unmapped PATCH now
 * correctly 405s (GlobalExceptionHandler's HttpRequestMethodNotSupported
 * handler, fixed this same session) rather than crashing with a 500.
 * Replace this stub once a real TradeOrder entity exists.
 */
@RestController
@RequestMapping("/api/v1/pricing/tas-positions")
public class TasPositionController {

    @GetMapping
    public List<Map<String, Object>> list() {
        return List.of();
    }
}
