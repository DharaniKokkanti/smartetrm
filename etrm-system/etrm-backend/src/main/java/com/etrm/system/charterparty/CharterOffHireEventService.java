package com.etrm.system.charterparty;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;

@Service
@Transactional
public class CharterOffHireEventService {

    private final CharterOffHireEventRepository repository;
    private final OffHireReasonTypeRepository reasonTypeRepository;

    public CharterOffHireEventService(CharterOffHireEventRepository repository, OffHireReasonTypeRepository reasonTypeRepository) {
        this.repository = repository;
        this.reasonTypeRepository = reasonTypeRepository;
    }

    private CharterOffHireEvent hydrate(CharterOffHireEvent event) {
        reasonTypeRepository.findById(event.getOffHireReasonTypeId()).ifPresent(r -> event.setReasonCode(r.getReasonCode()));
        return event;
    }

    // Computed once here (and re-derived on every save) rather than left for the client to
    // supply, so a bad client-side hours figure can never silently diverge from from_ts/to_ts.
    private void computeHours(CharterOffHireEvent event) {
        if (event.getToTs() != null) {
            event.setHours(BigDecimal.valueOf(Duration.between(event.getFromTs(), event.getToTs()).toMinutes())
                    .divide(BigDecimal.valueOf(60)));
        } else {
            event.setHours(null);
        }
    }

    @Transactional(readOnly = true)
    public List<CharterOffHireEvent> list(Integer charterPartyId) {
        List<CharterOffHireEvent> events = charterPartyId != null
                ? repository.findByCharterPartyId(charterPartyId)
                : repository.findAll();
        return events.stream().map(this::hydrate).toList();
    }

    public CharterOffHireEvent create(CharterOffHireEvent input) {
        input.setOffHireEventId(null);
        computeHours(input);
        return hydrate(repository.save(input));
    }

    public CharterOffHireEvent update(Integer id, CharterOffHireEvent input) {
        CharterOffHireEvent existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No off-hire event with id " + id + "."));
        input.setOffHireEventId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        computeHours(input);
        return hydrate(repository.save(input));
    }
}
