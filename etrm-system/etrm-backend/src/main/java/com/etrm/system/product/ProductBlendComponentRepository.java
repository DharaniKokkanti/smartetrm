package com.etrm.system.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductBlendComponentRepository extends JpaRepository<ProductBlendComponent, Integer> {
    List<ProductBlendComponent> findByParentProductId(Integer parentProductId);
}
