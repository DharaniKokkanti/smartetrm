package com.etrm.system.trader;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TraderRepository extends JpaRepository<Trader, Integer> {
    boolean existsByTraderCodeIgnoreCase(String traderCode);
    List<Trader> findByBookId(Integer bookId);
}
