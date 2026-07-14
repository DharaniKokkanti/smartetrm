package com.etrm.system.pipeline;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.transportoperator.TransportOperatorRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PipelineService {

    private final PipelineRepository repository;
    private final TransportOperatorRepository operatorRepository;
    private final UnitOfMeasureRepository uomRepository;

    public PipelineService(PipelineRepository repository, TransportOperatorRepository operatorRepository,
                            UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.operatorRepository = operatorRepository;
        this.uomRepository = uomRepository;
    }

    private Pipeline hydrate(Pipeline pipeline) {
        operatorRepository.findById(pipeline.getOperatorId()).ifPresent(o -> pipeline.setOperatorName(o.getOperatorName()));
        if (pipeline.getOwnerOperatorId() != null) {
            operatorRepository.findById(pipeline.getOwnerOperatorId())
                    .ifPresent(o -> pipeline.setOwnerOperatorName(o.getOperatorName()));
        }
        if (pipeline.getCapacityUomId() != null) {
            uomRepository.findById(pipeline.getCapacityUomId()).ifPresent(u -> pipeline.setCapacityUomCode(u.getUomCode()));
        }
        return pipeline;
    }

    private void normalizeCodeField(Pipeline input) {
        if (input.getPipelineCode() != null) input.setPipelineCode(input.getPipelineCode().toUpperCase());
    }

    @Transactional(readOnly = true)
    public List<Pipeline> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Pipeline create(Pipeline input) {
        normalizeCodeField(input);
        if (repository.existsByPipelineCodeIgnoreCase(input.getPipelineCode())) {
            throw new ConflictException("Pipeline Code \"" + input.getPipelineCode() + "\" already exists.");
        }
        input.setPipelineId(null);
        return hydrate(repository.save(input));
    }

    public Pipeline update(Integer id, Pipeline input) {
        Pipeline existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No pipeline with id " + id + "."));
        normalizeCodeField(input);
        input.setPipelineId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Pipeline existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No pipeline with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
