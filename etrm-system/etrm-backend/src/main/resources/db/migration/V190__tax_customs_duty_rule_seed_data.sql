-- V190: seed real demonstration data for tax_rule / customs_duty_rule /
-- product_hs_code (V188/V189) -- both rule tables had 0 rows through V189,
-- verified only via ephemeral curl-and-delete round-trips. This gives the
-- Static Data pages real example rows to look at, using real ids already
-- live in ETRM_DB (product 7 = LME Grade A Copper, 4 = Dated Brent Crude,
-- 5 = WTI Crude; country 1 = GB, 2 = US, 3 = NL; tax_code 1 = VAT-GB-STD,
-- 2 = VAT-NL-STD, 3 = ZERO-RATED; incoterm 7 = DDP, 9 = FOB;
-- customs_movement_status 1 = T1, 4 = EU, 5 = NON_T1; legal_entity 1 = MTUK;
-- counterparty 1 = IFM01).

-- =============================================================================
-- 1. product_hs_code -- Copper's two real classifications (the case this
--    table exists to model), plus one for each crude grade.
-- =============================================================================
INSERT INTO dbo.product_hs_code (product_id, hs_code, hs_description, is_default, created_by, updated_by)
SELECT v.product_id, v.hs_code, v.hs_description, v.is_default, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    (7, '7403.11', 'Refined copper cathodes',       1),
    (7, '7408.11', 'Copper wire rod',                0),
    (4, '2709.00', 'Crude petroleum oil (Brent)',    1),
    (5, '2709.00', 'Crude petroleum oil (WTI)',      1)
) AS v(product_id, hs_code, hs_description, is_default)
WHERE NOT EXISTS (SELECT 1 FROM dbo.product_hs_code p WHERE p.product_id = v.product_id AND p.hs_code = v.hs_code);
GO

-- =============================================================================
-- 2. tax_rule
-- =============================================================================
INSERT INTO dbo.tax_rule (rule_name, country_id, legal_entity_id, counterparty_id, direction, customs_movement_status_id, incoterm_id, tax_code_id, cost_applicable_ind, issuing_authority, priority, is_active, notes, created_by, updated_by)
SELECT v.rule_name, v.country_id, v.legal_entity_id, v.counterparty_id, v.direction, v.customs_movement_status_id, v.incoterm_id, v.tax_code_id, v.cost_applicable_ind, v.issuing_authority, v.priority, 1, v.notes, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('UK Standard VAT - GB Domestic',            1,    1, NULL, 'BOTH', 5,    NULL, 1, CAST(1 AS BIT), 'HMRC',             0,  NULL),
    ('NL Standard VAT - NL Domestic',            3,    NULL, NULL, 'BOTH', 5,    NULL, 2, CAST(1 AS BIT), 'Belastingdienst', 0,  NULL),
    ('Intra-EU Reverse Charge - Zero-Rated',      NULL, NULL, NULL, 'BOTH', 4,    NULL, 3, CAST(0 AS BIT), NULL,              10, 'B2B cross-border EU -- VAT liability shifts to the customer, no authority cost booked here.'),
    ('DDP Sale - Seller Pays Import VAT',         1,    1, 1,    'SELL', NULL, 7,    1, CAST(1 AS BIT), 'HMRC',             5,  'DDP -- seller is importer of record, bears the import VAT cost, not the buyer.')
) AS v(rule_name, country_id, legal_entity_id, counterparty_id, direction, customs_movement_status_id, incoterm_id, tax_code_id, cost_applicable_ind, issuing_authority, priority, notes)
WHERE NOT EXISTS (SELECT 1 FROM dbo.tax_rule tr WHERE tr.rule_name = v.rule_name);
GO

-- =============================================================================
-- 3. customs_duty_rule -- the copper cathode-vs-wire-rod case, plus crude
-- =============================================================================
INSERT INTO dbo.customs_duty_rule (rule_name, origin_country_id, destination_country_id, product_id, product_hs_code_id, direction, customs_movement_status_id, incoterm_id, duty_rate_percent, cost_applicable_ind, issuing_authority, priority, is_active, notes, created_by, updated_by)
SELECT v.rule_name, v.origin_country_id, v.destination_country_id, v.product_id,
       (SELECT phc.product_hs_code_id FROM dbo.product_hs_code phc WHERE phc.product_id = v.product_id AND phc.hs_code = v.hs_code),
       v.direction, v.customs_movement_status_id, v.incoterm_id, v.duty_rate_percent, v.cost_applicable_ind, v.issuing_authority, v.priority, 1, v.notes, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('US Import Duty - Crude Oil (Brent)',    1, 2, 4, '2709.00', 'BUY', 1, 9, 3.500, CAST(1 AS BIT), 'US CBP', 0, NULL),
    ('US Import Duty - Copper Cathode',       1, 2, 7, '7403.11', 'BUY', 1, 9, 1.000, CAST(1 AS BIT), 'US CBP', 0, 'Same product as the wire-rod rule below, different HS classification and duty rate -- exactly the case product_hs_code exists to model without duplicating every other rule dimension.'),
    ('US Import Duty - Copper Wire Rod',      1, 2, 7, '7408.11', 'BUY', 1, 9, 2.500, CAST(1 AS BIT), 'US CBP', 0, NULL)
) AS v(rule_name, origin_country_id, destination_country_id, product_id, hs_code, direction, customs_movement_status_id, incoterm_id, duty_rate_percent, cost_applicable_ind, issuing_authority, priority, notes)
WHERE NOT EXISTS (SELECT 1 FROM dbo.customs_duty_rule cdr WHERE cdr.rule_name = v.rule_name);
GO
