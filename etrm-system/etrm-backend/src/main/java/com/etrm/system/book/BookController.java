package com.etrm.system.book;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Path/verb shape must stay in sync with etrm-frontend/src/features/organization/books/api.ts.
 *
 *  GET    /api/v1/books
 *  GET    /api/v1/books/{id}
 *  POST   /api/v1/books
 *  PUT    /api/v1/books/{id}
 *  PATCH  /api/v1/books/{id}/deactivate
 *  PATCH  /api/v1/books/{id}/archive       { reason }
 *  PATCH  /api/v1/books/{id}/move          { legalEntityId, parentBookId }
 *  GET    /api/v1/books/{id}/descendants   book itself + every descendant (recursive CTE)
 *
 *  GET    /api/v1/books/{bookId}/traders
 *  POST   /api/v1/books/{bookId}/traders            { traderId, role }
 *  DELETE /api/v1/books/{bookId}/traders/{traderId}
 *
 *  GET    /api/v1/books/{bookId}/classifications
 *  POST   /api/v1/books/{bookId}/classifications                  { dimensionCode, valueCode, valueLabel, isPrimary }
 *  DELETE /api/v1/books/{bookId}/classifications/{bookClassificationId}
 *  GET    /api/v1/book-classification-dimensions
 *
 *  GET    /api/v1/books/{bookId}/eod-status               history, newest business date first
 *  POST   /api/v1/books/{bookId}/eod-status/lock           { businessDate }
 *  POST   /api/v1/books/{bookId}/eod-status/reopen         { businessDate, reason }
 *
 *  GET    /api/v1/books/{bookId}/ownership
 *  POST   /api/v1/books/{bookId}/ownership
 *  DELETE /api/v1/books/{bookId}/ownership/{bookOwnershipId}
 */
@RestController
@RequestMapping("/api/v1/books")
public class BookController {

    private final BookService service;
    private final BookTraderService bookTraderService;
    private final BookClassificationService bookClassificationService;
    private final BookEodStatusService bookEodStatusService;
    private final BookOwnershipService bookOwnershipService;

    public BookController(BookService service, BookTraderService bookTraderService,
                           BookClassificationService bookClassificationService,
                           BookEodStatusService bookEodStatusService,
                           BookOwnershipService bookOwnershipService) {
        this.service = service;
        this.bookTraderService = bookTraderService;
        this.bookClassificationService = bookClassificationService;
        this.bookEodStatusService = bookEodStatusService;
        this.bookOwnershipService = bookOwnershipService;
    }

    @GetMapping
    public List<Book> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public Book get(@PathVariable Integer id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<Book> create(@Valid @RequestBody Book input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }

    @PutMapping("/{id}")
    public Book update(@PathVariable Integer id, @Valid @RequestBody Book input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/archive")
    public Book archive(@PathVariable Integer id, @RequestBody ArchiveRequest body) {
        return service.archive(id, body.reason());
    }

    @PatchMapping("/{id}/move")
    public Book move(@PathVariable Integer id, @Valid @RequestBody MoveRequest body) {
        return service.move(id, body.legalEntityId(), body.parentBookId());
    }

    @GetMapping("/{id}/descendants")
    public List<Book> descendants(@PathVariable Integer id) {
        return service.descendants(id);
    }

    // ── book_classification sub-resource ─────────────────────────────────────

    @GetMapping("/{bookId}/classifications")
    public List<BookClassificationView> listClassifications(@PathVariable Integer bookId) {
        return bookClassificationService.list(bookId);
    }

    @PostMapping("/{bookId}/classifications")
    public ResponseEntity<BookClassification> addClassification(@PathVariable Integer bookId,
                                                                  @Valid @RequestBody AddClassificationRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookClassificationService.add(
                bookId, body.dimensionCode(), body.valueCode(), body.valueLabel(), body.isPrimary()));
    }

    @DeleteMapping("/{bookId}/classifications/{bookClassificationId}")
    public ResponseEntity<Void> removeClassification(@PathVariable Integer bookId,
                                                       @PathVariable Integer bookClassificationId) {
        bookClassificationService.remove(bookId, bookClassificationId);
        return ResponseEntity.noContent().build();
    }

    // ── book_trader sub-resource ─────────────────────────────────────────────

    @GetMapping("/{bookId}/traders")
    public List<BookTraderView> listTraders(@PathVariable Integer bookId) {
        return bookTraderService.list(bookId);
    }

    @PostMapping("/{bookId}/traders")
    public ResponseEntity<BookTrader> addTrader(@PathVariable Integer bookId, @Valid @RequestBody AddTraderRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookTraderService.add(bookId, body.traderId(), body.role()));
    }

