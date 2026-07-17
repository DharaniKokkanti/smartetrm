package com.etrm.system.desk;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.trader.TraderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DeskService {

    private final DeskRepository repository;
    private final LegalEntityRepository legalEntityRepository;
    private final TraderRepository traderRepository;

    public DeskService(DeskRepository repository, LegalEntityRepository legalEntityRepository, TraderRepository traderRepository) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
        this.traderRepository = traderRepository;
    }

    /** Populates the display-only denormalized fields the frontend Desk type expects. */
    private Desk denormalize(Desk desk) {
        legalEntityRepository.findById(desk.getLegalEntityId())
                .ifPresent(le -> desk.setLegalEntityCode(le.getEntityCode()));
        if (desk.getHeadTraderId() != null) {
            traderRepository.findById(desk.getHeadTraderId())
                    .ifPresent(t -> desk.setHeadTraderName(t.getFullName() != null ? t.getFullName() : t.getTraderCode()));
        }
        return desk;
    }

    @Transactional(readOnly = true)
    public List<Desk> list() {
        return repository.findAll().stream().map(this::denormalize).toList();
    }

    @Transactional(readOnly = true)
    public Desk get(Integer id) {
        return denormalize(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No desk with id " + id + ".")));
    }

    private void normalizeCodeField(Desk input) {
        if (input.getDeskCode() != null) input.setDeskCode(input.getDeskCode().toUpperCase());
    }

    public Desk create(Desk input) {
        normalizeCodeField(input);
        if (repository.existsByDeskCodeIgnoreCase(input.getDeskCode())) {
            throw new ConflictException("Desk Code \"" + input.getDeskCode() + "\" already exists.");
        }
        input.setDeskId(null);
        return denormalize(repository.save(input));
    }

    public Desk update(Integer id, Desk input) {
        Desk existing = get(id);
        normalizeCodeField(input);
        input.setDeskId(id);
        // created_at/created_by only populate via JPA auditing on insert — not
        // copied here, the response would show them as null despite the DB
        // value being untouched (updatable = false).
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return denormalize(repository.save(input));
    }

    public void deactivate(Integer id) {
        Desk existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No desk with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
