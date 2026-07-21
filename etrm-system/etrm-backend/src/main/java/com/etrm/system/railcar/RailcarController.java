package com.etrm.system.railcar;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.product.ProductRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Path/verb shape — including the nested product-approvals sub-resource —
 * must stay in sync with etrm-frontend/src/features/logistics/railcars/api.ts.
 */
@RestController
@RequestMapping("/api/v1/logistics/railcars")
public class RailcarController {

    private static final String RAILCAR_ASSET_TYPE = "RAILCAR";

    private final RailcarService service;
    private final RailcarProductApprovalRepository productApprovalRepository;
    private final ProductRepository productRepository;
    private final UnitOfMeasureRepository uomRepository;

    public RailcarController(
            RailcarService service,
            RailcarProductApprovalRepository productApprovalRepository,
            ProductRepository productRepository,
            UnitOfMeasureRepository uomRepository
    ) {
        this.service = service;
        this.productApprovalRepository = productApprovalRepository;
        this.productRepository = productRepository;
        this.uomRepository = uomRepository;
    }

    // ── Core ──────────────────────────────────────────────────────────────

    @GetMapping
    public List<Railcar> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<Railcar> create(@Valid @RequestBody Railcar input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Railcar update(@PathVariable Integer id, @Valid @RequestBody Railcar input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    // ── Product approvals (dbo.mot_asset_product_approval, asset_type='RAILCAR') ──

    private RailcarProductApproval hydrate(RailcarProductApproval approval) {
        productRepository.findById(approval.getProductId()).ifPresent(p -> approval.setProductName(p.getProductName()));
        if (approval.getQuantityUomId() != null) {
            uomRepository.findById(approval.getQuantityUomId()).ifPresent(u -> approval.setQuantityUomCode(u.getUomCode()));
        }
        return approval;
    }

    @GetMapping("/{railcarId}/product-approvals")
    public List<RailcarProductApproval> listProductApprovals(@PathVariable Integer railcarId) {
        return productApprovalRepository.findByAssetTypeAndAssetId(RAILCAR_ASSET_TYPE, railcarId)
                .stream().map(this::hydrate).toList();
    }

    @PostMapping("/{railcarId}/product-approvals")
    public ResponseEntity<RailcarProductApproval> addProductApproval(
            @PathVariable Integer railcarId, @Valid @RequestBody RailcarProductApproval input
    ) {
        service.get(railcarId); // 404s if the parent doesn't exist
        input.setAssetApprovalId(null);
        input.setAssetType(RAILCAR_ASSET_TYPE);
        input.setAssetId(railcarId);
        // created_at/created_by/updated_at/updated_by are @CreatedDate/
        // @CreatedBy/@LastModifiedDate/@LastModifiedBy (V148) — JPA auditing
        // populates them automatically at flush time.
        return ResponseEntity.status(HttpStatus.CREATED).body(hydrate(productApprovalRepository.save(input)));
    }

    @DeleteMapping("/{railcarId}/product-approvals/{assetApprovalId}")
    public ResponseEntity<Void> deleteProductApproval(
            @PathVariable Integer railcarId, @PathVariable Integer assetApprovalId
    ) {
        RailcarProductApproval existing = productApprovalRepository.findById(assetApprovalId)
                .orElseThrow(() -> new NotFoundException("No product approval with id " + assetApprovalId + "."));
        if (!RAILCAR_ASSET_TYPE.equals(existing.getAssetType()) || !railcarId.equals(existing.getAssetId())) {
            throw new NotFoundException("No product approval with id " + assetApprovalId + " for railcar " + railcarId + ".");
        }
        productApprovalRepository.delete(existing);
        return ResponseEntity.noContent().build();
    }
}
