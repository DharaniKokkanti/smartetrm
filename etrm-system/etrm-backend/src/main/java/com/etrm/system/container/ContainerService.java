package com.etrm.system.container;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.transportoperator.TransportOperatorRepository;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ContainerService {

    private final ContainerRepository repository;
    private final TransportOperatorRepository operatorRepository;
    private final AuditorAware<String> auditorAware;

    public ContainerService(ContainerRepository repository, TransportOperatorRepository operatorRepository,
                             AuditorAware<String> auditorAware) {
        this.repository = repository;
        this.operatorRepository = operatorRepository;
        this.auditorAware = auditorAware;
    }

    private Container hydrate(Container container) {
        operatorRepository.findById(container.getOperatorId()).ifPresent(o -> container.setOperatorName(o.getOperatorName()));
        return container;
    }

    @Transactional(readOnly = true)
    public List<Container> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Container create(Container input) {
        if (repository.existsByContainerNumberIgnoreCase(input.getContainerNumber())) {
            throw new ConflictException("Container Number \"" + input.getContainerNumber() + "\" already exists.");
        }
        input.setContainerId(null);
        input.setCreatedAt(LocalDateTime.now());
        input.setCreatedBy(auditorAware.getCurrentAuditor().orElse("SYSTEM"));
        return hydrate(repository.save(input));
    }

    public Container update(Integer id, Container input) {
        Container existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No container with id " + id + "."));
        input.setContainerId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Container existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No container with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
