package com.etrm.system.trader;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TraderCommodityLimitRepository extends JpaRepository<TraderCommodityLimit, Integer> {
    List<TraderCommodityLimit> findByTraderId(Integer traderId);
    void deleteByTraderId(Integer traderId);
}
