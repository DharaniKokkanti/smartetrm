package com.etrm.system.charterparty;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/voyage-ops/charter-parties/api.ts (off-hire sub-resource). */
@RestController
@RequestMapping("/api/v1/voyage-ops/off-hire-events")
public class CharterOffHireEventController {

    private final CharterOffHireEventService service;

    public CharterOffHireEventController(CharterOffHireEventService service) {
        this.service = service;
    }

    @GetMapping
    public List<CharterOffHireEvent> list(@RequestParam(required = false) Integer charterPartyId) {
        return service.list(charterPartyId);
    }

    @PostMapping
    public ResponseEntity<CharterOffHireEvent> create(@Valid @RequestBody CharterOffHireEvent input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public CharterOffHireEvent update(@PathVariable Integer id, @Valid @RequestBody CharterOffHireEvent input) {
        return service.update(id, input);
    }
}
