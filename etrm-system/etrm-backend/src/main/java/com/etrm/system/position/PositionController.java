package com.etrm.system.position;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/trade/positions/api.ts (list-only, no writes). */
@RestController
@RequestMapping("/api/v1/positions")
public class PositionController {

    private final PositionService service;

    public PositionController(PositionService service) {
        this.service = service;
    }

    @GetMapping
    public List<Position> list(
            @RequestParam(required = false) String commodityType,
            @RequestParam(required = false) Integer bookId,
            @RequestParam(required = false) String periodCode
    ) {
        return service.list(commodityType, bookId, periodCode);
    }
}
