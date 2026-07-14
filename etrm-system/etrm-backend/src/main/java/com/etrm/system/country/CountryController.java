package com.etrm.system.country;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape must stay in sync with
 * etrm-frontend/src/features/reference/countries/api.ts — this is the
 * contract the frontend was built against. Note: that frontend client keys
 * update/deactivate by countryCode, not countryId, so this controller
 * resolves the code to a row before delegating to the service.
 */
@RestController
@RequestMapping("/api/v1/countries")
public class CountryController {

    private final CountryService service;
    private final CountryRepository repository;

    public CountryController(CountryService service, CountryRepository repository) {
        this.service = service;
        this.repository = repository;
    }

    @GetMapping
    public List<Country> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Country> create(@Valid @RequestBody Country input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{code}")
    public Country update(@PathVariable String code, @Valid @RequestBody Country input) {
        return service.update(idForCode(code), input);
    }

    @PatchMapping("/{code}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable String code) {
        service.deactivate(idForCode(code));
        return ResponseEntity.noContent().build();
    }

    private Integer idForCode(String code) {
        return repository.findByCountryCodeIgnoreCase(code)
                .orElseThrow(() -> new com.etrm.system.common.NotFoundException("No country with code \"" + code + "\"."))
                .getCountryId();
    }
}
