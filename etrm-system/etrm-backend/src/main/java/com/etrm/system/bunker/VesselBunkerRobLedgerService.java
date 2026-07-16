package com.etrm.system.bunker;

import com.etrm.system.vessel.VesselRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Read-only: the ledger is append-only, populated by BunkerStemService — no create/update here. */
@Service
@Transactional(readOnly = true)
public class VesselBunkerRobLedgerService {

    private final VesselBunkerRobLedgerRepository repository;
    private final VesselRepository vesselRepository;
    private final BunkerFuelGradeRepository fuelGradeRepository;

    public VesselBunkerRobLedgerService(VesselBunkerRobLedgerRepository repository, VesselRepository vesselRepository,
                                         BunkerFuelGradeRepository fuelGradeRepository) {
        this.repository = repository;
        this.vesselRepository = vesselRepository;
        this.fuelGradeRepository = fuelGradeRepository;
    }

    private VesselBunkerRobLedger hydrate(VesselBunkerRobLedger entry) {
        vesselRepository.findById(entry.getVesselId()).ifPresent(v -> entry.setVesselName(v.getVesselName()));
        fuelGradeRepository.findById(entry.getFuelGradeId()).ifPresent(f -> entry.setFuelGradeCode(f.getGradeCode()));
        return entry;
    }

    public List<VesselBunkerRobLedger> list(Integer vesselId, Integer fuelGradeId) {
        List<VesselBunkerRobLedger> results;
        if (vesselId != null && fuelGradeId != null) {
            results = repository.findByVesselIdAndFuelGradeIdOrderByEventTimeDesc(vesselId, fuelGradeId);
        } else if (vesselId != null) {
            results = repository.findByVesselIdOrderByEventTimeDesc(vesselId);
        } else {
            results = repository.findAllByOrderByEventTimeDesc();
        }
        return results.stream().map(this::hydrate).toList();
    }
}
