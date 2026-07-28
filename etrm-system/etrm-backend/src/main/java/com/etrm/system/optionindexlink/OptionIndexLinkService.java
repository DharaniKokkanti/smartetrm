package com.etrm.system.optionindexlink;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.priceindex.PriceIndexRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class OptionIndexLinkService {

    private final OptionIndexLinkRepository repository;
    private final PriceIndexRepository priceIndexRepository;

    public OptionIndexLinkService(OptionIndexLinkRepository repository, PriceIndexRepository priceIndexRepository) {
        this.repository = repository;
        this.priceIndexRepository = priceIndexRepository;
    }

    private OptionIndexLink hydrate(OptionIndexLink link) {
        priceIndexRepository.findById(link.getOptionPriceIndexId()).ifPresent(idx -> {
            link.setOptionIndexCode(idx.getIndexCode());
            link.setOptionIndexName(idx.getIndexName());
        });
        priceIndexRepository.findById(link.getUnderlyingPriceIndexId()).ifPresent(idx -> {
            link.setUnderlyingIndexCode(idx.getIndexCode());
            link.setUnderlyingIndexName(idx.getIndexName());
        });
        return link;
    }

    @Transactional(readOnly = true)
    public List<OptionIndexLink> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public OptionIndexLink create(OptionIndexLink input) {
        input.setOptionIndexLinkId(null);
        return hydrate(repository.save(input));
    }

    public OptionIndexLink update(Integer id, OptionIndexLink input) {
        OptionIndexLink existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No option index link with id " + id + "."));
        input.setOptionIndexLinkId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        OptionIndexLink existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No option index link with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
