package com.etrm.system.truck;

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
public class TruckService {

    private final TruckRepository repository;
    private final TransportOperatorRepository operatorRepository;
    private final CountryRepository countryRepository;
    private final AuditorAware<String> auditorAware;

    public TruckService(TruckRepository repository, TransportOperatorRepository operatorRepository,
                         CountryRepository countryRepository, AuditorAware<String> auditorAware) {
        this.repository = repository;
        this.operatorRepository = operatorRepository;
        this.countryRepository = countryRepository;
        this.auditorAware = auditorAware;
    }

    private void resolveForeignKeys(Truck input) {
        if (input.getOperatorName() != null) {
            input.setOperatorId(operatorRepository.findByOperatorNameIgnoreCase(input.getOperatorName())
                    .orElseThrow(() -> new NotFoundException("No transport operator named \"" + input.getOperatorName() + "\"."))
                    .getOperatorId());
        }
    }

    private Truck hydrate(Truck truck) {
        operatorRepository.findById(truck.getOperatorId()).ifPresent(o -> truck.setOperatorName(o.getOperatorName()));
        countryRepository.findById(truck.getCountryId()).ifPresent(c -> truck.setCountryCode(c.getCountryCode()));
        return truck;
    }

    @Transactional(readOnly = true)
    public List<Truck> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Truck create(Truck input) {
        if (repository.existsByLicensePlateIgnoreCase(input.getLicensePlate())) {
            throw new ConflictException("License Plate \"" + input.getLicensePlate() + "\" already exists.");
        }
        resolveForeignKeys(input);
        input.setVehicleId(null);
        input.setCreatedAt(LocalDateTime.now());
        input.setCreatedBy(auditorAware.getCurrentAuditor().orElse("SYSTEM"));
        return hydrate(repository.save(input));
    }

    public Truck update(Integer id, Truck input) {
        Truck existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No truck with id " + id + "."));
        resolveForeignKeys(input);
        input.setVehicleId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Truck existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No truck with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
