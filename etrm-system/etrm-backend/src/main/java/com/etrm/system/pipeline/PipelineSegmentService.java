package com.etrm.system.pipeline;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PipelineSegmentService {

    private final PipelineSegmentRepository repository;
    private final PipelineRepository pipelineRepository;
    private final PipelinePointRepository pointRepository;

    public PipelineSegmentService(PipelineSegmentRepository repository, PipelineRepository pipelineRepository,
                                   PipelinePointRepository pointRepository) {
        this.repository = repository;
        this.pipelineRepository = pipelineRepository;
        this.pointRepository = pointRepository;
    }

    private PipelinePoint resolvePoint(String pointCode) {
        return pointRepository.findByPointCodeIgnoreCase(pointCode)
                .orElseThrow(() -> new NotFoundException("No pipeline point with code \"" + pointCode + "\"."));
    }

    private void resolveForeignKeys(PipelineSegment input) {
        if (input.getFromPointCode() != null) {
            input.setFromPointId(resolvePoint(input.getFromPointCode()).getPointId());
        }
        if (input.getToPointCode() != null) {
            input.setToPointId(resolvePoint(input.getToPointCode()).getPointId());
        }
    }

    private PipelineSegment hydrate(PipelineSegment segment) {
        pipelineRepository.findById(segment.getPipelineId()).ifPresent(p -> segment.setPipelineName(p.getPipelineName()));
        pointRepository.findById(segment.getFromPointId()).ifPresent(p -> segment.setFromPointCode(p.getPointCode()));
        pointRepository.findById(segment.getToPointId()).ifPresent(p -> segment.setToPointCode(p.getPointCode()));
        return segment;
    }

    @Transactional(readOnly = true)
    public List<PipelineSegment> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public PipelineSegment create(PipelineSegment input) {
        resolveForeignKeys(input);
        input.setSegmentId(null);
        return hydrate(repository.save(input));
    }

    public PipelineSegment update(Integer id, PipelineSegment input) {
        repository.findById(id).orElseThrow(() -> new NotFoundException("No pipeline segment with id " + id + "."));
        resolveForeignKeys(input);
        input.setSegmentId(id);
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        PipelineSegment existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No pipeline segment with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
