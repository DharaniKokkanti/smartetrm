package com.etrm.system.railcar;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.country.CountryRepository;
import com.etrm.system.transportoperator.TransportOperatorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RailcarService {

    private final RailcarRepository repository;
    private final TransportOperatorRepository operatorRepository;
    private final CountryRepository countryRepository;

    public RailcarService(RailcarRepository repository, TransportOperatorRepository operatorRepository,
                           CountryRepository countryRepository) {
        this.repository = repository;
        this.operatorRepository = operatorRepository;
        this.countryRepository = countryRepository;
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

    @Transactional(readOnly = true)
    public Railcar get(Integer id) {
        return hydrate(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No railcar with id " + id + ".")));
    }

    public Railcar create(Railcar input) {
        if (repository.existsByCarNumberIgnoreCase(input.getCarNumber())) {
            throw new ConflictException("Car Number \"" + input.getCarNumber() + "\" already exists.");
        }
        input.setRailcarId(null);
        return hydrate(repository.save(input));
    }

    public Railcar update(Integer id, Railcar input) {
        Railcar existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No railcar with id " + id + "."));
        input.setRailcarId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
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
