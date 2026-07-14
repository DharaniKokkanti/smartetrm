package com.etrm.system.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductSpecTemplateRepository extends JpaRepository<ProductSpecTemplate, Integer> {
    List<ProductSpecTemplate> findByProductId(Integer productId);
}
