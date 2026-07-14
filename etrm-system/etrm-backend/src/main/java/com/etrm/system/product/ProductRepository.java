package com.etrm.system.product;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Integer> {
    boolean existsByProductCodeIgnoreCase(String productCode);
}
