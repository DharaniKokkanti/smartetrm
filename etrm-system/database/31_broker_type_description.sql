-- =============================================================================
-- V31 — Broker Table Enhancement + Counterparty Type Cleanup
--
-- Extends dbo.broker (created V29) with contact details and broker_type.
--
--   broker_type — How this IDB executes the match:
--                   VOICE      = Traditional telephone desk (ICAP oil, BGC freight, Tradition LNG)
--                   ELECTRONIC = Pure electronic platform/SEF (Spark Commodities, ICE IM)
--                   HYBRID     = Voice desk + electronic platform (TP ICAP, GFI/Trayport)
--
--   description  — Free-text note: markets covered, regulatory auth, OBA status, fee rates.
--   contact_name, contact_email, contact_phone, website — Operational contact details.
--   country_code — ISO 3166-1 alpha-2 regulatory domicile.
--
-- IMPORTANT: dbo.broker holds IDB (inter-dealer broker) firms ONLY.
--   These are fee-earning OTC matching intermediaries — NOT trading counterparties.
--   FCM (clearing brokers) and Prime Brokers ARE counterparties: manage them in
--   dbo.counterparty with cp_type = 'FCM' or 'PRIME'.
-- =============================================================================

-- ── Add new columns to dbo.broker ────────────────────────────────────────────
ALTER TABLE dbo.broker
    ADD broker_type     VARCHAR(10)     NOT NULL DEFAULT 'VOICE',
        description     NVARCHAR(500)   NULL,
        contact_name    VARCHAR(120)    NULL,
        contact_email   VARCHAR(200)    NULL,
        contact_phone   VARCHAR(50)     NULL,
        website         VARCHAR(255)    NULL,
        country_code    CHAR(2)         NULL;
GO

-- ── CHECK constraint: VOICE | ELECTRONIC | HYBRID only ───────────────────────
ALTER TABLE dbo.broker
    ADD CONSTRAINT chk_broker_type CHECK (broker_type IN ('VOICE', 'ELECTRONIC', 'HYBRID'));
GO

-- ── Back-fill existing V29 seed rows ─────────────────────────────────────────
UPDATE dbo.broker SET
    broker_type  = 'VOICE',
    description  = 'Leading OTC voice IDB for crude oil, products, and natural gas. FCA authorised. North Sea, Mediterranean, and US physical markets. Standard OBA in place.',
    contact_email = 'trading@icap.com',
    website      = 'https://www.icap.com',
    country_code = 'GB'
WHERE broker_code = 'ICAP';

UPDATE dbo.broker SET
    broker_type  = 'HYBRID',
    description  = 'OTC IDB for power, gas, and emissions. European gas and power — TTF, NBP, EEX. Voice desk alongside Trayport-connected electronic platform.',
    contact_email = 'commodities@gfi.com',
    website      = 'https://www.gfigroup.com',
    country_code = 'US'
WHERE broker_code = 'GFI';

UPDATE dbo.broker SET
    broker_type  = 'VOICE',
    description  = 'OTC voice IDB for crude oil, refined products, and freight. Tanker freight and Mediterranean crude. FCA/CFTC dual regulated.',
    contact_email = 'energy@bgcpartners.com',
    website      = 'https://www.bgcpartners.com',
    country_code = 'GB'
WHERE broker_code = 'BGC';

UPDATE dbo.broker SET
    broker_type  = 'VOICE',
    description  = 'Voice IDB for tanker freight, crude oil, and LNG. Primary contact for TD3C, TC2, and Baltic Dirty Tanker routes. BIMCO proforma preferred.',
    contact_email = 'energy@tradition.com',
    website      = 'https://www.tradition.com',
    country_code = 'GB'
WHERE broker_code = 'TRADITION';

UPDATE dbo.broker SET
    broker_type  = 'HYBRID',
    description  = 'Largest OTC IDB globally. All energy commodities. Parameta Solutions electronic platform alongside traditional voice brokerage across oil, gas, power, and freight.',
    contact_email = 'energy@tpicap.com',
    website      = 'https://www.tpicap.com',
    country_code = 'GB'
WHERE broker_code = 'TP-ICAP';

