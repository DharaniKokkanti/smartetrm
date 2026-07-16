package com.etrm.system.cargoparcel;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/voyage-ops/cargo-parcels/api.ts. */
@RestController
@RequestMapping("/api/v1/voyage-ops/cargo-parcels")
public class VoyageCargoParcelController {

    private final VoyageCargoParcelService service;

    public VoyageCargoParcelController(VoyageCargoParcelService service) {
        this.service = service;
    }

    @GetMapping
    public List<VoyageCargoParcel> list(@RequestParam(required = false) Integer voyageId) {
        return service.list(voyageId);
    }

    @PostMapping
    public ResponseEntity<VoyageCargoParcel> create(@Valid @RequestBody VoyageCargoParcel input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public VoyageCargoParcel update(@PathVariable Integer id, @Valid @RequestBody VoyageCargoParcel input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
