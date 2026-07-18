package com.etrm.system.book;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
 *  PATCH  /api/v1/books/{id}/move          { legalEntityId, deskId, parentBookId }
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
 */
@RestController
@RequestMapping("/api/v1/books")
public class BookController {

    private final BookService service;
    private final BookTraderService bookTraderService;
    private final BookClassificationService bookClassificationService;

    public BookController(BookService service, BookTraderService bookTraderService,
                           BookClassificationService bookClassificationService) {
        this.service = service;
        this.bookTraderService = bookTraderService;
        this.bookClassificationService = bookClassificationService;
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
    public Book move(@PathVariable Integer id, @RequestBody MoveRequest body) {
        return service.move(id, body.legalEntityId(), body.deskId(), body.parentBookId());
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
                                                                  @RequestBody AddClassificationRequest body) {
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
    public ResponseEntity<BookTrader> addTrader(@PathVariable Integer bookId, @RequestBody AddTraderRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookTraderService.add(bookId, body.traderId(), body.role()));
    }

    @DeleteMapping("/{bookId}/traders/{traderId}")
    public ResponseEntity<Void> removeTrader(@PathVariable Integer bookId, @PathVariable Integer traderId) {
        bookTraderService.remove(bookId, traderId);
        return ResponseEntity.noContent().build();
    }

    record ArchiveRequest(String reason) {}
    record MoveRequest(Integer legalEntityId, Integer deskId, Integer parentBookId) {}
    record AddTraderRequest(Integer traderId, String role) {}
    record AddClassificationRequest(String dimensionCode, String valueCode, String valueLabel, Boolean isPrimary) {}
}
