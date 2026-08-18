package com.etrm.system.product;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class ProductBlendComponentService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    // Rounding/entry tolerance for the 100% blend-sum rule -- component
    // percentages are entered by hand, a small slack avoids rejecting a
    // legitimate 99.99/100.01 rounding artifact.
    private static final BigDecimal PCT_TOLERANCE = BigDecimal.valueOf(0.05);

    private final ProductBlendComponentRepository repository;
    private final ProductRepository productRepository;

    public ProductBlendComponentService(ProductBlendComponentRepository repository, ProductRepository productRepository) {
        this.repository = repository;
        this.productRepository = productRepository;
    }

    private ProductBlendComponent hydrate(ProductBlendComponent component) {
        productRepository.findById(component.getComponentProductId()).ifPresent(p -> {
            component.setComponentCode(p.getProductCode());
            component.setComponentName(p.getProductName());
        });
        return component;
    }

    @Transactional(readOnly = true)
    public List<ProductBlendComponent> list(Integer parentProductId) {
        return repository.findByParentProductId(parentProductId).stream().map(this::hydrate).toList();
    }

    /** Additive components only -- the base component is managed exclusively
     * through Product.baseProductId, see syncBaseComponent below. */
    public ProductBlendComponent create(Integer parentProductId, ProductBlendComponent input) {
        if (Boolean.TRUE.equals(input.getIsBaseComponent())) {
            throw new IllegalArgumentException(
                    "The base component is set via the product's Base Product field, not added directly here.");
        }
        List<ProductBlendComponent> siblings = repository.findByParentProductId(parentProductId);
        BigDecimal existingAdditiveTotal = siblings.stream()
                .filter(c -> !Boolean.TRUE.equals(c.getIsBaseComponent()) && Boolean.TRUE.equals(c.getIsActive()))
                .map(ProductBlendComponent::getTargetPct)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal newTotal = existingAdditiveTotal.add(input.getTargetPct() != null ? input.getTargetPct() : BigDecimal.ZERO);
        if (newTotal.compareTo(HUNDRED.add(PCT_TOLERANCE)) > 0) {
            throw new ConflictException("Adding this component would push the blend's additive total to "
                    + newTotal + "%, which leaves no room for the base component. Additives must sum to less than 100%.");
        }
        input.setBlendComponentId(null);
        input.setParentProductId(parentProductId);
        input.setIsBaseComponent(false);
        ProductBlendComponent saved = repository.save(input);
        recomputeBaseTargetPct(parentProductId);
        return hydrate(saved);
    }

    public void delete(Integer blendComponentId) {
        ProductBlendComponent existing = repository.findById(blendComponentId)
                .orElseThrow(() -> new NotFoundException("No blend component with id " + blendComponentId + "."));
        if (Boolean.TRUE.equals(existing.getIsBaseComponent())) {
            throw new IllegalArgumentException(
                    "The base component can't be removed directly — change or clear the product's Base Product field instead.");
        }
        Integer parentProductId = existing.getParentProductId();
        repository.deleteById(blendComponentId);
        recomputeBaseTargetPct(parentProductId);
    }

    /** Keeps the base blend-component row in sync with Product.baseProductId
     * whenever a blend product is created/updated — called from
     * ProductService, not exposed as its own endpoint. Exactly one row per
     * parentProductId ever carries isBaseComponent = true. */
    void syncBaseComponent(Integer parentProductId, Integer baseProductId) {
        List<ProductBlendComponent> siblings = repository.findByParentProductId(parentProductId);
        for (ProductBlendComponent c : siblings) {
            if (Boolean.TRUE.equals(c.getIsBaseComponent()) && !c.getComponentProductId().equals(baseProductId)) {
                c.setIsBaseComponent(false);
                repository.save(c);
            }
        }
        boolean baseRowExists = siblings.stream()
                .anyMatch(c -> c.getComponentProductId().equals(baseProductId) && Boolean.TRUE.equals(c.getIsBaseComponent()));
        if (!baseRowExists) {
            ProductBlendComponent existingRowForBase = siblings.stream()
                    .filter(c -> c.getComponentProductId().equals(baseProductId))
                    .findFirst().orElse(null);
            if (existingRowForBase != null) {
                existingRowForBase.setIsBaseComponent(true);
                repository.save(existingRowForBase);
            } else {
                ProductBlendComponent base = new ProductBlendComponent();
                base.setParentProductId(parentProductId);
                base.setComponentProductId(baseProductId);
                base.setIsBaseComponent(true);
                base.setSequenceNo((short) 0);
                base.setTargetPct(HUNDRED);
                base.setTolerancePct(BigDecimal.ZERO);
                base.setIsActive(true);
                repository.save(base);
            }
        }
        recomputeBaseTargetPct(parentProductId);
    }

    /** The base row's own target_pct is never hand-entered -- it's always
     * "100% minus the active additive rows", recalculated after every
     * additive create/delete or base reassignment. */
    private void recomputeBaseTargetPct(Integer parentProductId) {
        List<ProductBlendComponent> siblings = repository.findByParentProductId(parentProductId);
        ProductBlendComponent base = siblings.stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsBaseComponent()))
                .findFirst().orElse(null);
        if (base == null) return;
        BigDecimal additiveTotal = siblings.stream()
                .filter(c -> !Boolean.TRUE.equals(c.getIsBaseComponent()) && Boolean.TRUE.equals(c.getIsActive()))
                .map(ProductBlendComponent::getTargetPct)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        base.setTargetPct(HUNDRED.subtract(additiveTotal));
        repository.save(base);
    }
}
