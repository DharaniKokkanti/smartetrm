package com.etrm.system.product;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Path/verb shape must stay in sync with productReportingGroupApi in products/api.ts. ProductReportingGroupInput = {reportingGroupId} only. */
@RestController
@RequestMapping("/api/v1/products/{productId}/reporting-groups")
public class ProductReportingGroupController {

    private final ProductReportingGroupService service;

    public ProductReportingGroupController(ProductReportingGroupService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductReportingGroup> list(@PathVariable Integer productId) {
        return service.list(productId);
    }

    @PostMapping
    public ResponseEntity<ProductReportingGroup> assign(@PathVariable Integer productId, @RequestBody AssignRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.assign(productId, request.reportingGroupId()));
    }

    @DeleteMapping("/{productReportingGroupId}")
    public ResponseEntity<Void> remove(@PathVariable Integer productId, @PathVariable Integer productReportingGroupId) {
        service.remove(productReportingGroupId);
        return ResponseEntity.noContent().build();
    }

    public record AssignRequest(Integer reportingGroupId) {}
}
