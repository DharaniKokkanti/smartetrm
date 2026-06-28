package com.etrm.system.referencedata;

import com.etrm.system.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "master_data_table_registry")
public class MasterDataTableRegistry extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registry_id")
    private Long registryId;

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

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "sub_group", length = 100)
    private String subGroup;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "notes", length = 500)
    private String notes;
}
