-- =============================================================================
-- V118 — desk office locations, reusing dbo.location
--
-- Trading book redesign (part 1/3). dbo.location (V1) is currently only
-- used for logistics delivery points (ports, hubs, storage, title-transfer
-- points), classified via location_type_id. It is not usable for office/
-- desk locations, and neither dbo.desk nor dbo.legal_entity references it.
--
-- Rather than a new table, two flags scope the existing table to office use
-- without touching its existing logistics rows or FKs:
--   office_loc_ind    — this row is a business office, not a delivery point
--   trading_desk_ind  — narrower subset of offices that actually host a
--                       trading desk (some offices are back-office only)
-- Both default 0, so nothing already in dbo.location is affected.
--
-- Naming note: this schema's dominant boolean convention is `is_active BIT`
-- (427 occurrences); `_ind` appears exactly once elsewhere
-- (legal_entity.parent_ind, V62). Using `_ind` here matches an explicit
-- request, not an oversight.
-- =============================================================================

ALTER TABLE dbo.location ADD
    office_loc_ind    BIT NOT NULL CONSTRAINT df_loc_office_ind DEFAULT 0,
    trading_desk_ind  BIT NOT NULL CONSTRAINT df_loc_desk_ind DEFAULT 0;
GO

ALTER TABLE dbo.desk ADD location_id INT NULL;
GO
ALTER TABLE dbo.desk
    ADD CONSTRAINT fk_desk_location FOREIGN KEY (location_id) REFERENCES dbo.location(location_id);
GO

CREATE INDEX ix_location_office ON dbo.location (trading_desk_ind, is_active) INCLUDE (location_code, location_name);
GO
