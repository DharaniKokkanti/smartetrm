package com.etrm.system.vessel;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/logistics/vessel-performance-curves/api.ts. */
@RestController
@RequestMapping("/api/v1/logistics/vessel-performance-curves")
public class VesselPerformanceCurveController {

    private final VesselPerformanceCurveService service;

    public VesselPerformanceCurveController(VesselPerformanceCurveService service) {
        this.service = service;
    }

    @GetMapping
    public List<VesselPerformanceCurve> list(@RequestParam(required = false) Integer vesselId) {
        return service.list(vesselId);
    }

    @PostMapping
    public ResponseEntity<VesselPerformanceCurve> create(@Valid @RequestBody VesselPerformanceCurve input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public VesselPerformanceCurve update(@PathVariable Integer id, @Valid @RequestBody VesselPerformanceCurve input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
