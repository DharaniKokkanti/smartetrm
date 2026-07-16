package com.etrm.system.bunker;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only. Path must stay in sync with
 * etrm-frontend/src/features/voyage-ops/bunker-rob-ledger/api.ts.
 */
@RestController
@RequestMapping("/api/v1/voyage-ops/bunker-rob-ledger")
public class VesselBunkerRobLedgerController {

    private final VesselBunkerRobLedgerService service;

    public VesselBunkerRobLedgerController(VesselBunkerRobLedgerService service) {
        this.service = service;
    }

    @GetMapping
    public List<VesselBunkerRobLedger> list(@RequestParam(required = false) Integer vesselId,
                                             @RequestParam(required = false) Integer fuelGradeId) {
        return service.list(vesselId, fuelGradeId);
    }
}
