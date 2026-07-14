package com.etrm.system.lookup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LookupValueRepository extends JpaRepository<LookupValue, Integer> {
    List<LookupValue> findByCategoryId(Integer categoryId);
}
