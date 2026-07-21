package com.etrm.system.pipeline;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.holidaycalendar.HolidayCalendarRepository;
import com.etrm.system.product.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PipelineCycleService {

    private final PipelineCycleRepository repository;
    private final PipelineRepository pipelineRepository;
    private final ProductRepository productRepository;
    private final HolidayCalendarRepository calendarRepository;

    public PipelineCycleService(PipelineCycleRepository repository, PipelineRepository pipelineRepository,
                                 ProductRepository productRepository, HolidayCalendarRepository calendarRepository) {
        this.repository = repository;
        this.pipelineRepository = pipelineRepository;
        this.productRepository = productRepository;
        this.calendarRepository = calendarRepository;
    }

    private PipelineCycle hydrate(PipelineCycle cycle) {
        pipelineRepository.findById(cycle.getPipelineId()).ifPresent(p -> cycle.setPipelineName(p.getPipelineName()));
        if (cycle.getProductId() != null) {
            productRepository.findById(cycle.getProductId()).ifPresent(p -> cycle.setProductName(p.getProductName()));
        }
        if (cycle.getCalendarId() != null) {
            calendarRepository.findById(cycle.getCalendarId()).ifPresent(c -> cycle.setCalendarName(c.getCalendarName()));
        }
        return cycle;
    }

    @Transactional(readOnly = true)
    public List<PipelineCycle> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public PipelineCycle create(PipelineCycle input) {
        input.setCycleId(null);
        return hydrate(repository.save(input));
    }

    public PipelineCycle update(Integer id, PipelineCycle input) {
        PipelineCycle existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No pipeline cycle with id " + id + "."));
        input.setCycleId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy (V148) — JPA
        // auditing only populates those on insert, so the request body never
        // carries them; without copying them from the existing row here,
        // updatable=false keeps the DB value untouched but the response
        // would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        PipelineCycle existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No pipeline cycle with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
