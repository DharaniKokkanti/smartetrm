package com.etrm.system.portactivity;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.sof.SofEventTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PortActivityTemplateStepService {

    private final PortActivityTemplateStepRepository repository;
    private final SofEventTypeRepository sofEventTypeRepository;

    public PortActivityTemplateStepService(PortActivityTemplateStepRepository repository, SofEventTypeRepository sofEventTypeRepository) {
        this.repository = repository;
        this.sofEventTypeRepository = sofEventTypeRepository;
    }

    private PortActivityTemplateStep hydrate(PortActivityTemplateStep step) {
        sofEventTypeRepository.findById(step.getSofEventTypeId()).ifPresent(t -> step.setEventCode(t.getEventCode()));
        return step;
    }

    @Transactional(readOnly = true)
    public List<PortActivityTemplateStep> list(Integer templateId) {
        List<PortActivityTemplateStep> steps = templateId != null
                ? repository.findByTemplateIdOrderByStepSequenceAsc(templateId)
                : repository.findAll();
        return steps.stream().map(this::hydrate).toList();
    }

    public PortActivityTemplateStep create(PortActivityTemplateStep input) {
        input.setStepId(null);
        return hydrate(repository.save(input));
    }

    public PortActivityTemplateStep update(Integer id, PortActivityTemplateStep input) {
        PortActivityTemplateStep existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No port activity template step with id " + id + "."));
        input.setStepId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void delete(Integer id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("No port activity template step with id " + id + ".");
        }
        repository.deleteById(id);
    }
}
