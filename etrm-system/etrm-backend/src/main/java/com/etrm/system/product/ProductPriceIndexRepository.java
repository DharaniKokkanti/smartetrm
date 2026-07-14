package com.etrm.system.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductPriceIndexRepository extends JpaRepository<ProductPriceIndex, Integer> {
    List<ProductPriceIndex> findByProductId(Integer productId);
}
