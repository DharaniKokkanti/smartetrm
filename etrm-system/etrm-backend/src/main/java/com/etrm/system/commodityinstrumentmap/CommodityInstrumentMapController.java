package com.etrm.system.commodityinstrumentmap;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * GET-only — path/verb shape must stay in sync with
 * etrm-frontend/src/features/reference/commodity-instrument-map/api.ts.
 * Restricts which instrument types (FUTURES, SWAP_FIXED_FLOAT, ...) are
 * selectable in the Trade Blotter for a given commodity. A commodity type
 * with no rows here (e.g. MULTI, OTHER) is intentionally absent from the
 * response — the frontend already falls back to allowing every instrument
 * type in that case.
 */
@RestController
@RequestMapping("/api/v1/commodity-instrument-map")
public class CommodityInstrumentMapController {

    private final CommodityInstrumentMapRepository repository;

    public CommodityInstrumentMapController(CommodityInstrumentMapRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public Map<String, List<String>> get() {
        Map<String, List<String>> result = new LinkedHashMap<>();
        for (CommodityInstrumentMapEntry entry : repository.findByIsActiveTrueOrderBySortOrder()) {
            result.computeIfAbsent(entry.getCommodityType(), k -> new java.util.ArrayList<>()).add(entry.getInstrumentType());
        }
        return result;
    }
}
