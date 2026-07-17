package com.etrm.system.deliveryinstruction;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with etrm-frontend/src/features/operations/delivery-instructions/api.ts. */
@RestController
@RequestMapping("/api/v1/operations/delivery-instructions")
public class DeliveryInstructionController {

    private final DeliveryInstructionService service;

    public DeliveryInstructionController(DeliveryInstructionService service) {
        this.service = service;
    }

    @GetMapping
    public List<DeliveryInstruction> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<DeliveryInstruction> create(@Valid @RequestBody DeliveryInstruction input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public DeliveryInstruction update(@PathVariable Integer id, @Valid @RequestBody DeliveryInstruction input) {
        return service.update(id, input);
    }
}
