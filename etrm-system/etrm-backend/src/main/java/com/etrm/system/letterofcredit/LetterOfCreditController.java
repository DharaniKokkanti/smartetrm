package com.etrm.system.letterofcredit;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/credit/letters-of-credit/api.ts. */
@RestController
@RequestMapping("/api/v1/credit/letters-of-credit")
public class LetterOfCreditController {

    private final LetterOfCreditService service;

    public LetterOfCreditController(LetterOfCreditService service) {
        this.service = service;
    }

    @GetMapping
    public List<LetterOfCredit> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<LetterOfCredit> create(@Valid @RequestBody LetterOfCredit input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public LetterOfCredit update(@PathVariable Integer id, @Valid @RequestBody LetterOfCredit input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable Integer id) {
        service.cancel(id);
        return ResponseEntity.noContent().build();
    }
}
