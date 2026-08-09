package com.etrm.system.margincall;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarginCallRepository extends JpaRepository<MarginCall, Integer> {
    List<MarginCall> findByMarginAccountIdOrderByCallDateDesc(Integer marginAccountId);
}
