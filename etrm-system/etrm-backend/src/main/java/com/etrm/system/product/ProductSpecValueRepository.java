package com.etrm.system.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductSpecValueRepository extends JpaRepository<ProductSpecValue, Integer> {
    List<ProductSpecValue> findByTemplateId(Integer templateId);
}
