package com.etrm.system.sof;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/voyage-ops/sof-events/api.ts. */
@RestController
@RequestMapping("/api/v1/voyage-ops/sof-events")
public class VoyageSofEventController {

    private final VoyageSofEventService service;

    public VoyageSofEventController(VoyageSofEventService service) {
        this.service = service;
    }

    @GetMapping
    public List<VoyageSofEvent> list(@RequestParam(required = false) Integer voyageId) {
        return service.list(voyageId);
    }

    @PostMapping
    public ResponseEntity<VoyageSofEvent> create(@Valid @RequestBody VoyageSofEvent input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public VoyageSofEvent update(@PathVariable Integer id, @Valid @RequestBody VoyageSofEvent input) {
        return service.update(id, input);
    }
}
