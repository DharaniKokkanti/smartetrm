package com.etrm.system.product;

import com.etrm.system.common.NotFoundException;
import com.etrm.system.reportinggroup.ReportingGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductReportingGroupService {

    private final ProductReportingGroupRepository repository;
    private final ReportingGroupRepository reportingGroupRepository;

    public ProductReportingGroupService(ProductReportingGroupRepository repository, ReportingGroupRepository reportingGroupRepository) {
        this.repository = repository;
        this.reportingGroupRepository = reportingGroupRepository;
    }

    private ProductReportingGroup hydrate(ProductReportingGroup link) {
        reportingGroupRepository.findById(link.getReportingGroupId()).ifPresent(rg -> link.setGroupName(rg.getGroupName()));
        return link;
    }

    @Transactional(readOnly = true)
    public List<ProductReportingGroup> list(Integer productId) {
        return repository.findByProductId(productId).stream().map(this::hydrate).toList();
    }

    /** classification_type_id is derived from the chosen reporting_group, not sent by the client — see ProductReportingGroup's doc comment. */
    public ProductReportingGroup assign(Integer productId, Integer reportingGroupId) {
        var reportingGroup = reportingGroupRepository.findById(reportingGroupId)
                .orElseThrow(() -> new NotFoundException("No reporting group with id " + reportingGroupId + "."));
        ProductReportingGroup link = new ProductReportingGroup();
        link.setProductId(productId);
        link.setReportingGroupId(reportingGroupId);
        link.setClassificationTypeId(reportingGroup.getClassificationTypeId());
        return hydrate(repository.save(link));
    }

    public void remove(Integer productReportingGroupId) {
        if (!repository.existsById(productReportingGroupId)) {
            throw new NotFoundException("No product reporting group link with id " + productReportingGroupId + ".");
        }
        repository.deleteById(productReportingGroupId);
    }
}
