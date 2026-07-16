package com.etrm.system.vessel;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/logistics/vessel-cargo-tanks/api.ts. */
@RestController
@RequestMapping("/api/v1/logistics/vessel-cargo-tanks")
public class VesselCargoTankController {

    private final VesselCargoTankService service;

    public VesselCargoTankController(VesselCargoTankService service) {
        this.service = service;
    }

    @GetMapping
    public List<VesselCargoTank> list(@RequestParam(required = false) Integer vesselId) {
        return service.list(vesselId);
    }

    @PostMapping
    public ResponseEntity<VesselCargoTank> create(@Valid @RequestBody VesselCargoTank input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public VesselCargoTank update(@PathVariable Integer id, @Valid @RequestBody VesselCargoTank input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
