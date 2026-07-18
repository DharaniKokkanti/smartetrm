package com.etrm.system.book;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.trader.Trader;
import com.etrm.system.trader.TraderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/** Sub-resource of Book — manages dbo.book_trader (V119) rows for a book. */
@Service
@Transactional
public class BookTraderService {

    private final BookTraderRepository repository;
    private final BookRepository bookRepository;
    private final TraderRepository traderRepository;

    public BookTraderService(BookTraderRepository repository, BookRepository bookRepository,
                              TraderRepository traderRepository) {
        this.repository = repository;
        this.bookRepository = bookRepository;
        this.traderRepository = traderRepository;
    }

    /** Denormalized view of the active book_trader rows for a book, for display. */
    @Transactional(readOnly = true)
    public List<BookTraderView> list(Integer bookId) {
        return repository.findByBookIdAndIsActiveTrue(bookId).stream()
                .map(bt -> {
                    Trader t = traderRepository.findById(bt.getTraderId()).orElse(null);
                    String name = t == null ? null : (t.getFullName() != null ? t.getFullName() : t.getTraderCode());
                    return new BookTraderView(bt.getTraderId(), name, bt.getRole(), bt.getIsActive());
                }).toList();
    }

    public BookTrader add(Integer bookId, Integer traderId, String role) {
        if (!bookRepository.existsById(Objects.requireNonNull(bookId))) {
            throw new NotFoundException("No book with id " + bookId + ".");
        }
        traderRepository.findById(Objects.requireNonNull(traderId))
                .orElseThrow(() -> new NotFoundException("No trader with id " + traderId + "."));
        String resolvedRole = (role == null || role.isBlank()) ? "PRIMARY" : role;
        if ("PRIMARY".equals(resolvedRole) && repository.existsByBookIdAndRoleAndIsActiveTrue(bookId, "PRIMARY")) {
            throw new ConflictException("Book " + bookId + " already has an active PRIMARY trader.");
        }
        BookTrader bt = new BookTrader();
        bt.setBookId(bookId);
        bt.setTraderId(traderId);
        bt.setRole(resolvedRole);
        bt.setIsActive(true);
        bt.setCreatedBy("system");
        return repository.save(bt);
    }

    public void remove(Integer bookId, Integer traderId) {
        BookTrader bt = repository.findById(new BookTraderId(bookId, traderId))
                .orElseThrow(() -> new NotFoundException(
                        "No book_trader row for book " + bookId + " / trader " + traderId + "."));
        bt.setIsActive(false);
        repository.save(bt);
    }
}
