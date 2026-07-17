package com.etrm.system.deliveryinstruction;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryInstructionRepository extends JpaRepository<DeliveryInstruction, Integer> {
    boolean existsByInstructionReferenceIgnoreCase(String instructionReference);
}
