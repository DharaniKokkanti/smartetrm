package com.etrm.system.settlement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SettlementInstructionRepository extends JpaRepository<SettlementInstruction, Integer> {

    List<SettlementInstruction> findByCounterpartyId(Integer counterpartyId);

    List<SettlementInstruction> findByOurEntityId(Integer ourEntityId);

    Optional<SettlementInstruction> findByOurEntityIdAndCounterpartyIdAndDirectionAndCurrencyIdAndProductScopeAndStatusAndValidToIsNull(
            Integer ourEntityId, Integer counterpartyId, SettlementInstruction.Direction direction,
            Integer currencyId, String productScope, SettlementInstruction.Status status);

    long countByInstructionCode(String instructionCode);
}
