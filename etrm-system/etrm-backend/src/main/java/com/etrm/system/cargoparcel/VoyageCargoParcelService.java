package com.etrm.system.cargoparcel;

import com.etrm.system.commodity.CommodityRepository;
import com.etrm.system.commodity.CommodityTypeMapping;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.location.LocationRepository;
import com.etrm.system.product.ProductRepository;
import com.etrm.system.uom.UnitOfMeasureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VoyageCargoParcelService {

    private final VoyageCargoParcelRepository repository;
    private final ProductRepository productRepository;
    private final CommodityRepository commodityRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final LocationRepository locationRepository;

    public VoyageCargoParcelService(VoyageCargoParcelRepository repository, ProductRepository productRepository,
                                     CommodityRepository commodityRepository, UnitOfMeasureRepository uomRepository,
                                     LocationRepository locationRepository) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.commodityRepository = commodityRepository;
        this.uomRepository = uomRepository;
        this.locationRepository = locationRepository;
    }

    private VoyageCargoParcel hydrate(VoyageCargoParcel parcel) {
        uomRepository.findById(parcel.getUomId()).ifPresent(u -> parcel.setUomCode(u.getUomCode()));
        if (parcel.getLoadTerminalLocationId() != null) {
            locationRepository.findById(parcel.getLoadTerminalLocationId()).ifPresent(l -> parcel.setLoadTerminalName(l.getLocationName()));
        }
        if (parcel.getDischargeTerminalLocationId() != null) {
            locationRepository.findById(parcel.getDischargeTerminalLocationId()).ifPresent(l -> parcel.setDischargeTerminalName(l.getLocationName()));
        }
        if (parcel.getProductId() != null) {
            productRepository.findById(parcel.getProductId()).ifPresent(p -> {
                parcel.setProductName(p.getProductName());
                commodityRepository.findById(p.getCommodityId())
                        .ifPresent(c -> parcel.setCommodityType(CommodityTypeMapping.codeToType(c.getCommodityCode())));
            });
        }
        return parcel;
    }

    @Transactional(readOnly = true)
    public List<VoyageCargoParcel> list(Integer voyageId) {
        List<VoyageCargoParcel> parcels = voyageId != null ? repository.findByVoyageId(voyageId) : repository.findAll();
        return parcels.stream().map(this::hydrate).toList();
    }

    public VoyageCargoParcel create(VoyageCargoParcel input) {
        input.setCargoParcelId(null);
        return hydrate(repository.save(input));
    }

    public VoyageCargoParcel update(Integer id, VoyageCargoParcel input) {
        VoyageCargoParcel existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No cargo parcel with id " + id + "."));
        input.setCargoParcelId(id);
        input.setCreatedAt(existing.getCreatedAt());
        input.setCreatedBy(existing.getCreatedBy());
        return hydrate(repository.save(input));
    }

    public void deactivate(Integer id) {
        VoyageCargoParcel existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("No cargo parcel with id " + id + "."));
        existing.setIsActive(false);
        repository.save(existing);
    }
}
