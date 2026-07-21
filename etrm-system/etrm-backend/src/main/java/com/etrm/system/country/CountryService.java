package com.etrm.system.country;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CountryService {

    private final CountryRepository repository;

    public CountryService(CountryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Country> list() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Country get(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No country with id " + id + "."));
    }

    /** countryCode is ISO 3166-1 alpha-2 — always stored uppercase regardless
     *  of how it was typed, matching the convention applied to every other
     *  code column in this schema. */
    private void normalizeCodeField(Country input) {
        if (input.getCountryCode() != null) input.setCountryCode(input.getCountryCode().toUpperCase());
    }

    public Country create(Country input) {
        normalizeCodeField(input);
        if (repository.existsByCountryCodeIgnoreCase(input.getCountryCode())) {
            throw new ConflictException("Country Code \"" + input.getCountryCode() + "\" already exists.");
        }
        input.setCountryId(null);
        return repository.save(input);
    }

    public Country update(Integer id, Country input) {
        Country existing = get(id);
        normalizeCodeField(input);
        input.setCountryId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — JPA auditing
        // only populates those on insert, so the request body never carries
        // them; without copying them from the existing row here, updatable=
        // false keeps the DB value untouched but the response would show
        // them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return repository.save(input);
    }

    public void deactivate(Integer id) {
        Country existing = get(id);
        existing.setIsActive(false);
        repository.save(existing);
    }
}
