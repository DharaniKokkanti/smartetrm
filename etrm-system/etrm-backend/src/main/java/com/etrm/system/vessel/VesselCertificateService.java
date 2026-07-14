package com.etrm.system.vessel;

import com.etrm.system.common.NotFoundException;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class VesselCertificateService {

    private final VesselCertificateRepository repository;
    private final VesselRepository vesselRepository;
    private final AuditorAware<String> auditorAware;

    public VesselCertificateService(VesselCertificateRepository repository, VesselRepository vesselRepository,
                                     AuditorAware<String> auditorAware) {
        this.repository = repository;
        this.vesselRepository = vesselRepository;
        this.auditorAware = auditorAware;
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
        input.setCreatedAt(LocalDateTime.now());
        input.setCreatedBy(auditorAware.getCurrentAuditor().orElse("SYSTEM"));
        return hydrate(repository.save(input));
    }

    public VesselCertificate update(Integer id, VesselCertificate input) {
        VesselCertificate existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No vessel certificate with id " + id + "."));
        input.setCertId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }
}
