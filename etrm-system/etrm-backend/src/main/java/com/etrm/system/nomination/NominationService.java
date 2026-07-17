package com.etrm.system.nomination;

import com.etrm.system.auth.AppUserRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.location.LocationRepository;
import com.etrm.system.pipeline.PipelineRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import com.etrm.system.vessel.VesselRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class NominationService {

    private final NominationRepository repository;
    private final LocationRepository locationRepository;
    private final PipelineRepository pipelineRepository;
    private final VesselRepository vesselRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final AppUserRepository appUserRepository;

    public NominationService(
            NominationRepository repository,
            LocationRepository locationRepository,
            PipelineRepository pipelineRepository,
            VesselRepository vesselRepository,
            CounterpartyRepository counterpartyRepository,
            UnitOfMeasureRepository uomRepository,
            AppUserRepository appUserRepository
    ) {
        this.repository = repository;
        this.locationRepository = locationRepository;
        this.pipelineRepository = pipelineRepository;
        this.vesselRepository = vesselRepository;
        this.counterpartyRepository = counterpartyRepository;
        this.uomRepository = uomRepository;
        this.appUserRepository = appUserRepository;
    }

    private Nomination hydrate(Nomination nomination) {
        // No TradeOrder entity exists in this codebase yet — orderReference always null.
        nomination.setOrderReference(null);
        uomRepository.findById(nomination.getUomId()).ifPresent(u -> nomination.setUomCode(u.getUomCode()));
        if (nomination.getLocationId() != null) {
            locationRepository.findById(nomination.getLocationId())
                    .ifPresent(l -> nomination.setLocationName(l.getLocationName()));
        }
        if (nomination.getPipelineCode() != null) {
            pipelineRepository.findAll().stream()
                    .filter(p -> p.getPipelineCode().equalsIgnoreCase(nomination.getPipelineCode()))
                    .findFirst()
                    .ifPresent(p -> nomination.setPipelineName(p.getPipelineName()));
        }
        if (nomination.getVesselId() != null) {
            vesselRepository.findById(nomination.getVesselId())
                    .ifPresent(v -> nomination.setVesselName(v.getVesselName()));
        }
        if (nomination.getCounterpartyId() != null) {
            counterpartyRepository.findById(nomination.getCounterpartyId())
                    .ifPresent(c -> nomination.setCounterpartyName(c.getLegalName()));
        }
        if (nomination.getSubmittedByUserId() != null) {
            appUserRepository.findById(nomination.getSubmittedByUserId())
                    .ifPresent(u -> nomination.setSubmittedByUserName(u.getFullName()));
        }
        return nomination;
    }

    @Transactional(readOnly = true)
    public List<Nomination> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Nomination create(Nomination input) {
        input.setNominationId(null);
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return hydrate(repository.save(input));
    }

    public Nomination update(Integer id, Nomination input) {
        Nomination existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No nomination with id " + id + "."));
        input.setNominationId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }
}
