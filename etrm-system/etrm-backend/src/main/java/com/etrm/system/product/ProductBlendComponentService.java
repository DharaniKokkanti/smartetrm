package com.etrm.system.product;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ProductBlendComponentService {

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

    public ProductBlendComponent create(Integer parentProductId, ProductBlendComponent input) {
        input.setBlendComponentId(null);
        input.setParentProductId(parentProductId);
        input.setCreatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public void delete(Integer blendComponentId) {
        if (!repository.existsById(blendComponentId)) {
            throw new NotFoundException("No blend component with id " + blendComponentId + ".");
        }
        repository.deleteById(blendComponentId);
    }
}
