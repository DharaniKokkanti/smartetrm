package com.etrm.system.book;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.desk.DeskRepository;
import com.etrm.system.legalentity.LegalEntityRepository;
import com.etrm.system.trader.TraderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BookService {

    private final BookRepository repository;
    private final LegalEntityRepository legalEntityRepository;
    private final DeskRepository deskRepository;
    private final TraderRepository traderRepository;

    public BookService(BookRepository repository, LegalEntityRepository legalEntityRepository,
                        DeskRepository deskRepository, TraderRepository traderRepository) {
        this.repository = repository;
        this.legalEntityRepository = legalEntityRepository;
        this.deskRepository = deskRepository;
        this.traderRepository = traderRepository;
    }

    private Book denormalize(Book book) {
        legalEntityRepository.findById(book.getLegalEntityId())
                .ifPresent(le -> book.setLegalEntityCode(le.getEntityCode()));
        if (book.getDeskId() != null) {
            deskRepository.findById(book.getDeskId()).ifPresent(d -> book.setDeskCode(d.getDeskCode()));
        }
        traderRepository.findById(book.getResponsibleTraderId())
                .ifPresent(t -> book.setResponsibleTraderName(t.getFullName() != null ? t.getFullName() : t.getTraderCode()));
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

    public Book create(Book input) {
        normalizeCodeField(input);
        if (repository.existsByBookCodeIgnoreCase(input.getBookCode())) {
            throw new ConflictException("Book Code \"" + input.getBookCode() + "\" already exists.");
        }
        input.setBookId(null);
        return denormalize(repository.save(input));
    }

    public Book update(Integer id, Book input) {
        get(id);
        normalizeCodeField(input);
        input.setBookId(id);
        return denormalize(repository.save(input));
    }

    public void deactivate(Integer id) {
        Book existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No book with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
