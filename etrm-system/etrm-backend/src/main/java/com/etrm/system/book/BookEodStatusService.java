package com.etrm.system.book;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class BookEodStatusService {

    private final BookEodStatusRepository repository;
    private final BookRepository bookRepository;

    public BookEodStatusService(BookEodStatusRepository repository, BookRepository bookRepository) {
        this.repository = repository;
        this.bookRepository = bookRepository;
    }

    @Transactional(readOnly = true)
    public List<BookEodStatus> list(Integer bookId) {
        return repository.findByBookIdOrderByBusinessDateDesc(bookId);
    }

    private Book requireLeafBook(Integer bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new NotFoundException("No book with id " + bookId + "."));
        if (!Boolean.TRUE.equals(book.getIsLeafNode())) {
            throw new ConflictException("Book " + bookId + " is not a leaf (TRADING_BOOK) node — only leaf books carry an EOD lock status.");
        }
        return book;
    }

    /** OPEN|REOPENED -> LOCKED for the given business date. Creates the row on first lock of the day. */
    public BookEodStatus lock(Integer bookId, LocalDate businessDate) {
        requireLeafBook(bookId);
        BookEodStatus status = repository.findByBookIdAndBusinessDate(bookId, businessDate)
                .orElseGet(() -> {
                    BookEodStatus s = new BookEodStatus();
                    s.setBookId(bookId);
                    s.setBusinessDate(businessDate);
                    // "system" — no real current-user context wired up yet in this
                    // codebase (see lockedBy below for the same fallback).
                    s.setCreatedBy("system");
                    return s;
                });
        if ("LOCKED".equals(status.getStatus())) {
            throw new ConflictException("Book " + bookId + " is already locked for " + businessDate + ".");
        }
        status.setStatus("LOCKED");
        // "system" — no real current-user context wired up yet in this codebase
        // (BookAccessGrantController.create()/RbacController.assignRole() do the same).
        status.setLockedBy("system");
        status.setLockedAt(LocalDateTime.now());
        return repository.save(status);
    }

    /** LOCKED -> REOPENED for the given business date — requires a reason, same shape as Book.archive(). */
    public BookEodStatus reopen(Integer bookId, LocalDate businessDate, String reason) {
        BookEodStatus status = repository.findByBookIdAndBusinessDate(bookId, businessDate)
                .orElseThrow(() -> new NotFoundException("No EOD status for book " + bookId + " on " + businessDate + "."));
        if (!"LOCKED".equals(status.getStatus())) {
            throw new ConflictException("Book " + bookId + " is not locked for " + businessDate + ".");
        }
        status.setStatus("REOPENED");
        status.setReopenedBy("system");
        status.setReopenedAt(LocalDateTime.now());
        status.setReopenReason(reason);
        return repository.save(status);
    }
}
