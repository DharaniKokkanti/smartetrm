package com.etrm.system.cargoparcel;

import com.etrm.system.commodity.CommodityRepository;
import com.etrm.system.commodity.CommodityTypeMapping;
import com.etrm.system.common.NotFoundException;
import com.etrm.system.location.LocationRepository;
import com.etrm.system.lookup.CommodityTypeRepository;
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
    private final CommodityTypeRepository commodityTypeRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final LocationRepository locationRepository;

    public VoyageCargoParcelService(VoyageCargoParcelRepository repository, ProductRepository productRepository,
                                     CommodityRepository commodityRepository, CommodityTypeRepository commodityTypeRepository,
                                     UnitOfMeasureRepository uomRepository, LocationRepository locationRepository) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.commodityRepository = commodityRepository;
        this.commodityTypeRepository = commodityTypeRepository;
        this.uomRepository = uomRepository;
        this.locationRepository = locationRepository;
    }

    // commodity_type_id is a real, client-settable FK (a cargo parcel's actual commodity
    // classification can be more specific than its product allows -- dbo.commodity only has
    // 5 broad values with no LNG row, so a genuinely LNG cargo parcel needs to be settable
    // explicitly). Only auto-derived as a default when the client leaves it unset.
    private VoyageCargoParcel hydrate(VoyageCargoParcel parcel) {
        uomRepository.findById(parcel.getUomId()).ifPresent(u -> parcel.setUomCode(u.getUomCode()));
        if (parcel.getLoadTerminalLocationId() != null) {
            locationRepository.findById(parcel.getLoadTerminalLocationId()).ifPresent(l -> parcel.setLoadTerminalName(l.getLocationName()));
        }
        if (parcel.getDischargeTerminalLocationId() != null) {
            locationRepository.findById(parcel.getDischargeTerminalLocationId()).ifPresent(l -> parcel.setDischargeTerminalName(l.getLocationName()));
        }
        if (parcel.getProductId() != null) {
            productRepository.findById(parcel.getProductId()).ifPresent(p -> parcel.setProductName(p.getProductName()));
        }
        if (parcel.getCommodityTypeId() == null && parcel.getProductId() != null) {
            productRepository.findById(parcel.getProductId())
                    .flatMap(p -> commodityRepository.findById(p.getCommodityId()))
                    .map(c -> CommodityTypeMapping.codeToType(c.getCommodityCode()))
                    .flatMap(commodityTypeRepository::findByTypeCodeIgnoreCase)
                    .ifPresent(ct -> parcel.setCommodityTypeId(ct.getCommodityTypeId()));
        }
        if (parcel.getCommodityTypeId() != null) {
            commodityTypeRepository.findById(parcel.getCommodityTypeId()).ifPresent(ct -> parcel.setCommodityTypeCode(ct.getTypeCode()));
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
