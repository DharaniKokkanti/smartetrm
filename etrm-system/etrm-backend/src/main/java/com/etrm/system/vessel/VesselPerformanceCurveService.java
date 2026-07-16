package com.etrm.system.vessel;

import com.etrm.system.bunker.BunkerFuelGradeRepository;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VesselPerformanceCurveService {

    private final VesselPerformanceCurveRepository repository;
    private final VesselRepository vesselRepository;
    private final BunkerFuelGradeRepository fuelGradeRepository;

    public VesselPerformanceCurveService(VesselPerformanceCurveRepository repository, VesselRepository vesselRepository,
                                          BunkerFuelGradeRepository fuelGradeRepository) {
        this.repository = repository;
        this.vesselRepository = vesselRepository;
        this.fuelGradeRepository = fuelGradeRepository;
    }

    private VesselPerformanceCurve hydrate(VesselPerformanceCurve curve) {
        vesselRepository.findById(curve.getVesselId()).ifPresent(v -> curve.setVesselName(v.getVesselName()));
        if (curve.getFuelGradeId() != null) {
            fuelGradeRepository.findById(curve.getFuelGradeId()).ifPresent(f -> curve.setFuelGradeCode(f.getGradeCode()));
        }
        return curve;
    }

    @Transactional(readOnly = true)
    public List<VesselPerformanceCurve> list(Integer vesselId) {
        List<VesselPerformanceCurve> curves = vesselId != null ? repository.findByVesselId(vesselId) : repository.findAll();
        return curves.stream().map(this::hydrate).toList();
    }

    public VesselPerformanceCurve create(VesselPerformanceCurve input) {
        input.setCurveId(null);
        return hydrate(repository.save(input));
    }

    public VesselPerformanceCurve update(Integer id, VesselPerformanceCurve input) {
        VesselPerformanceCurve existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No vessel performance curve with id " + id + "."));
        input.setCurveId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        VesselPerformanceCurve existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No vessel performance curve with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
