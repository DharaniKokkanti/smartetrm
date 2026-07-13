package com.etrm.system.referencedata;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "master_data_table_registry")
public class MasterDataTableRegistry extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registry_id")
    private Integer registryId;

    @Column(name = "table_name", nullable = false, length = 50)
    private String tableName;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "module_group", nullable = false, length = 50)
    private String moduleGroup;

    @Column(name = "allow_create", nullable = false)
    private Boolean allowCreate = true;

    @Column(name = "allow_edit", nullable = false)
    private Boolean allowEdit = true;

    @Column(name = "allow_delete", nullable = false)
    private Boolean allowDelete = false;

    @Column(name = "allow_excel_upload", nullable = false)
    private Boolean allowExcelUpload = false;

    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;

    // SMALLINT in the DB.
    @Column(name = "display_order", nullable = false)
    private Short displayOrder = 0;

    @Column(name = "sub_group", length = 100)
    private String subGroup;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "notes", length = 500)
    private String notes;

    public Integer getRegistryId() { return registryId; }
    public void setRegistryId(Integer registryId) { this.registryId = registryId; }
    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getModuleGroup() { return moduleGroup; }
    public void setModuleGroup(String moduleGroup) { this.moduleGroup = moduleGroup; }
    public Boolean getAllowCreate() { return allowCreate; }
    public void setAllowCreate(Boolean allowCreate) { this.allowCreate = allowCreate; }
    public Boolean getAllowEdit() { return allowEdit; }
    public void setAllowEdit(Boolean allowEdit) { this.allowEdit = allowEdit; }
    public Boolean getAllowDelete() { return allowDelete; }
    public void setAllowDelete(Boolean allowDelete) { this.allowDelete = allowDelete; }
    public Boolean getAllowExcelUpload() { return allowExcelUpload; }
    public void setAllowExcelUpload(Boolean allowExcelUpload) { this.allowExcelUpload = allowExcelUpload; }
    public Boolean getIsEnabled() { return isEnabled; }
    public void setIsEnabled(Boolean isEnabled) { this.isEnabled = isEnabled; }
    public Short getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Short displayOrder) { this.displayOrder = displayOrder; }
    public String getSubGroup() { return subGroup; }
    public void setSubGroup(String subGroup) { this.subGroup = subGroup; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
