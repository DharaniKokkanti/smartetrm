package com.etrm.system.vessel;

import com.etrm.system.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VesselCertificateService {

    private final VesselCertificateRepository repository;
    private final VesselRepository vesselRepository;

    public VesselCertificateService(VesselCertificateRepository repository, VesselRepository vesselRepository) {
        this.repository = repository;
        this.vesselRepository = vesselRepository;
    }

    private VesselCertificate hydrate(VesselCertificate cert) {
        vesselRepository.findById(cert.getVesselId()).ifPresent(v -> cert.setVesselName(v.getVesselName()));
        return cert;
    }

    @Transactional(readOnly = true)
    public List<VesselCertificate> list(Integer vesselId) {
        List<VesselCertificate> certs = vesselId != null ? repository.findByVesselId(vesselId) : repository.findAll();
        return certs.stream().map(this::hydrate).toList();
    }

    public VesselCertificate create(VesselCertificate input) {
        input.setCertId(null);
        return hydrate(repository.save(input));
    }

    public VesselCertificate update(Integer id, VesselCertificate input) {
        VesselCertificate existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No vessel certificate with id " + id + "."));
        input.setCertId(id);
        // V151 — created_at/created_by are @CreatedDate/@CreatedBy — JPA
        // auditing only populates those on insert, so the request body never
        // carries them; without copying them from the existing row here,
        // updatable=false keeps the DB value untouched but the response
        // would show them as null.
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }
}
