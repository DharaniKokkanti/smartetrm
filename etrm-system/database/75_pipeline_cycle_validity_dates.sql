-- =============================================================================
-- V75 — pipeline_cycle: add effective_from/effective_to validity dates
-- =============================================================================
-- pipeline_cycle already has nomination_deadline/confirmation_deadline/
-- scheduling_deadline/effective_start/effective_end as TIME columns — the
-- delivery window's clock time within a day, not a calendar validity period
-- for the cycle RULE itself. pipeline_tariff already versions its rate rows
-- with effective_from/effective_to (DATE); pipeline_cycle had no equivalent,
-- so a cycle definition change (e.g. a tariff-filed deadline shift, such as
-- FERC Order 809/587-W in 2020) could only overwrite the row in place, losing
-- history. Adds the same DATE pair here for consistency, and so a deal
-- referencing a cycle can derive its delivery window from the cycle's
-- validity period rather than the cycle's daily TIME-of-day fields alone.
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.pipeline_cycle ADD effective_from DATE NULL;   -- NULL = always in force
ALTER TABLE dbo.pipeline_cycle ADD effective_to   DATE NULL;   -- NULL = no expiry
GO

PRINT '============================================================';
PRINT 'V75 — PIPELINE_CYCLE VALIDITY DATES ADDED';
PRINT '  pipeline_cycle.effective_from / effective_to (DATE) — NEW, nullable.';
PRINT '  Versions the cycle RULE itself, same convention as pipeline_tariff.';
PRINT '  Distinct from the existing effective_start/effective_end (TIME),';
PRINT '  which remain the daily delivery-window clock times.';
PRINT '============================================================';
GO
