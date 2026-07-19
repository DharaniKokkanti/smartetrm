package com.etrm.system.legalentity;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.Counterparty;
import com.etrm.system.counterparty.CounterpartyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/** Sub-resource of LegalEntity — manages dbo.legal_entity_ownership (V125) rows for a JV entity. */
@Service
@Transactional
public class LegalEntityOwnershipService {

    private final LegalEntityOwnershipRepository repository;
    private final LegalEntityRepository legalEntityRepository;
    private final CounterpartyRepository counterpartyRepository;

    public LegalEntityOwnershipService(LegalEntityOwnershipRepository repository,
                                        LegalEntityRepository legalEntityRepository,
                                        CounterpartyRepository counterpartyRepository) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
        this.counterpartyRepository = counterpartyRepository;
    }

    /** Denormalized view of the ownership rows for a JV, plus the advisory total-% indicator. */
    @Transactional(readOnly = true)
    public LegalEntityOwnershipListView list(Integer jvEntityId) {
        List<LegalEntityOwnershipView> views = repository.findByJvEntityId(jvEntityId).stream()
                .map(this::toView)
                .toList();
        BigDecimal total = views.stream()
                .filter(v -> Boolean.TRUE.equals(v.isActive()))
                .map(LegalEntityOwnershipView::ownershipPct)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new LegalEntityOwnershipListView(views, total);
    }

    public LegalEntityOwnership add(Integer jvEntityId, LegalEntityOwnership input) {
        if (!legalEntityRepository.existsById(Objects.requireNonNull(jvEntityId))) {
            throw new NotFoundException("No legal entity with id " + jvEntityId + ".");
        }
        // ownerType itself is guaranteed non-null by AddOwnershipRequest's
        // @NotBlank + @Valid at the controller boundary. ownerRefId is NOT
        // annotated there — it's conditionally required (must be null for
        // EXTERNAL, required for the other two) — so it's validated here,
        // explicitly, as IllegalArgumentException (-> clean 400) rather than
        // Objects.requireNonNull (-> an opaque 500 via the generic handler).
        String ownerType = input.getOwnerType();
        switch (ownerType) {
            case "LEGAL_ENTITY" -> {
                if (input.getOwnerRefId() == null) {
                    throw new IllegalArgumentException("ownerRefId is required for owner_type LEGAL_ENTITY.");
                }
                if (jvEntityId.equals(input.getOwnerRefId())) {
                    throw new ConflictException("A legal entity cannot own itself.");
                }
                if (!legalEntityRepository.existsById(input.getOwnerRefId())) {
                    throw new NotFoundException("No legal entity with id " + input.getOwnerRefId() + ".");
                }
            }
            case "COUNTERPARTY" -> {
                if (input.getOwnerRefId() == null) {
                    throw new IllegalArgumentException("ownerRefId is required for owner_type COUNTERPARTY.");
                }
                if (!counterpartyRepository.existsById(input.getOwnerRefId())) {
                    throw new NotFoundException("No counterparty with id " + input.getOwnerRefId() + ".");
                }
            }
            case "EXTERNAL" -> {
                if (input.getExternalOwnerName() == null || input.getExternalOwnerName().isBlank()) {
                    throw new IllegalArgumentException("externalOwnerName is required for owner_type EXTERNAL");
                }
            }
            default -> throw new IllegalArgumentException("Unknown owner_type \"" + ownerType + "\".");
        }
        if (Boolean.TRUE.equals(input.getIsOperator())
                && repository.findByJvEntityIdAndIsOperatorTrueAndIsActiveTrue(jvEntityId).isPresent()) {
            throw new ConflictException("JV " + jvEntityId + " already has an active operator — "
                    + "remove or deactivate the existing operator row before assigning a new one.");
        }
        input.setOwnershipId(null);
        input.setJvEntityId(jvEntityId);
        if (ownerType.equals("EXTERNAL")) {
            input.setOwnerRefId(null);
        } else {
            input.setExternalOwnerName(null);
        }
        input.setCreatedBy("system");
        return repository.save(input);
        // ux_leo_operator_per_jv (DB filtered unique index) is the backstop if a
        // race slips past the pre-check above — same two-layer pattern as
        // BookTraderService's PRIMARY-per-book handling.
    }

    public void remove(Integer jvEntityId, Integer ownershipId) {
        LegalEntityOwnership row = repository.findById(ownershipId)
                .orElseThrow(() -> new NotFoundException("No legal_entity_ownership row " + ownershipId + "."));
        if (!row.getJvEntityId().equals(jvEntityId)) {
            throw new NotFoundException("No legal_entity_ownership row " + ownershipId + " for JV " + jvEntityId + ".");
        }
        repository.delete(row);
    }

    private LegalEntityOwnershipView toView(LegalEntityOwnership o) {
        String displayName = switch (o.getOwnerType()) {
            case "LEGAL_ENTITY" -> legalEntityRepository.findById(o.getOwnerRefId())
                    .map(LegalEntity::getEntityName)
                    .orElse("(deleted entity #" + o.getOwnerRefId() + ")");
            case "COUNTERPARTY" -> counterpartyRepository.findById(o.getOwnerRefId())
                    .map(Counterparty::getLegalName)
                    .orElse("(deleted counterparty #" + o.getOwnerRefId() + ")");
            default -> o.getExternalOwnerName();
        };
        return new LegalEntityOwnershipView(
                o.getOwnershipId(),
                o.getJvEntityId(),
                o.getOwnerType(),
                o.getOwnerRefId(),
                o.getExternalOwnerName(),
                displayName,
                o.getOwnershipPct(),
                o.getIsOperator(),
                o.getConsolidationMethod(),
                o.getEffectiveFrom(),
                o.getEffectiveTo(),
                o.getIsActive(),
                o.getNotes());
    }
}
