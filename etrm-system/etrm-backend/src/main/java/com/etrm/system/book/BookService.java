package com.etrm.system.book;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.desk.DeskRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class BookService {

    private static final int MAX_PARENT_DEPTH = 5;

    private final BookRepository repository;
    private final LegalEntityRepository legalEntityRepository;
    private final DeskRepository deskRepository;
    private final BookTraderService bookTraderService;

    public BookService(BookRepository repository, LegalEntityRepository legalEntityRepository,
                        DeskRepository deskRepository, BookTraderService bookTraderService) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
        this.deskRepository = deskRepository;
        this.bookTraderService = bookTraderService;
    }

    private Book denormalize(Book book) {
        legalEntityRepository.findById(book.getLegalEntityId())
                .ifPresent(le -> book.setLegalEntityCode(le.getEntityCode()));
        if (book.getDeskId() != null) {
            deskRepository.findById(book.getDeskId()).ifPresent(d -> book.setDeskCode(d.getDeskCode()));
        }
        if (book.getParentBookId() != null && !book.getParentBookId().equals(book.getBookId())) {
            repository.findById(book.getParentBookId()).ifPresent(p -> book.setParentBookCode(p.getBookCode()));
        }
        if (book.getBookId() != null) {
            book.setTraders(bookTraderService.list(book.getBookId()));
        }
        return book;
    }

    @Transactional(readOnly = true)
    public List<Book> list() {
        return repository.findAll().stream().map(this::denormalize).toList();
    }

    @Transactional(readOnly = true)
    public Book get(Integer id) {
        return denormalize(repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No book with id " + id + ".")));
    }

    private void normalizeCodeField(Book input) {
        if (input.getBookCode() != null) input.setBookCode(input.getBookCode().toUpperCase());
    }

    /**
     * Walks the parent chain starting at parentBookId, throwing ConflictException
     * if bookId (the book being saved; null on create, since it has no id yet)
     * appears anywhere in the chain, or if the chain exceeds MAX_PARENT_DEPTH.
     * Throws NotFoundException if any link in the chain doesn't resolve to a
     * real book.
     */
    private void validateParentChain(Integer bookId, Integer parentBookId) {
        if (parentBookId == null) return;
        Integer current = parentBookId;
        int depth = 0;
        while (current != null) {
            depth++;
            if (depth > MAX_PARENT_DEPTH) {
                throw new ConflictException("Book parent chain exceeds maximum depth of " + MAX_PARENT_DEPTH + ".");
            }
            if (bookId != null && current.equals(bookId)) {
                throw new ConflictException("Book " + bookId + " cannot be its own ancestor.");
            }
            final Integer currentId = current;
            Book parent = repository.findById(currentId)
                    .orElseThrow(() -> new NotFoundException("No book with id " + currentId + "."));
            current = parent.getParentBookId();
        }
    }

    public Book create(Book input) {
        normalizeCodeField(input);
        if (repository.existsByBookCodeIgnoreCase(input.getBookCode())) {
            throw new ConflictException("Book Code \"" + input.getBookCode() + "\" already exists.");
        }
        validateParentChain(null, input.getParentBookId());
        input.setBookId(null);
        return denormalize(repository.save(input));
    }

    public Book update(Integer id, Book input) {
        Book existing = get(id);
        normalizeCodeField(input);
        validateParentChain(id, input.getParentBookId());
        input.setBookId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy — only populated by
        // JPA auditing on insert, so the request body never carries them and
        // they'd otherwise come back null in the response (DB value is safe,
        // updatable = false, but the client would see provenance vanish).
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return denormalize(repository.save(input));
    }

    /** Superseded by archive() below for anything the UI should call going forward — kept as-is, still used elsewhere. */
    public void deactivate(Integer id) {
        Book existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No book with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }

    /** Richer version of deactivate() — records when and why a book left service. */
    public Book archive(Integer id, String reason) {
        Book existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No book with id " + id + "."));
        existing.setIsActive(false);
        existing.setArchivedAt(LocalDate.now());
        existing.setArchivedReason(reason);
        return denormalize(repository.save(existing));
    }

    /** Partial update — moves a book to a different entity/desk/parent without touching any other field. */
    public Book move(Integer id, Integer legalEntityId, Integer deskId, Integer parentBookId) {
        Book existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No book with id " + id + "."));
        legalEntityRepository.findById(Objects.requireNonNull(legalEntityId))
                .orElseThrow(() -> new NotFoundException("No legal entity with id " + legalEntityId + "."));
        if (deskId != null) {
            deskRepository.findById(deskId)
                    .orElseThrow(() -> new NotFoundException("No desk with id " + deskId + "."));
        }
        if (parentBookId != null) {
            validateParentChain(id, parentBookId);
        }
        existing.setLegalEntityId(legalEntityId);
        existing.setDeskId(deskId);
        existing.setParentBookId(parentBookId);
        return denormalize(repository.save(existing));
    }
}
