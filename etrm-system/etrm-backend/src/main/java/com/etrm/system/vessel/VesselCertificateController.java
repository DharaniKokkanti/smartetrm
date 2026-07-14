package com.etrm.system.vessel;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/logistics/vessel-certificates/api.ts — that
 * file currently calls plain list()/create()/update() with no query filter
 * and no delete, but the list endpoint here also accepts an optional
 * ?vesselId= filter for future/other callers.
 */
@RestController
@RequestMapping("/api/v1/logistics/vessel-certificates")
public class VesselCertificateController {

    private final VesselCertificateService service;

    public VesselCertificateController(VesselCertificateService service) {
        this.service = service;
    }

    @GetMapping
    public List<VesselCertificate> list(@RequestParam(required = false) Integer vesselId) {
        return service.list(vesselId);
    }

    @PostMapping
    public ResponseEntity<VesselCertificate> create(@Valid @RequestBody VesselCertificate input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public VesselCertificate update(@PathVariable Integer id, @Valid @RequestBody VesselCertificate input) {
        return service.update(id, input);
    }
}
