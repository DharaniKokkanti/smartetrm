package com.etrm.system.sof;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.location.LocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VoyageSofEventService {

    private final VoyageSofEventRepository repository;
    private final LocationRepository locationRepository;
    private final SofEventTypeRepository sofEventTypeRepository;

    public VoyageSofEventService(VoyageSofEventRepository repository, LocationRepository locationRepository,
                                  SofEventTypeRepository sofEventTypeRepository) {
        this.repository = repository;
        this.locationRepository = locationRepository;
        this.sofEventTypeRepository = sofEventTypeRepository;
    }

    private VoyageSofEvent hydrate(VoyageSofEvent event) {
        locationRepository.findById(event.getPortLocationId()).ifPresent(l -> event.setPortLocationName(l.getLocationName()));
        sofEventTypeRepository.findById(event.getSofEventTypeId()).ifPresent(t -> event.setEventCode(t.getEventCode()));
        return event;
    }

    @Transactional(readOnly = true)
    public List<VoyageSofEvent> list(Integer voyageId) {
        List<VoyageSofEvent> events = voyageId != null
                ? repository.findByVoyageIdOrderByPortCallSequenceAscEventTimestampAsc(voyageId)
                : repository.findAll();
        return events.stream().map(this::hydrate).toList();
    }

    public VoyageSofEvent create(VoyageSofEvent input) {
        input.setSofEventId(null);
        return hydrate(repository.save(input));
    }

    public VoyageSofEvent update(Integer id, VoyageSofEvent input) {
        VoyageSofEvent existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No SOF event with id " + id + "."));
        input.setSofEventId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }
}
