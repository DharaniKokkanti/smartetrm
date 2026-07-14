package com.etrm.system.product;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductSpecTemplateService {

    private final ProductSpecTemplateRepository repository;
    private final ProductRepository productRepository;

    public ProductSpecTemplateService(ProductSpecTemplateRepository repository, ProductRepository productRepository) {
        this.repository = repository;
        this.productRepository = productRepository;
    }

    private ProductSpecTemplate hydrate(ProductSpecTemplate template) {
        productRepository.findById(template.getProductId()).ifPresent(p -> {
            template.setProductCode(p.getProductCode());
            template.setProductName(p.getProductName());
        });
        return template;
    }

    @Transactional(readOnly = true)
    public List<ProductSpecTemplate> list(Integer productId) {
        return repository.findByProductId(productId).stream().map(this::hydrate).toList();
    }

    public ProductSpecTemplate create(Integer productId, ProductSpecTemplate input) {
        input.setTemplateId(null);
        input.setProductId(productId);
        return hydrate(repository.save(input));
    }
}
