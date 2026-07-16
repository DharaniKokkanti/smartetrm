package com.etrm.system.bunker;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/voyage-ops/bunker-stems/api.ts. */
@RestController
@RequestMapping("/api/v1/voyage-ops/bunker-stems")
public class BunkerStemController {

    private final BunkerStemService service;

    public BunkerStemController(BunkerStemService service) {
        this.service = service;
    }

    @GetMapping
    public List<BunkerStem> list(@RequestParam(required = false) Integer voyageId,
                                  @RequestParam(required = false) Integer vesselId) {
        return service.list(voyageId, vesselId);
    }

    @PostMapping
    public ResponseEntity<BunkerStem> create(@Valid @RequestBody BunkerStem input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public BunkerStem update(@PathVariable Integer id, @Valid @RequestBody BunkerStem input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
