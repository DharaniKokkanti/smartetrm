package com.etrm.system.reportinggroup;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * dbo.reporting_group is already registered in master_data_table_registry
 * and fully editable via the generic Tier 2 mechanism — read-only here,
 * added so ProductReportingGroupService can resolve reporting_group_id ->
 * name for display.
 */
@Entity
@Table(name = "reporting_group")
public class ReportingGroup {

    @Id
    @Column(name = "reporting_group_id")
    private Integer reportingGroupId;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    // FK -> dbo.lookup_value(lookup_id), category 'REPORTING_CLASSIFICATION_TYPE' (V85).
    @Column(name = "classification_type_id", nullable = false)
    private Integer classificationTypeId;

    public Integer getReportingGroupId() {
        return reportingGroupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Integer getClassificationTypeId() {
        return classificationTypeId;
    }
}