    @DeleteMapping("/{bookId}/traders/{traderId}")
    public ResponseEntity<Void> removeTrader(@PathVariable Integer bookId, @PathVariable Integer traderId) {
        bookTraderService.remove(bookId, traderId);
        return ResponseEntity.noContent().build();
    }

    // ── book_eod_status sub-resource ─────────────────────────────────────────

    @GetMapping("/{bookId}/eod-status")
    public List<BookEodStatus> listEodStatus(@PathVariable Integer bookId) {
        return bookEodStatusService.list(bookId);
    }

    @PostMapping("/{bookId}/eod-status/lock")
    public BookEodStatus lockEodStatus(@PathVariable Integer bookId, @Valid @RequestBody LockRequest body) {
        return bookEodStatusService.lock(bookId, body.businessDate());
    }

    @PostMapping("/{bookId}/eod-status/reopen")
    public BookEodStatus reopenEodStatus(@PathVariable Integer bookId, @Valid @RequestBody ReopenRequest body) {
        return bookEodStatusService.reopen(bookId, body.businessDate(), body.reason());
    }

    // ── book_ownership sub-resource (V126) ────────────────────────────────────
    // Independent of the book's parent legal_entity's own entity_type — any
    // book can carry a split, not just ones under a Joint Venture entity.

    @GetMapping("/{bookId}/ownership")
    public BookOwnershipListView listOwnership(@PathVariable Integer bookId) {
        return bookOwnershipService.list(bookId);
    }

    @PostMapping("/{bookId}/ownership")
    public ResponseEntity<BookOwnership> addOwnership(@PathVariable Integer bookId,
                                                        @Valid @RequestBody AddOwnershipRequest body) {
        BookOwnership input = new BookOwnership();
        input.setOwnerType(body.ownerType());
        input.setOwnerRefId(body.ownerRefId());
        input.setExternalOwnerName(body.externalOwnerName());
        input.setOwnershipPct(body.ownershipPct());
        input.setIsOperator(body.isOperator() != null && body.isOperator());
        input.setConsolidationMethod(body.consolidationMethod());
        input.setEffectiveFrom(body.effectiveFrom());
        input.setNotes(body.notes());
        return ResponseEntity.status(HttpStatus.CREATED).body(bookOwnershipService.add(bookId, input));
    }

    @DeleteMapping("/{bookId}/ownership/{bookOwnershipId}")
    public ResponseEntity<Void> removeOwnership(@PathVariable Integer bookId,
                                                 @PathVariable Integer bookOwnershipId) {
        bookOwnershipService.remove(bookId, bookOwnershipId);
        return ResponseEntity.noContent().build();
    }

    // reason left unannotated: book.archived_reason is a genuinely nullable
    // DB column (V119) — archiving without a stated reason is valid.
    record ArchiveRequest(String reason) {}
    record MoveRequest(@NotNull Integer legalEntityId, Integer parentBookId) {}
    record AddTraderRequest(@NotNull Integer traderId, @NotBlank String role) {}
    record AddClassificationRequest(@NotBlank String dimensionCode, @NotBlank String valueCode, String valueLabel, Boolean isPrimary) {}
    record LockRequest(@NotNull LocalDate businessDate) {}
    // reason IS required to reopen — an EOD lock reversal needs an audit
    // trail of why, unlike archiving (see ArchiveRequest above).
    record ReopenRequest(@NotNull LocalDate businessDate, @NotBlank String reason) {}

    // Deliberately separate from the BookOwnership entity itself (bookId is
    // a path variable, not a request-body field) — same reasoning as
    // LegalEntityController's own AddOwnershipRequest (V125): binding @Valid
    // straight to the entity would validate its @NotNull bookId against the
    // not-yet-populated field before the controller ever sets it from the path.
    record AddOwnershipRequest(
            @NotBlank String ownerType,
            Integer ownerRefId,
            String externalOwnerName,
            @NotNull @DecimalMin("0.001") @DecimalMax("100") BigDecimal ownershipPct,
            Boolean isOperator,
            @NotBlank String consolidationMethod,
            @NotNull LocalDate effectiveFrom,
            String notes) {
    }
}
