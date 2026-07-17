package com.etrm.system.uomconversion;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/reference/uom-conversions/api.ts. */
@RestController
@RequestMapping("/api/v1/uom-conversions")
public class UomConversionController {

    private final UomConversionService service;

    public UomConversionController(UomConversionService service) {
        this.service = service;
    }

    @GetMapping
    public List<UomConversion> list(@RequestParam(required = false) String commodityType) {
        return service.list(commodityType);
    }

    @PostMapping
    public ResponseEntity<UomConversion> create(@Valid @RequestBody UomConversion input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public UomConversion update(@PathVariable Integer id, @Valid @RequestBody UomConversion input) {
        return service.update(id, input);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
