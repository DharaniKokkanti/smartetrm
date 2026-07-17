package com.etrm.system.bolmo;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.location.LocationRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class BolmoAgreementService {

    private final BolmoAgreementRepository repository;
    private final BolmoLegRepository legRepository;
    private final CounterpartyRepository counterpartyRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final LocationRepository locationRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final CurrencyRepository currencyRepository;

    public BolmoAgreementService(
            BolmoAgreementRepository repository,
            BolmoLegRepository legRepository,
            CounterpartyRepository counterpartyRepository,
            LegalEntityRepository legalEntityRepository,
            LocationRepository locationRepository,
            UnitOfMeasureRepository uomRepository,
            CurrencyRepository currencyRepository
    ) {
        this.repository = repository;
        this.legRepository = legRepository;
        this.counterpartyRepository = counterpartyRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.locationRepository = locationRepository;
        this.uomRepository = uomRepository;
        this.currencyRepository = currencyRepository;
    }

    private BolmoAgreement hydrate(BolmoAgreement agreement) {
        counterpartyRepository.findById(agreement.getCounterpartyId())
                .ifPresent(c -> agreement.setCounterpartyName(c.getLegalName()));
        legalEntityRepository.findById(agreement.getLegalEntityId())
                .ifPresent(e -> agreement.setLegalEntityName(e.getEntityName()));
        if (agreement.getDeliveryLocationId() != null) {
            locationRepository.findById(agreement.getDeliveryLocationId())
                    .ifPresent(l -> agreement.setDeliveryLocationName(l.getLocationName()));
        }
        uomRepository.findById(agreement.getUomId()).ifPresent(u -> agreement.setUomCode(u.getUomCode()));
        currencyRepository.findById(agreement.getCurrencyId())
                .ifPresent(c -> agreement.setCurrencyCode(c.getCurrencyCode()));

        List<BolmoLeg> legs = legRepository.findByBolmoId(agreement.getBolmoId()).stream()
                .peek(leg -> leg.setOrderReference(null))
                .toList();
        agreement.setLegs(legs);
        agreement.setLegCount(legs.size());
        return agreement;
    }

    @Transactional(readOnly = true)
    public List<BolmoAgreement> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public BolmoAgreement create(BolmoAgreement input) {
        input.setBolmoId(null);
        LocalDateTime now = LocalDateTime.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        if (input.getStatus() == null || input.getStatus().isBlank()) {
            input.setStatus("PENDING");
        }
        // bolmo_reference is auto-generated server-side: BKO-<year>-<zero-padded id>.
        input.setBolmoReference("PENDING");
        BolmoAgreement saved = repository.save(input);
        saved.setBolmoReference(String.format("BKO-%d-%05d", LocalDate.now().getYear(), saved.getBolmoId()));
        saved = repository.save(saved);
        return hydrate(saved);
    }

    public BolmoAgreement update(Integer id, BolmoAgreement input) {
        BolmoAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No bolmo agreement with id " + id + "."));
        input.setBolmoId(id);
        input.setBolmoReference(existing.getBolmoReference());
        input.setCreatedAt(existing.getCreatedAt());
        input.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    private BolmoAgreement setStatus(Integer id, String status) {
        BolmoAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No bolmo agreement with id " + id + "."));
        existing.setStatus(status);
        existing.setUpdatedAt(LocalDateTime.now());
        return hydrate(repository.save(existing));
    }

    public BolmoAgreement agree(Integer id) {
        return setStatus(id, "AGREED");
    }

    public BolmoAgreement complete(Integer id) {
        return setStatus(id, "COMPLETED");
    }

    public BolmoAgreement dispute(Integer id) {
        return setStatus(id, "DISPUTED");
    }

    public BolmoAgreement cancel(Integer id) {
        return setStatus(id, "CANCELLED");
    }

    // ── Legs ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BolmoLeg> listLegs(Integer bolmoId) {
        return legRepository.findByBolmoId(bolmoId).stream().peek(leg -> leg.setOrderReference(null)).toList();
    }

    public BolmoLeg addLeg(Integer bolmoId, BolmoLeg input) {
        repository.findById(bolmoId)
                .orElseThrow(() -> new NotFoundException("No bolmo agreement with id " + bolmoId + "."));
        input.setLegId(null);
        input.setBolmoId(bolmoId);
        input.setCreatedAt(LocalDateTime.now());
        BolmoLeg saved = legRepository.save(input);
        saved.setOrderReference(null);
        return saved;
    }

    public void deleteLeg(Integer legId) {
        BolmoLeg existing = legRepository.findById(legId)
                .orElseThrow(() -> new NotFoundException("No bolmo leg with id " + legId + "."));
        legRepository.delete(existing);
    }
}
