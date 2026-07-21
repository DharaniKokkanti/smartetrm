package com.etrm.system.pipeline;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.currency.CurrencyRepository;
import com.etrm.system.product.ProductRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PipelineTariffService {

    private final PipelineTariffRepository repository;
    private final PipelineRepository pipelineRepository;
    private final PipelinePointRepository pointRepository;
    private final ProductRepository productRepository;
    private final CurrencyRepository currencyRepository;
    private final UnitOfMeasureRepository uomRepository;

    public PipelineTariffService(PipelineTariffRepository repository, PipelineRepository pipelineRepository,
                                  PipelinePointRepository pointRepository, ProductRepository productRepository,
                                  CurrencyRepository currencyRepository, UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.pipelineRepository = pipelineRepository;
        this.pointRepository = pointRepository;
        this.productRepository = productRepository;
        this.currencyRepository = currencyRepository;
        this.uomRepository = uomRepository;
    }

    private PipelinePoint resolvePoint(String pointCode) {
        return pointRepository.findByPointCodeIgnoreCase(pointCode)
                .orElseThrow(() -> new NotFoundException("No pipeline point with code \"" + pointCode + "\"."));
    }

    private void resolveForeignKeys(PipelineTariff input) {
        if (input.getFromPointCode() != null) {
            input.setFromPointId(resolvePoint(input.getFromPointCode()).getPointId());
        }
        if (input.getToPointCode() != null) {
            input.setToPointId(resolvePoint(input.getToPointCode()).getPointId());
        }
    }

    private PipelineTariff hydrate(PipelineTariff tariff) {
        pipelineRepository.findById(tariff.getPipelineId()).ifPresent(p -> tariff.setPipelineName(p.getPipelineName()));
        pointRepository.findById(tariff.getFromPointId()).ifPresent(p -> tariff.setFromPointCode(p.getPointCode()));
        pointRepository.findById(tariff.getToPointId()).ifPresent(p -> tariff.setToPointCode(p.getPointCode()));
        if (tariff.getProductId() != null) {
            productRepository.findById(tariff.getProductId()).ifPresent(p -> tariff.setProductName(p.getProductName()));
        }
        currencyRepository.findById(tariff.getCurrencyId()).ifPresent(c -> tariff.setCurrencyCode(c.getCurrencyCode()));
        uomRepository.findById(tariff.getRateUomId()).ifPresent(u -> tariff.setRateUomCode(u.getUomCode()));
        return tariff;
    }

    @Transactional(readOnly = true)
    public List<PipelineTariff> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public PipelineTariff create(PipelineTariff input) {
        resolveForeignKeys(input);
        input.setTariffId(null);
        return hydrate(repository.save(input));
    }

    public PipelineTariff update(Integer id, PipelineTariff input) {
        PipelineTariff existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No pipeline tariff with id " + id + "."));
        resolveForeignKeys(input);
        input.setTariffId(id);
        // created_at/created_by are @CreatedDate/@CreatedBy (V148) — JPA
        // auditing only populates those on insert, so the request body never
        // carries them; without copying them from the existing row here,
        // updatable=false keeps the DB value untouched but the response
        // would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        PipelineTariff existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No pipeline tariff with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
