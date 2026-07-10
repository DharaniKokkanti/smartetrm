-- =============================================================================
-- V86 — dbo.country + legal_entity jurisdiction/incorporation_country FK
-- =============================================================================
-- User asked for a review of every currency/country field across master data
-- and user data (example given: Legal Entity's Base Currency / Incorporation
-- Country / Jurisdiction) to confirm real FK linkage, not just a comment.
--
-- Findings for Legal Entity specifically:
--   - base_currency CHAR(3)        -- already a real FK -> dbo.currency(currency_code) (V1). Fine as-is.
--   - jurisdiction CHAR(2)         -- bare, no FK possible: no dbo.country table exists anywhere in SQL.
--   - incorporation_country CHAR(2) -- same gap.
-- The frontend already has a fully-formed "country" concept (Country type,
-- useCountries() hook, CountriesPage.tsx, consumed by Railcars and the Tier 2
-- generic ISO_3166_COLS mechanism) — but per etrm-backend grep, it has never
-- been backed by a real table or JPA entity; /countries is served purely by
-- an MSW mock (`countriesStore` in etrm-frontend/src/mocks/etrmHandlers.ts).
-- This migration gives it a real backing table so jurisdiction/incorporation
-- can get an actual FOREIGN KEY, matching the shape (country_code, country_name,
-- region, phone_code, fatf_status, sanction_status, is_active) the frontend
-- Country type already assumes, and seeded with the exact same 18 rows
-- already used by the frontend mock — reusing already-settled data rather
-- than inventing a fresh ISO list.
--
-- Scope: Legal Entity only (per explicit user decision) — the other ~24
-- ungoverned currency-code columns and ~14 other bare country-code columns
-- found across the schema during this review are NOT touched here.
-- =============================================================================

USE ETRM_DB;
GO

-- 01. COUNTRY
-- ISO 3166-1 alpha-2 reference data (+ region/FATF/sanctions, matching the
-- shape the frontend's Country type already commits to).
-- =============================================================================
CREATE TABLE dbo.country (
    country_id      INT             NOT NULL IDENTITY(1,1),
    country_code    CHAR(2)         NOT NULL,
    country_name    VARCHAR(100)    NOT NULL,
    region          VARCHAR(20)     NOT NULL
        CONSTRAINT chk_country_region CHECK (region IN (
            'EUROPE','AMERICAS','ASIA_PACIFIC','MIDDLE_EAST','AFRICA','CIS'
        )),
    phone_code      VARCHAR(10)     NULL,
    fatf_status     VARCHAR(20)     NOT NULL DEFAULT 'COMPLIANT'
        CONSTRAINT chk_country_fatf CHECK (fatf_status IN (
            'COMPLIANT','GREY_LIST','BLACK_LIST'
        )),
    sanction_status VARCHAR(20)     NOT NULL DEFAULT 'CLEAR'
        CONSTRAINT chk_country_sanction CHECK (sanction_status IN (
            'CLEAR','OFAC','EU_SANCTIONS','UN_SANCTIONS'
        )),
    is_active       BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_country           PRIMARY KEY (country_id),
    CONSTRAINT uq_country_code      UNIQUE      (country_code)
);
GO
CREATE INDEX ix_country_region ON dbo.country (region, is_active);
GO

INSERT INTO dbo.country (country_code, country_name, region, phone_code, fatf_status, sanction_status, is_active)
VALUES
    ('GB', 'United Kingdom',        'EUROPE',       '+44',  'COMPLIANT', 'CLEAR',         1),
    ('US', 'United States',         'AMERICAS',     '+1',   'COMPLIANT', 'CLEAR',         1),
    ('NL', 'Netherlands',           'EUROPE',       '+31',  'COMPLIANT', 'CLEAR',         1),
    ('DE', 'Germany',               'EUROPE',       '+49',  'COMPLIANT', 'CLEAR',         1),
    ('NO', 'Norway',                'EUROPE',       '+47',  'COMPLIANT', 'CLEAR',         1),
    ('SA', 'Saudi Arabia',          'MIDDLE_EAST',  '+966', 'COMPLIANT', 'CLEAR',         1),
    ('AE', 'United Arab Emirates',  'MIDDLE_EAST',  '+971', 'COMPLIANT', 'CLEAR',         1),
    ('SG', 'Singapore',             'ASIA_PACIFIC', '+65',  'COMPLIANT', 'CLEAR',         1),
    ('JP', 'Japan',                 'ASIA_PACIFIC', '+81',  'COMPLIANT', 'CLEAR',         1),
    ('CN', 'China',                 'ASIA_PACIFIC', '+86',  'COMPLIANT', 'CLEAR',         1),
    ('AU', 'Australia',             'ASIA_PACIFIC', '+61',  'COMPLIANT', 'CLEAR',         1),
    ('IN', 'India',                 'ASIA_PACIFIC', '+91',  'COMPLIANT', 'CLEAR',         1),
    ('RU', 'Russia',                'CIS',          '+7',   'GREY_LIST', 'EU_SANCTIONS',  1),
    ('IR', 'Iran',                  'MIDDLE_EAST',  '+98',  'BLACK_LIST','OFAC',          1),
    ('VE', 'Venezuela',             'AMERICAS',     '+58',  'GREY_LIST', 'OFAC',          1),
    ('FR', 'France',                'EUROPE',       '+33',  'COMPLIANT', 'CLEAR',         1),
    ('CA', 'Canada',                'AMERICAS',     '+1',   'COMPLIANT', 'CLEAR',         1),
    ('QA', 'Qatar',                 'MIDDLE_EAST',  '+974', 'COMPLIANT', 'CLEAR',         1);
GO

-- 02. legal_entity.jurisdiction / incorporation_country -> real FK
-- No existing dbo.legal_entity rows are seeded in SQL (data lives only in the
-- frontend mock so far), so this is a direct ADD CONSTRAINT, no staging
-- column/backfill needed.
-- =============================================================================
ALTER TABLE dbo.legal_entity
    ADD CONSTRAINT fk_le_jurisdiction FOREIGN KEY (jurisdiction)
        REFERENCES dbo.country(country_code);
GO
ALTER TABLE dbo.legal_entity
    ADD CONSTRAINT fk_le_incorporation_country FOREIGN KEY (incorporation_country)
        REFERENCES dbo.country(country_code);
GO

PRINT '============================================================';
PRINT 'V86 APPLIED';
PRINT '  dbo.country created + seeded (18 rows).';
PRINT '  dbo.legal_entity.jurisdiction / incorporation_country now';
PRINT '  real FKs -> dbo.country(country_code).';
PRINT '============================================================';
GO
