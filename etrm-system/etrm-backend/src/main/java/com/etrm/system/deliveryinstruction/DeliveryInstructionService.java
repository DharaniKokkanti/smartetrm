package com.etrm.system.deliveryinstruction;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.location.LocationRepository;
import com.etrm.system.nomination.NominationRepository;
import com.etrm.system.tank.TankRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class DeliveryInstructionService {

    private final DeliveryInstructionRepository repository;
    private final NominationRepository nominationRepository;
    private final TankRepository tankRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final LocationRepository locationRepository;
    private final UnitOfMeasureRepository uomRepository;

    public DeliveryInstructionService(
            DeliveryInstructionRepository repository,
            NominationRepository nominationRepository,
            TankRepository tankRepository,
            CounterpartyRepository counterpartyRepository,
            LocationRepository locationRepository,
            UnitOfMeasureRepository uomRepository
    ) {
        this.repository = repository;
        this.nominationRepository = nominationRepository;
        this.tankRepository = tankRepository;
        this.counterpartyRepository = counterpartyRepository;
        this.locationRepository = locationRepository;
        this.uomRepository = uomRepository;
    }

    private DeliveryInstruction hydrate(DeliveryInstruction di) {
        // No TradeOrder entity exists in this codebase yet — orderReference always null.
        di.setOrderReference(null);
        if (di.getNominationId() != null) {
            nominationRepository.findById(di.getNominationId())
                    .ifPresent(n -> di.setNominationReference(n.getNominationReference()));
        }
        uomRepository.findById(di.getUomId()).ifPresent(u -> di.setUomCode(u.getUomCode()));
        if (di.getLocationId() != null) {
            locationRepository.findById(di.getLocationId()).ifPresent(l -> di.setLocationName(l.getLocationName()));
        }
        if (di.getTankId() != null) {
            tankRepository.findById(di.getTankId()).ifPresent(t -> di.setTankNumber(t.getTankNumber()));
        }
        if (di.getTerminalAgentCounterpartyId() != null) {
            counterpartyRepository.findById(di.getTerminalAgentCounterpartyId())
                    .ifPresent(c -> di.setTerminalAgentCounterpartyName(c.getLegalName()));
        }
        return di;
    }

    @Transactional(readOnly = true)
    public List<DeliveryInstruction> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public DeliveryInstruction create(DeliveryInstruction input) {
        input.setDeliveryInstructionId(null);
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return hydrate(repository.save(input));
    }

    public DeliveryInstruction update(Integer id, DeliveryInstruction input) {
        DeliveryInstruction existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No delivery instruction with id " + id + "."));
        input.setDeliveryInstructionId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }
}
