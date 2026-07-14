package com.etrm.system.brokerfeeagreement;

import com.etrm.system.broker.BrokerRepository;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.product.ProductRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class BrokerFeeAgreementService {

    private final BrokerFeeAgreementRepository repository;
    private final BrokerRepository brokerRepository;
    private final ProductRepository productRepository;
    private final CurrencyRepository currencyRepository;
    private final UnitOfMeasureRepository uomRepository;

    public BrokerFeeAgreementService(BrokerFeeAgreementRepository repository, BrokerRepository brokerRepository,
                                      ProductRepository productRepository, CurrencyRepository currencyRepository,
                                      UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.brokerRepository = brokerRepository;
        this.productRepository = productRepository;
        this.currencyRepository = currencyRepository;
        this.uomRepository = uomRepository;
    }

    private BrokerFeeAgreement hydrate(BrokerFeeAgreement agreement) {
        brokerRepository.findById(agreement.getBrokerId()).ifPresent(b -> {
            agreement.setBrokerCode(b.getBrokerCode());
            agreement.setBrokerName(b.getBrokerName());
        });
        if (agreement.getProductId() != null) {
            productRepository.findById(agreement.getProductId()).ifPresent(p -> agreement.setProductName(p.getProductName()));
        }
        currencyRepository.findById(agreement.getFeeCurrencyId()).ifPresent(c -> agreement.setFeeCurrencyCode(c.getCurrencyCode()));
        if (agreement.getUomId() != null) {
            uomRepository.findById(agreement.getUomId()).ifPresent(u -> agreement.setUomCode(u.getUomCode()));
        }
        return agreement;
    }

    @Transactional(readOnly = true)
    public List<BrokerFeeAgreement> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public BrokerFeeAgreement create(BrokerFeeAgreement input) {
        input.setAgreementId(null);
        input.setCreatedAt(LocalDateTime.now());
        return hydrate(repository.save(input));
    }

    public BrokerFeeAgreement update(Integer id, BrokerFeeAgreement input) {
        BrokerFeeAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No broker fee agreement with id " + id + "."));
        input.setAgreementId(id);
        input.setCreatedAt(existing.getCreatedAt());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        BrokerFeeAgreement existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No broker fee agreement with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
