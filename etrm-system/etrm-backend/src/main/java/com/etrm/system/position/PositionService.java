package com.etrm.system.position;

import com.etrm.system.book.BookRepository;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.period.PeriodRepository;
import com.etrm.system.product.ProductRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * dbo.position is populated by a batch calc job, not user-entered — this
 * service is read-only (list only), matching the frontend's api.ts which
 * exposes only a `list` method. Filtering is done in-memory via
 * findAll().stream() since this is low-traffic reference data with no
 * existing derived-query infrastructure to build on here.
 */
@Service
@Transactional(readOnly = true)
public class PositionService {

    private final PositionRepository repository;
    private final BookRepository bookRepository;
    private final ProductRepository productRepository;
    private final PeriodRepository periodRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final CurrencyRepository currencyRepository;

    public PositionService(
            PositionRepository repository,
            BookRepository bookRepository,
            ProductRepository productRepository,
            PeriodRepository periodRepository,
            UnitOfMeasureRepository uomRepository,
            CurrencyRepository currencyRepository
    ) {
        this.repository = repository;
        this.bookRepository = bookRepository;
        this.productRepository = productRepository;
        this.periodRepository = periodRepository;
        this.uomRepository = uomRepository;
        this.currencyRepository = currencyRepository;
    }

    private Position hydrate(Position position) {
        bookRepository.findById(position.getBookId()).ifPresent(b -> {
            position.setBookCode(b.getBookCode());
            position.setBookName(b.getBookName());
        });
        if (position.getProductId() != null) {
            productRepository.findById(position.getProductId()).ifPresent(p -> {
                position.setProductCode(p.getProductCode());
                position.setProductName(p.getProductName());
            });
        }
        if (position.getPeriodId() != null) {
            periodRepository.findById(position.getPeriodId()).ifPresent(p -> position.setPeriodCode(p.getPeriodCode()));
        }
        uomRepository.findById(position.getQuantityUomId()).ifPresent(u -> position.setQuantityUomCode(u.getUomCode()));
        currencyRepository.findById(position.getCurrencyId()).ifPresent(c -> position.setCurrencyCode(c.getCurrencyCode()));
        return position;
    }

    public List<Position> list(String commodityType, Integer bookId, String periodCode) {
        return repository.findAll().stream()
                .map(this::hydrate)
                .filter(p -> commodityType == null || commodityType.equalsIgnoreCase(p.getCommodityType()))
                .filter(p -> bookId == null || bookId.equals(p.getBookId()))
                .filter(p -> periodCode == null || periodCode.equalsIgnoreCase(p.getPeriodCode()))
                .toList();
    }
}