UPDATE dbo.broker SET
    broker_type  = 'VOICE',
    description  = 'Voice IDB for metals and base commodities. LME copper, aluminium, zinc, and nickel. Retained brand within TP ICAP group for metals brokerage.',
    contact_email = 'metals@tullettprebon.com',
    website      = 'https://www.tullettprebon.com',
    country_code = 'GB'
WHERE broker_code = 'TULLETT';
GO

-- ── Insert Spark Commodities as ELECTRONIC (new row not in V29) ──────────────
IF NOT EXISTS (SELECT 1 FROM dbo.broker WHERE broker_code = 'SPARK')
BEGIN
    INSERT INTO dbo.broker (broker_code, broker_name, broker_type, description, contact_email, website, country_code)
    VALUES (
        'SPARK',
        'Spark Commodities',
        'ELECTRONIC',
        'Pure electronic LNG and freight platform. Digital order book for JKM spot, FOB Atlantic, and Pacific freight. Fully algorithmic matching — no voice desk.',
        'trading@sparkcommodities.com',
        'https://www.sparkcommodities.com',
        'SG'
    );
END
GO

-- ── Update dbo.counterparty_type: remove BROKER, add FCM and PRIME ───────────
--
-- IDB brokers (ICAP, BGC, Tradition, TP ICAP, Tullett, GFI, Spark) are never
-- the legal trading counterparty. They live in dbo.broker only.
--
-- FCM and PRIME firms ARE legal counterparties and need a counterparty record
-- for credit lines, KYC, settlement instructions, and legal agreements.
-- They also need a broker record only if they also act as OTC intermediaries
-- (rare — most FCM/PRIME firms do not broker OTC trades).

-- Deactivate the old generic BROKER type (do not delete — preserves FK history)
UPDATE dbo.counterparty_type
SET is_active   = 0,
    type_name   = 'Broker (deprecated)',
    sort_order  = 99
WHERE type_code = 'BROKER';
GO

-- Add FCM counterparty type
IF NOT EXISTS (SELECT 1 FROM dbo.counterparty_type WHERE type_code = 'FCM')
BEGIN
    INSERT INTO dbo.counterparty_type (type_code, type_name, description, sort_order, created_by, updated_by)
    VALUES (
        'FCM',
        'FCM — Clearing Broker',
        'Futures Commission Merchant: the legal counterparty on your exchange-listed trades. Executes and clears futures/options, holds margin accounts on ICE/NYMEX/LME/EEX. Examples: Marex, Macquarie, StoneX, bank clearing desks.',
        5,
        'SYSTEM', 'SYSTEM'
    );
END
GO

-- Add PRIME counterparty type
IF NOT EXISTS (SELECT 1 FROM dbo.counterparty_type WHERE type_code = 'PRIME')
BEGIN
    INSERT INTO dbo.counterparty_type (type_code, type_name, description, sort_order, created_by, updated_by)
    VALUES (
        'PRIME',
        'Prime Broker',
        'Central counterparty across all venues under one ISDA/GMRA umbrella. Credit intermediation, cross-product netting, portfolio margining. Always the legal counterparty on every trade booked through them.',
        6,
        'SYSTEM', 'SYSTEM'
    );
END
GO

-- Shift EXCHANGE, INTERCOMPANY, UTILITY, OTHER to sort after new rows
UPDATE dbo.counterparty_type SET sort_order = sort_order + 2
WHERE  type_code IN ('EXCHANGE', 'INTERCOMPANY', 'UTILITY', 'OTHER');
GO

PRINT 'V31 APPLIED: dbo.broker enhanced with broker_type (VOICE|ELECTRONIC|HYBRID), description, contacts.';
PRINT '  IDB-only: ICAP=VOICE, GFI=HYBRID, BGC=VOICE, TRADITION=VOICE, TP-ICAP=HYBRID, TULLETT=VOICE.';
PRINT '  SPARK COMMODITIES added as ELECTRONIC.';
PRINT '';
PRINT 'V31 ALSO: dbo.counterparty_type updated.';
PRINT '  BROKER deactivated — IDB brokers are not counterparties, managed in dbo.broker.';
PRINT '  FCM added: exchange clearing broker (IS the legal counterparty on exchange trades).';
PRINT '  PRIME added: prime broker (IS the legal counterparty across all venues).';
