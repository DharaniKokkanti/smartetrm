# Backlog

> **Persona for this doc:** You are an ETRM delivery expert triaging backlog for a multi-commodity trading platform build.

Tasks identified but not yet started. Add new cards at the top.

<!-- Format:
### <Short title>
- **Type:** table | column | stored-procedure | api-endpoint | page | validation | architecture | other
- **Playbook:** ../playbooks/<file>.md
- **Status notes:** brief context
- **Opened:** YYYY-MM-DD
-->

### Extend meta_table_registry/meta_field_change_rule beyond master data
- **Type:** table
- **Playbook:** ../playbooks/add-new-table.md
- **Status notes:** V155-V156 scoped the meta-data system to `master_data_table_registry.data_category IN ('MASTER_CONFIG','MASTER_DATA')` only. TRANSACTIONAL and DERIVED tables (trades, positions, nominations, `pipeline_product_approval`, etc.) still need registry/dependency/change-rule coverage before the outbox or streaming pillars can apply to them.
- **Opened:** 2026-07-23

### Refine meta_table_registry.data_domain classification
- **Type:** column
- **Playbook:** ../playbooks/add-new-column.md
- **Status notes:** V155 derived `data_domain` from `module_group` via keyword pattern-matching as a first pass (~230 tables), not an exhaustive hand-reviewed mapping. `module_group` itself mixes broad domain names ("Freight & Shipping") with older bare per-table names ("book", "trader") inconsistently. Worth a deliberate review pass, correctable via `UPDATE dbo.meta_table_registry SET data_domain = ...`.
- **Opened:** 2026-07-23

### Fill in meta_field_change_rule column-level coverage
- **Type:** column
- **Playbook:** ../playbooks/add-new-column.md
- **Status notes:** V156 only seeded structural defaults (is_enabled/is_active always significant; audit/row_version never significant) plus 7 hand-reasoned business columns (uom_conversion.factor, credit_limit's status/limit_amount/used_amount, mot_asset_product_approval.approval_status, field_permission_profile.screen_code). The remaining ~140 in-scope master-data tables have no per-column significance rules yet — fill in as real cascade needs are identified, not guessed wholesale.
- **Opened:** 2026-07-23
