package com.etrm.system.settlement;

import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Cross-entity directory (GET) plus the maker-checker verify/reject actions
 * — creation of a new instruction happens under
 * /api/v1/counterparties/{id}/settlement-instructions
 * (CounterpartyController), since it's naturally scoped to one counterparty.
 * Verify/reject are standalone here because the acting user (the "checker")
 * isn't necessarily operating in the context of any one counterparty's page.
 */
@RestController
@RequestMapping("/api/v1/settlement-instructions")
public class SettlementInstructionController {

    private final SettlementInstructionService service;

    public SettlementInstructionController(SettlementInstructionService service) {
        this.service = service;
    }

    @GetMapping
    public List<SettlementInstruction> listAll() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    public SettlementInstruction get(@PathVariable Integer id) {
        return service.get(id);
    }

    @PostMapping("/{id}/verify")
    public SettlementInstruction verify(@PathVariable Integer id, @RequestBody(required = false) VerifyRequest body) {
        return service.verify(id, body != null ? body.verificationMethod() : null);
    }

    @PostMapping("/{id}/reject")
    public SettlementInstruction reject(@PathVariable Integer id, @RequestBody(required = false) RejectRequest body) {
        return service.reject(id, body != null ? body.notes() : null);
    }

    record VerifyRequest(@NotBlank String verificationMethod) {
    }

    record RejectRequest(String notes) {
    }
}
