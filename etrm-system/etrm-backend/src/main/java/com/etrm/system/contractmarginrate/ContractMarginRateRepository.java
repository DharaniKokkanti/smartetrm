package com.etrm.system.contractmarginrate;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractMarginRateRepository extends JpaRepository<ContractMarginRate, Integer> {
    List<ContractMarginRate> findByContractSpecId(Integer contractSpecId);
}
