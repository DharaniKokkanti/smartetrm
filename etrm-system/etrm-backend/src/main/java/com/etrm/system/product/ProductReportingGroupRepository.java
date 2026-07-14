package com.etrm.system.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductReportingGroupRepository extends JpaRepository<ProductReportingGroup, Integer> {
    List<ProductReportingGroup> findByProductId(Integer productId);
}
