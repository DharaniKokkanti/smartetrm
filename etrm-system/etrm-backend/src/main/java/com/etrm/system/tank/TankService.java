package com.etrm.system.tank;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.product.ProductRepository;
import com.etrm.system.storagefacility.StorageFacilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TankService {

    private final TankRepository repository;
    private final StorageFacilityRepository facilityRepository;
    private final ProductRepository productRepository;

    public TankService(TankRepository repository, StorageFacilityRepository facilityRepository,
                        ProductRepository productRepository) {
        this.repository = repository;
        this.facilityRepository = facilityRepository;
        this.productRepository = productRepository;
    }

    private Tank hydrate(Tank tank) {
        facilityRepository.findById(tank.getFacilityId()).ifPresent(f -> tank.setFacilityName(f.getStorageName()));
        if (tank.getPrimaryProductId() != null) {
            productRepository.findById(tank.getPrimaryProductId()).ifPresent(p -> tank.setPrimaryProductName(p.getProductName()));
        }
        if (tank.getHeelProductId() != null) {
            productRepository.findById(tank.getHeelProductId()).ifPresent(p -> tank.setHeelProductName(p.getProductName()));
        }
        return tank;
    }

    @Transactional(readOnly = true)
    public List<Tank> list() {
        return repository.findAll().stream().map(this::hydrate).toList();
    }

    public Tank create(Tank input) {
        input.setTankId(null);
        return hydrate(repository.save(input));
    }

    public Tank update(Integer id, Tank input) {
        Tank existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No tank with id " + id + "."));
        input.setTankId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        Tank existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No tank with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
