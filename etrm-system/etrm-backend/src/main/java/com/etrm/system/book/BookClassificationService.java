package com.etrm.system.book;

import com.etrm.system.common.ConflictException;
import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/** Sub-resource of Book — manages dbo.book_classification (V122) rows for a book. */
@Service
@Transactional
public class BookClassificationService {

    private final BookClassificationRepository repository;
    private final BookClassificationDimensionRepository dimensionRepository;
    private final BookRepository bookRepository;

    public BookClassificationService(BookClassificationRepository repository,
                                      BookClassificationDimensionRepository dimensionRepository,
                                      BookRepository bookRepository) {
        this.repository = repository;
        this.dimensionRepository = dimensionRepository;
        this.bookRepository = bookRepository;
    }

    @Transactional(readOnly = true)
    public List<BookClassificationDimension> listDimensions() {
        return dimensionRepository.findByIsActiveTrueOrderBySortOrder();
    }

    /** Denormalized view of the book_classification rows for a book, for display. */
    @Transactional(readOnly = true)
    public List<BookClassificationView> list(Integer bookId) {
        return repository.findByBookId(bookId).stream()
                .map(bc -> {
                    BookClassificationDimension d = dimensionRepository.findById(bc.getDimensionId()).orElse(null);
                    return new BookClassificationView(
                            bc.getBookClassificationId(),
                            d == null ? null : d.getDimensionCode(),
                            d == null ? null : d.getDimensionName(),
                            bc.getValueCode(),
                            bc.getValueLabel(),
                            bc.getIsPrimary());
                }).toList();
    }

    public BookClassification add(Integer bookId, String dimensionCode, String valueCode, String valueLabel, Boolean isPrimary) {
        if (!bookRepository.existsById(Objects.requireNonNull(bookId))) {
            throw new NotFoundException("No book with id " + bookId + ".");
        }
        BookClassificationDimension dimension = dimensionRepository.findByDimensionCodeIgnoreCase(
                        Objects.requireNonNull(dimensionCode))
                .orElseThrow(() -> new NotFoundException("No classification dimension \"" + dimensionCode + "\"."));
        if (repository.existsByBookIdAndDimensionIdAndValueCodeIgnoreCase(bookId, dimension.getDimensionId(), valueCode)) {
            throw new ConflictException("Book " + bookId + " is already classified as " + valueCode
                    + " on dimension " + dimensionCode + ".");
        }
        boolean primary = isPrimary == null || isPrimary;
        if (primary && repository.findByBookIdAndDimensionIdAndIsPrimaryTrue(bookId, dimension.getDimensionId()).isPresent()) {
            if (!dimension.getIsMultiValued()) {
                throw new ConflictException("Book " + bookId + " already has a primary value on single-valued dimension "
                        + dimensionCode + ".");
            }
            primary = false;
        }
        BookClassification bc = new BookClassification();
        bc.setBookId(bookId);
        bc.setDimensionId(dimension.getDimensionId());
        bc.setValueCode(valueCode);
        bc.setValueLabel(valueLabel);
        bc.setIsPrimary(primary);
        return repository.save(bc);
    }

    public void remove(Integer bookId, Integer bookClassificationId) {
        BookClassification bc = repository.findById(bookClassificationId)
                .orElseThrow(() -> new NotFoundException("No book_classification row " + bookClassificationId + "."));
        if (!bc.getBookId().equals(bookId)) {
            throw new NotFoundException("No book_classification row " + bookClassificationId + " for book " + bookId + ".");
        }
        repository.delete(bc);
    }
}
