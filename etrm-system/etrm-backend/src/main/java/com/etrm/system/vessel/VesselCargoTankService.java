package com.etrm.system.vessel;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VesselCargoTankService {

    private final VesselCargoTankRepository repository;
    private final VesselRepository vesselRepository;

    public VesselCargoTankService(VesselCargoTankRepository repository, VesselRepository vesselRepository) {
        this.repository = repository;
        this.vesselRepository = vesselRepository;
    }

    private VesselCargoTank hydrate(VesselCargoTank tank) {
        vesselRepository.findById(tank.getVesselId()).ifPresent(v -> tank.setVesselName(v.getVesselName()));
        return tank;
    }

    @Transactional(readOnly = true)
    public List<VesselCargoTank> list(Integer vesselId) {
        List<VesselCargoTank> tanks = vesselId != null ? repository.findByVesselId(vesselId) : repository.findAll();
        return tanks.stream().map(this::hydrate).toList();
    }

    public VesselCargoTank create(VesselCargoTank input) {
        input.setTankId(null);
        return hydrate(repository.save(input));
    }

    public VesselCargoTank update(Integer id, VesselCargoTank input) {
        VesselCargoTank existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No cargo tank with id " + id + "."));
        input.setTankId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        VesselCargoTank existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No cargo tank with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
