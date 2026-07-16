package com.etrm.system.bunker;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.location.LocationRepository;
import com.etrm.system.vessel.VesselRepository;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class BunkerStemService {

    private final BunkerStemRepository repository;
    private final VesselBunkerRobLedgerRepository robLedgerRepository;
    private final VesselRepository vesselRepository;
    private final BunkerFuelGradeRepository fuelGradeRepository;
    private final CurrencyRepository currencyRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final LocationRepository locationRepository;
    private final AuditorAware<String> auditorAware;

    public BunkerStemService(BunkerStemRepository repository, VesselBunkerRobLedgerRepository robLedgerRepository,
                              VesselRepository vesselRepository, BunkerFuelGradeRepository fuelGradeRepository,
                              CurrencyRepository currencyRepository, CounterpartyRepository counterpartyRepository,
                              LocationRepository locationRepository, AuditorAware<String> auditorAware) {
        this.repository = repository;
        this.robLedgerRepository = robLedgerRepository;
        this.vesselRepository = vesselRepository;
        this.fuelGradeRepository = fuelGradeRepository;
        this.currencyRepository = currencyRepository;
        this.counterpartyRepository = counterpartyRepository;
        this.locationRepository = locationRepository;
        this.auditorAware = auditorAware;
    }

    private BunkerStem hydrate(BunkerStem stem) {
        vesselRepository.findById(stem.getVesselId()).ifPresent(v -> stem.setVesselName(v.getVesselName()));
        fuelGradeRepository.findById(stem.getFuelGradeId()).ifPresent(f -> stem.setFuelGradeCode(f.getGradeCode()));
        if (stem.getCurrencyId() != null) {
            currencyRepository.findById(stem.getCurrencyId()).ifPresent(c -> stem.setCurrencyCode(c.getCurrencyCode()));
        }
        if (stem.getSupplierCounterpartyId() != null) {
            counterpartyRepository.findById(stem.getSupplierCounterpartyId()).ifPresent(c -> stem.setSupplierName(c.getLegalName()));
        }
        if (stem.getPortLocationId() != null) {
            locationRepository.findById(stem.getPortLocationId()).ifPresent(l -> stem.setPortLocationName(l.getLocationName()));
        }
        return stem;
    }

    // Appends the append-only ROB ledger entry in the same transaction as the stem write —
    // the ledger is the audit trail, so it is never generated later or backfilled.
    private void appendRobLedgerEntry(BunkerStem stem) {
        if (stem.getRobAfterMt() == null) {
            return;
        }
        VesselBunkerRobLedger entry = new VesselBunkerRobLedger();
        entry.setVesselId(stem.getVesselId());
        entry.setFuelGradeId(stem.getFuelGradeId());
        entry.setEventType("STEM");
        entry.setEventTime(stem.getStemDate() != null ? stem.getStemDate().atStartOfDay() : LocalDateTime.now());
        entry.setQuantityChangeMt(stem.getQuantityMt());
        entry.setRobAfterMt(stem.getRobAfterMt());
        entry.setVoyageId(stem.getVoyageId());
        entry.setSourceBunkerStemId(stem.getBunkerStemId());
        entry.setNotes("Bunker stem #" + stem.getBunkerStemId() + " (" + stem.getStatus() + ")");
        entry.setCreatedAt(LocalDateTime.now());
        entry.setCreatedBy(auditorAware.getCurrentAuditor().orElse("SYSTEM"));
        robLedgerRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<BunkerStem> list(Integer voyageId, Integer vesselId) {
        List<BunkerStem> results;
        if (voyageId != null) {
            results = repository.findByVoyageId(voyageId);
        } else if (vesselId != null) {
            results = repository.findByVesselId(vesselId);
        } else {
            results = repository.findAll();
        }
        return results.stream().map(this::hydrate).toList();
    }

    public BunkerStem create(BunkerStem input) {
        input.setBunkerStemId(null);
        BunkerStem saved = repository.save(input);
        if ("DELIVERED".equals(saved.getStatus())) {
            appendRobLedgerEntry(saved);
        }
        return hydrate(saved);
    }

    public BunkerStem update(Integer id, BunkerStem input) {
        BunkerStem existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No bunker stem with id " + id + "."));
        boolean transitioningToDelivered = !"DELIVERED".equals(existing.getStatus()) && "DELIVERED".equals(input.getStatus());
        input.setBunkerStemId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        BunkerStem saved = repository.save(input);
        if (transitioningToDelivered) {
            appendRobLedgerEntry(saved);
        }
        return hydrate(saved);
    }

    public void deactivate(Integer id) {
        BunkerStem existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No bunker stem with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
