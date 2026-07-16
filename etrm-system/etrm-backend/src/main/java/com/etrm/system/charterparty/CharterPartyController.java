package com.etrm.system.charterparty;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/voyage-ops/charter-parties/api.ts. */
@RestController
@RequestMapping("/api/v1/voyage-ops/charter-parties")
public class CharterPartyController {

    private final CharterPartyService service;

    public CharterPartyController(CharterPartyService service) {
        this.service = service;
    }

    @GetMapping
    public List<CharterParty> list(@RequestParam(required = false) Integer vesselId,
                                    @RequestParam(required = false) Integer counterpartyId) {
        return service.list(vesselId, counterpartyId);
    }

    @GetMapping("/{id}")
    public CharterParty get(@PathVariable Integer id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<CharterParty> create(@Valid @RequestBody CharterParty input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public CharterParty update(@PathVariable Integer id, @Valid @RequestBody CharterParty input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
