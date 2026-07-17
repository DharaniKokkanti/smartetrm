package com.etrm.system.transportroute;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.location.LocationRepository;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TransportRouteService {

    private final TransportRouteRepository repository;
    private final MotTypeRepository motTypeRepository;
    private final LocationRepository locationRepository;
    private final AuditorAware<String> auditorAware;

    public TransportRouteService(TransportRouteRepository repository, MotTypeRepository motTypeRepository,
                                  LocationRepository locationRepository, AuditorAware<String> auditorAware) {
        this.repository = repository;
        this.motTypeRepository = motTypeRepository;
        this.locationRepository = locationRepository;
        this.auditorAware = auditorAware;
    }

    private TransportRoute hydrate(TransportRoute route) {
        motTypeRepository.findById(route.getMotTypeId()).ifPresent(m -> route.setMotTypeName(m.getMotName()));
        locationRepository.findById(route.getOriginLocationId()).ifPresent(l -> route.setOriginLocationName(l.getLocationName()));
        locationRepository.findById(route.getDestLocationId()).ifPresent(l -> route.setDestLocationName(l.getLocationName()));
        return route;
    }

    @Transactional(readOnly = true)
    public List<TransportRoute> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public TransportRoute create(TransportRoute input) {
        input.setRouteId(null);
        input.setCreatedAt(LocalDateTime.now());
        input.setCreatedBy(auditorAware.getCurrentAuditor().orElse("SYSTEM"));
        return hydrate(repository.save(input));
    }

    public TransportRoute update(Integer id, TransportRoute input) {
        TransportRoute existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No transport route with id " + id + "."));
        input.setRouteId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }
}
