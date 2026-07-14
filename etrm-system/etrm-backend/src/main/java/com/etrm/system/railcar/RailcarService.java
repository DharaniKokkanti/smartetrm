package com.etrm.system.railcar;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.country.CountryRepository;
import com.etrm.system.transportoperator.TransportOperatorRepository;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class RailcarService {

    private final RailcarRepository repository;
    private final TransportOperatorRepository operatorRepository;
    private final CountryRepository countryRepository;
    private final AuditorAware<String> auditorAware;

    public RailcarService(RailcarRepository repository, TransportOperatorRepository operatorRepository,
                           CountryRepository countryRepository, AuditorAware<String> auditorAware) {
        this.repository = repository;
        this.operatorRepository = operatorRepository;
        this.countryRepository = countryRepository;
        this.auditorAware = auditorAware;
    }

    private Railcar hydrate(Railcar railcar) {
        operatorRepository.findById(railcar.getOperatorId()).ifPresent(o -> railcar.setOperatorName(o.getOperatorName()));
        countryRepository.findById(railcar.getCountryId()).ifPresent(c -> railcar.setCountryName(c.getCountryName()));
        return railcar;
    }

    @Transactional(readOnly = true)
    public List<Railcar> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Railcar create(Railcar input) {
        if (repository.existsByCarNumberIgnoreCase(input.getCarNumber())) {
            throw new ConflictException("Car Number \"" + input.getCarNumber() + "\" already exists.");
        }
        input.setRailcarId(null);
        input.setCreatedAt(LocalDateTime.now());
        input.setCreatedBy(auditorAware.getCurrentAuditor().orElse("SYSTEM"));
        return hydrate(repository.save(input));
    }

    public Railcar update(Integer id, Railcar input) {
        Railcar existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No railcar with id " + id + "."));
        input.setRailcarId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Railcar existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No railcar with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
