package com.etrm.system.gtc;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * See Gtc.java's doc comment for the gtc/gtc_version flattening rationale.
 * create()/update() write both the gtc row and its single "current version"
 * gtc_version row; this app has no version-history workflow yet, so update
 * simply overwrites the existing current version's fields rather than
 * superseding it and inserting a new one.
 */
@Service
@Transactional
public class GtcService {

    private final GtcRepository repository;
    private final GtcVersionRepository versionRepository;

    public GtcService(GtcRepository repository, GtcVersionRepository versionRepository) {
        this.repository = repository;
        this.versionRepository = versionRepository;
    }

    private Gtc hydrate(Gtc gtc) {
        versionRepository.findByGtcIdAndIsCurrentTrue(gtc.getGtcId()).ifPresent(v -> {
            gtc.setVersion(v.getVersionNumber());
            gtc.setEffectiveDate(v.getEffectiveDate());
            gtc.setExpiryDate(v.getSupersededDate());
            gtc.setDocumentRef(v.getDocumentStoreId() == null ? null : String.valueOf(v.getDocumentStoreId()));
        });
        return gtc;
    }

    private Integer parseDocumentStoreId(String documentRef) {
        if (documentRef == null || documentRef.isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(documentRef.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<Gtc> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Gtc create(Gtc input) {
        input.setGtcId(null);
        input.setCreatedAt(LocalDateTime.now());
        Gtc saved = repository.save(input);

        GtcVersion version = new GtcVersion();
        version.setGtcId(saved.getGtcId());
        version.setVersionNumber(input.getVersion() != null ? input.getVersion() : "1");
        version.setEffectiveDate(input.getEffectiveDate());
        version.setSupersededDate(input.getExpiryDate());
        version.setDocumentStoreId(parseDocumentStoreId(input.getDocumentRef()));
        version.setIsCurrent(true);
        version.setCreatedAt(LocalDateTime.now());
        version.setCreatedBy(input.getCreatedBy());
        versionRepository.save(version);

        return hydrate(saved);
    }

    public Gtc update(Integer id, Gtc input) {
        Gtc existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No GTC with id " + id + "."));
        input.setGtcId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        Gtc saved = repository.save(input);

        GtcVersion version = versionRepository.findByGtcIdAndIsCurrentTrue(id).orElseGet(() -> {
            GtcVersion v = new GtcVersion();
            v.setGtcId(id);
            v.setIsCurrent(true);
            v.setCreatedAt(LocalDateTime.now());
            v.setCreatedBy(existing.getCreatedBy());
            return v;
        });
        version.setVersionNumber(input.getVersion() != null ? input.getVersion() : version.getVersionNumber());
        version.setEffectiveDate(input.getEffectiveDate());
        version.setSupersededDate(input.getExpiryDate());
        version.setDocumentStoreId(parseDocumentStoreId(input.getDocumentRef()));
        versionRepository.save(version);

        return hydrate(saved);
    }

    public void deactivate(Integer id) {
        Gtc existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No GTC with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
