package com.etrm.system.book;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.counterparty.Counterparty;
import com.etrm.system.counterparty.CounterpartyRepository;
import com.etrm.system.legalentity.LegalEntity;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * Sub-resource of Book — manages dbo.book_ownership (V126) rows for a book.
 * Independent of the book's parent legal_entity: any book can carry a
 * split regardless of its own entity_type, same reasoning as V126's
 * migration header. Mirrors LegalEntityOwnershipService (V125) closely —
 * same polymorphic-owner resolution, same operator-conflict pre-check.
 */
@Service
@Transactional
public class BookOwnershipService {

    private final BookOwnershipRepository repository;
    private final BookRepository bookRepository;
    private final LegalEntityRepository legalEntityRepository;
    private final CounterpartyRepository counterpartyRepository;

    public BookOwnershipService(BookOwnershipRepository repository,
                                 BookRepository bookRepository,
                                 LegalEntityRepository legalEntityRepository,
                                 CounterpartyRepository counterpartyRepository) {
        this.repository = repository;
        this.bookRepository = bookRepository;
        this.legalEntityRepository = legalEntityRepository;
        this.counterpartyRepository = counterpartyRepository;
    }

    /** Denormalized view of the ownership rows for a book, plus the advisory total-% indicator. */
    @Transactional(readOnly = true)
    public BookOwnershipListView list(Integer bookId) {
        List<BookOwnershipView> views = repository.findByBookId(bookId).stream()
                .map(this::toView)
                .toList();
        BigDecimal total = views.stream()
                .filter(v -> Boolean.TRUE.equals(v.isActive()))
                .map(BookOwnershipView::ownershipPct)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new BookOwnershipListView(views, total);
    }

    public BookOwnership add(Integer bookId, BookOwnership input) {
        if (!bookRepository.existsById(Objects.requireNonNull(bookId))) {
            throw new NotFoundException("No book with id " + bookId + ".");
        }
        // ownerType itself is guaranteed non-null by AddOwnershipRequest's
        // @NotBlank + @Valid at the controller boundary. ownerRefId is NOT
        // annotated there — conditionally required (must be null for
        // EXTERNAL, required for the other two) — validated here explicitly
        // as IllegalArgumentException (-> clean 400), not
        // Objects.requireNonNull (-> an opaque 500), matching the same fix
        // applied to LegalEntityOwnershipService this session.
        String ownerType = input.getOwnerType();
        switch (ownerType) {
            case "LEGAL_ENTITY" -> {
                if (input.getOwnerRefId() == null) {
                    throw new IllegalArgumentException("ownerRefId is required for owner_type LEGAL_ENTITY.");
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
                && repository.findByBookIdAndIsOperatorTrueAndIsActiveTrue(bookId).isPresent()) {
            throw new ConflictException("Book " + bookId + " already has an active operator — "
                    + "remove or deactivate the existing operator row before assigning a new one.");
        }
        input.setBookOwnershipId(null);
        input.setBookId(bookId);
        if (ownerType.equals("EXTERNAL")) {
            input.setOwnerRefId(null);
        } else {
            input.setExternalOwnerName(null);
        }
        input.setCreatedBy("system");
        return repository.save(input);
        // ux_bo_operator_per_book (DB filtered unique index) is the backstop
        // if a race slips past the pre-check above.
    }

    public void remove(Integer bookId, Integer bookOwnershipId) {
        BookOwnership row = repository.findById(bookOwnershipId)
                .orElseThrow(() -> new NotFoundException("No book_ownership row " + bookOwnershipId + "."));
        if (!row.getBookId().equals(bookId)) {
            throw new NotFoundException("No book_ownership row " + bookOwnershipId + " for book " + bookId + ".");
        }
        repository.delete(row);
    }

    private BookOwnershipView toView(BookOwnership o) {
        String displayName = switch (o.getOwnerType()) {
            case "LEGAL_ENTITY" -> legalEntityRepository.findById(o.getOwnerRefId())
                    .map(LegalEntity::getEntityName)
                    .orElse("(deleted entity #" + o.getOwnerRefId() + ")");
            case "COUNTERPARTY" -> counterpartyRepository.findById(o.getOwnerRefId())
                    .map(Counterparty::getLegalName)
                    .orElse("(deleted counterparty #" + o.getOwnerRefId() + ")");
            default -> o.getExternalOwnerName();
        };
        return new BookOwnershipView(
                o.getBookOwnershipId(),
                o.getBookId(),
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
