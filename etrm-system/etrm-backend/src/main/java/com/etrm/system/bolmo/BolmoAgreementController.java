package com.etrm.system.bolmo;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape — including the top-level /bolmo-legs/{legId} delete path,
 * which is NOT nested under /bolmo-agreements — must stay in sync with
 * etrm-frontend/src/features/bolmo/api.ts.
 */
@RestController
public class BolmoAgreementController {

    private final BolmoAgreementService service;

    public BolmoAgreementController(BolmoAgreementService service) {
        this.service = service;
    }

    // ── Core ──────────────────────────────────────────────────────────────

    @GetMapping("/api/v1/bolmo-agreements")
    public List<BolmoAgreement> list() {
        return service.list();
    }

    @PostMapping("/api/v1/bolmo-agreements")
    public ResponseEntity<BolmoAgreement> create(@Valid @RequestBody BolmoAgreement input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/api/v1/bolmo-agreements/{id}")
    public BolmoAgreement update(@PathVariable Integer id, @Valid @RequestBody BolmoAgreement input) {
        return service.update(id, input);
    }

    @PatchMapping("/api/v1/bolmo-agreements/{id}/agree")
    public BolmoAgreement agree(@PathVariable Integer id) {
        return service.agree(id);
    }

    @PatchMapping("/api/v1/bolmo-agreements/{id}/complete")
    public BolmoAgreement complete(@PathVariable Integer id) {
        return service.complete(id);
    }

    @PatchMapping("/api/v1/bolmo-agreements/{id}/dispute")
    public BolmoAgreement dispute(@PathVariable Integer id) {
        return service.dispute(id);
    }

    @PatchMapping("/api/v1/bolmo-agreements/{id}/cancel")
    public BolmoAgreement cancel(@PathVariable Integer id) {
        return service.cancel(id);
    }

    // ── Legs ─────────────────────────────────────────────────────────────

    @GetMapping("/api/v1/bolmo-agreements/{bolmoId}/legs")
    public List<BolmoLeg> listLegs(@PathVariable Integer bolmoId) {
        return service.listLegs(bolmoId);
    }

    @PostMapping("/api/v1/bolmo-agreements/{bolmoId}/legs")
    public ResponseEntity<BolmoLeg> addLeg(@PathVariable Integer bolmoId, @Valid @RequestBody BolmoLeg input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addLeg(bolmoId, input));
    }

    @DeleteMapping("/api/v1/bolmo-legs/{legId}")
    public ResponseEntity<Void> deleteLeg(@PathVariable Integer legId) {
        service.deleteLeg(legId);
        return ResponseEntity.noContent().build();
    }
}
