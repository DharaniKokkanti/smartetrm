package com.etrm.system.period;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/calendar/periods/api.ts. */
@RestController
@RequestMapping("/api/v1/periods")
public class PeriodController {

    private final PeriodService service;

    public PeriodController(PeriodService service) {
        this.service = service;
    }

    @GetMapping
    public List<Period> list(@RequestParam(required = false) Integer marketProductLinkId) {
        return marketProductLinkId == null ? service.list() : service.listByMarketProductLink(marketProductLinkId);
    }

    @PostMapping
    public ResponseEntity<Period> create(@Valid @RequestBody Period input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Period update(@PathVariable Long id, @Valid @RequestBody Period input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    public record BulkCreateRequest(List<Period> periods) {}

    @PostMapping("/bulk")
    public PeriodService.BulkResult bulkCreate(@RequestBody BulkCreateRequest request) {
        return service.bulkCreate(request.periods());
    }

    @PostMapping("/auto-generate")
    public List<Period> autoGenerate(@Valid @RequestBody PeriodService.AutoGenerateRequest request) {
        return service.autoGenerate(request);
    }
}
