import { useState, useMemo } from 'react';
import { Input, Card, Row, Col, Tag, Typography, Divider, Tooltip } from 'antd';
import {
  SearchOutlined, ApartmentOutlined, TeamOutlined, ShopOutlined,
  GlobalOutlined, CalendarOutlined, DollarOutlined, DatabaseOutlined,
  FileTextOutlined, SafetyCertificateOutlined, BankOutlined,
  ThunderboltOutlined, CarOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@components/layout/PageHeader';

const { Text, Title } = Typography;

interface Entry {
  db: string;           // actual dbo.{table_name} in SQL Server
  label: string;
  description: string;
  path: string;
  group: string;
  tags: string[];
  live: boolean;
  kind?: 'reference' | 'entity';
}

const GROUPS = [
  { key: 'Organization & Users', label: 'Organization & Users', icon: <ApartmentOutlined />, color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'Counterparties & Agreements', label: 'Counterparties & Agreements', icon: <TeamOutlined />, color: '#0891b2', bg: '#ecfeff' },
  { key: 'Credit & Collateral', label: 'Credit & Collateral', icon: <SafetyCertificateOutlined />, color: '#c2410c', bg: '#fff7ed' },
  { key: 'Products & Markets', label: 'Products & Markets', icon: <ShopOutlined />, color: '#0369a1', bg: '#eff6ff' },
  { key: 'Contract & Legal', label: 'Contract & Legal', icon: <FileTextOutlined />, color: '#b45309', bg: '#fffbeb' },
  { key: 'Logistics & Delivery', label: 'Logistics & Delivery', icon: <GlobalOutlined />, color: '#15803d', bg: '#f0fdf4' },
  { key: 'Freight & Shipping', label: 'Freight & Shipping', icon: <CarOutlined />, color: '#0f766e', bg: '#f0fdfa' },
  { key: 'Power & Energy', label: 'Power & Energy', icon: <ThunderboltOutlined />, color: '#6d28d9', bg: '#faf5ff' },
  { key: 'Calendar & Periods', label: 'Calendar & Periods', icon: <CalendarOutlined />, color: '#1d4ed8', bg: '#eff6ff' },
  { key: 'Pricing & Rates', label: 'Pricing & Rates', icon: <DollarOutlined />, color: '#b91c1c', bg: '#fff1f2' },
  { key: 'Finance & Settlement', label: 'Finance & Settlement', icon: <BankOutlined />, color: '#065f46', bg: '#ecfdf5' },
  { key: 'Risk & Compliance', label: 'Risk & Compliance', icon: <SafetyCertificateOutlined />, color: '#92400e', bg: '#fef3c7' },
  { key: 'Reference & Config', label: 'Reference & Config', icon: <DatabaseOutlined />, color: '#374151', bg: '#f9fafb' },
] as const;

type GroupKey = (typeof GROUPS)[number]['key'];

// ─── ALL ENTRIES — mapped 1:1 to dbo.{db} in SQL Server schema ──────────────
const ALL_ENTRIES: Entry[] = [
  // ── Organization & Users ──────────────────────────────────────
  { live: true,  db: 'legal_entity',   group: 'Organization & Users', label: 'Legal Entities',   path: '/tier1/legal-entity', description: 'Registered companies used as booking or trading entities. Required FK for trade capture.', tags: ['entity', 'company', 'corporate', 'lei'], kind: 'entity' },
  { live: true,  db: 'app_user',       group: 'Organization & Users', label: 'System Users',     path: '/admin/users',        description: 'Login accounts with assigned roles — ADMIN, TRADER, RISK_MANAGER, OPERATIONS, COMPLIANCE, VIEWER.', tags: ['user', 'role', 'access', 'admin', 'permission'], kind: 'entity' },
  { live: false, db: 'user_role',      group: 'Organization & Users', label: 'User Roles',       path: '/admin/roles',        description: 'Role definitions and module-level permission sets. Controls which screens and actions each role can access.', tags: ['role', 'permission', 'rbac', 'access control'] },
  { live: true,  db: 'desk',           group: 'Organization & Users', label: 'Trading Desks',    path: '/org/desks',          description: 'Commodity desk hierarchy — crude, gas, power, metals. Defines commodity type assignments and desk heads.', tags: ['desk', 'trading', 'commodity', 'team'], kind: 'entity' },
  { live: true,  db: 'book',           group: 'Organization & Users', label: 'Trading Books',    path: '/org/books',          description: 'P&L books with position limits, VAR limits, and desk assignment. Each trade is booked to a book.', tags: ['book', 'pnl', 'var', 'position', 'limit'], kind: 'entity' },
  { live: true,  db: 'trader',         group: 'Organization & Users', label: 'Traders',          path: '/org/traders',        description: 'Individual traders — single-trade limits, daily limits, commodity mandates, and approval chains.', tags: ['trader', 'limit', 'mandate', 'approval'], kind: 'entity' },
  { live: false, db: 'contact',        group: 'Organization & Users', label: 'Contacts',         path: '/org/contacts',       description: 'Named contacts at counterparties and legal entities — ops, credit, trading, compliance contacts.', tags: ['contact', 'person', 'ops', 'credit', 'trading'], kind: 'entity' },

  // ── Counterparties & Agreements ───────────────────────────────
  // DB: counterparty.cp_type = PRODUCER|CONSUMER|TRADER|BANK|BROKER|EXCHANGE|INTERCOMPANY|UTILITY|OTHER
  // Brokers are NOT a separate table — they are counterparties with cp_type = 'BROKER'
  { live: true,  db: 'counterparty',         group: 'Counterparties & Agreements', label: 'Counterparties',          path: '/tier1/counterparty',      description: 'All trading party types in one table — Producers, Consumers, Traders, Banks, Brokers, Utilities, Intercompany. Filtered by cp_type.', tags: ['counterparty', 'broker', 'bank', 'producer', 'consumer', 'utility', 'intercompany', 'kyc', 'lei'], kind: 'entity' },
  { live: false, db: 'credit_rating',        group: 'Counterparties & Agreements', label: 'Credit Ratings',          path: '/counterparties/credit-ratings',  description: 'External credit ratings per counterparty — S&P, Moody\'s, Fitch. Drives credit limit and collateral rules.', tags: ['credit', 'rating', 'sp', 'moodys', 'fitch'] },
  { live: false, db: 'credit_term',          group: 'Counterparties & Agreements', label: 'Credit Terms',            path: '/counterparties/credit-terms',    description: 'Credit facility terms per counterparty — credit period days, required collateral type, threshold amounts.', tags: ['credit', 'term', 'facility', 'collateral', 'threshold'] },
  { live: false, db: 'netting_agreement',    group: 'Counterparties & Agreements', label: 'Netting Agreements',      path: '/counterparties/netting',         description: 'ISDA/EFET master netting agreements. Determines whether offsetting trades with a counterparty can be netted for settlement.', tags: ['netting', 'isda', 'efet', 'master agreement', 'set-off'], kind: 'entity' },
  { live: false, db: 'cp_commercial_terms',  group: 'Counterparties & Agreements', label: 'CP Commercial Terms',     path: '/counterparties/commercial-terms', description: 'Default payment terms, settlement days, and currency preferences per counterparty–legal entity pair.', tags: ['commercial', 'terms', 'default', 'settlement', 'payment'], kind: 'entity' },
  { live: false, db: 'cp_gtc_agreement',     group: 'Counterparties & Agreements', label: 'CP GTC Agreements',       path: '/counterparties/gtc-agreements',  description: 'Which version of which GTC is agreed per counterparty and legal entity — the contractual foundation for each relationship.', tags: ['gtc', 'agreement', 'contract', 'efet', 'isda', 'gafta'], kind: 'entity' },

  // ── Credit & Collateral ───────────────────────────────────────
  { live: false, db: 'bank_guarantee',        group: 'Credit & Collateral', label: 'Bank Guarantees',         path: '/credit/bank-guarantees',   description: 'Performance and payment bank guarantees issued or received — guarantor bank, amount, expiry, commodity context.', tags: ['bank guarantee', 'bg', 'performance', 'payment', 'guarantor'], kind: 'entity' },
  { live: false, db: 'letter_of_credit',      group: 'Credit & Collateral', label: 'Letters of Credit',       path: '/credit/letters-of-credit', description: 'Irrevocable/revolving/standby LCs — issuing bank, beneficiary, LC amount, tolling date, and amendment tracking.', tags: ['lc', 'letter of credit', 'standby', 'revolving', 'issuing bank'], kind: 'entity' },
  { live: false, db: 'parent_company_guarantee', group: 'Credit & Collateral', label: 'Parent Company Guarantees', path: '/credit/pcg',            description: 'PCGs from parent companies guaranteeing counterparty obligations — essential for intercompany and subsidiary trading.', tags: ['pcg', 'parent', 'guarantee', 'subsidiary', 'intercompany'], kind: 'entity' },
  { live: false, db: 'collateral',            group: 'Credit & Collateral', label: 'Collateral',              path: '/credit/collateral',        description: 'Cash and non-cash collateral posted or received — linked to margin accounts, direction, and value dates.', tags: ['collateral', 'margin', 'cash', 'securities', 'initial margin', 'variation margin'], kind: 'entity' },
  { live: false, db: 'margin_account',        group: 'Credit & Collateral', label: 'Margin Accounts',         path: '/credit/margin-accounts',   description: 'Exchange margin accounts for cleared trades — initial and variation margin tracking per exchange.', tags: ['margin', 'initial margin', 'variation', 'exchange', 'cleared', 'ccp'], kind: 'entity' },
  { live: false, db: 'insurance_policy',      group: 'Credit & Collateral', label: 'Insurance Policies',      path: '/credit/insurance',         description: 'Cargo, credit, and political risk insurance policies — insurer, coverage period, insured values per commodity.', tags: ['insurance', 'cargo', 'credit risk', 'political risk', 'marine', 'policy'], kind: 'entity' },
  { live: false, db: 'insurance_provider',    group: 'Credit & Collateral', label: 'Insurance Providers',     path: '/credit/insurance-providers', description: 'Insurance companies — Lloyd\'s syndicates, AIG, Zurich, Euler Hermes — with contact and credit rating.', tags: ['insurer', 'lloyds', 'aig', 'zurich', 'euler hermes', 'provider'], kind: 'entity' },
  { live: false, db: 'tax_registration',      group: 'Credit & Collateral', label: 'Tax Registrations',       path: '/credit/tax',               description: 'VAT, GST, and sales tax registration numbers per legal entity and counterparty per jurisdiction.', tags: ['tax', 'vat', 'gst', 'registration', 'jurisdiction', 'tin'], kind: 'entity' },

  // ── Products & Markets ────────────────────────────────────────
  { live: true,  db: 'product',               group: 'Products & Markets', label: 'Products',             path: '/markets/products',       description: 'Tradeable commodity products — Brent, TTF, LME Copper, JKM LNG — with lot sizes, settlement type, and pricing basis.', tags: ['product', 'brent', 'wti', 'ttf', 'jkm', 'copper', 'lng', 'lot size'] },
  { live: false, db: 'commodity',             group: 'Products & Markets', label: 'Commodities',          path: '/markets/commodities',    description: 'Base commodity types — OIL, GAS, POWER, LNG, METALS, AGRI, FREIGHT. The top-level classification above product.', tags: ['commodity', 'oil', 'gas', 'power', 'metals', 'agri', 'freight'] },
  { live: false, db: 'product_spec_template', group: 'Products & Markets', label: 'Product Spec Templates', path: '/markets/spec-templates', description: 'Quality and grade specification parameters — API gravity, sulphur %, gas calorific value, metal purity, grain moisture.', tags: ['spec', 'grade', 'quality', 'api', 'sulphur', 'purity', 'specification'] },
  { live: true,  db: 'market',                group: 'Products & Markets', label: 'Markets',              path: '/markets/markets',        description: 'Trading venues — ICE Brent, NYMEX WTI, LME Copper, OTC bilateral, OTC cleared — linked to products and periods.', tags: ['market', 'otc', 'exchange', 'cleared', 'bilateral', 'venue'] },
  { live: true,  db: 'price_index',           group: 'Products & Markets', label: 'Price Indices',        path: '/markets/price-indices',  description: 'Benchmark price indices — Dated Brent, JKM, TTF, LME Official Settlement — from Platts, Argus, ICE.', tags: ['index', 'platts', 'argus', 'dated brent', 'ttf', 'jkm', 'lme official'] },
  { live: true,  db: 'exchange',              group: 'Products & Markets', label: 'Exchanges',            path: '/markets/exchanges',      description: 'Licensed exchanges — ICE, NYMEX, LME, EEX, TOCOM — with MIC codes, regulators, and clearing houses.', tags: ['exchange', 'ice', 'nymex', 'lme', 'eex', 'tocom', 'cme', 'mic'] },

  // ── Contract & Legal ──────────────────────────────────────────
  { live: true,  db: 'gtc',                     group: 'Contract & Legal', label: 'General T&Cs',          path: '/contracts/gtcs',            description: 'Master contract templates — EFET 2019, BP Oil T&Cs, GAFTA 100, ISDA 2002 MA, NAESB Gas. Versioned per commodity.', tags: ['gtc', 'efet', 'isda', 'gafta', 'naesb', 'bp', 'master agreement', 'terms'] },
  { live: true,  db: 'incoterm',                group: 'Contract & Legal', label: 'Incoterms',             path: '/reference/incoterms',       description: 'ICC Incoterms 2020 — FOB, CIF, DDP, DAP, CIF. Defines risk transfer point and transport obligation.', tags: ['incoterm', 'fob', 'cif', 'dap', 'ddp', 'risk transfer', 'icc'] },
  { live: true,  db: 'payment_term',            group: 'Contract & Legal', label: 'Payment Terms',         path: '/contracts/payment-terms',   description: 'Invoice payment schedules — NET30, NET45, LME prompt date, 2/10-NET30 early discount, prepayment.', tags: ['payment', 'net30', 'net45', 'lme prompt', 'invoice', 'prepayment'] },
  { live: true,  db: 'payment_method',          group: 'Contract & Legal', label: 'Payment Methods',       path: '/contracts/payment-methods', description: 'Settlement mechanisms — SWIFT wire, SEPA credit transfer, netting, letter of credit, bank guarantee.', tags: ['swift', 'sepa', 'wire', 'netting', 'lc', 'bank guarantee', 'bic'] },
  { live: false, db: 'laytime_term_template',   group: 'Contract & Legal', label: 'Laytime Term Templates', path: '/contracts/laytime',        description: 'Standard laytime clauses — SHINC, SHEX EIU, WIBON — used in vessel charter parties and lifting agreements.', tags: ['laytime', 'shinc', 'shex', 'wibon', 'demurrage', 'vessel', 'charter'] },
  { live: false, db: 'transport_document_type', group: 'Contract & Legal', label: 'Transport Doc Types',   path: '/contracts/doc-types',       description: 'Document types required per mode of transport — Bill of Lading, CMR, CIM, Tank Car Certificate, Pipeline Batch Ticket.', tags: ['bill of lading', 'bol', 'cmr', 'cim', 'document', 'transport', 'certificate'] },

  // ── Logistics & Delivery ──────────────────────────────────────
  { live: true,  db: 'location',         group: 'Logistics & Delivery', label: 'Locations',           path: '/logistics/locations',      description: 'Ports, gas hubs, grid nodes, LNG terminals, refinery gates, pipeline IPs. Used as delivery/loading points on trades.', tags: ['location', 'port', 'hub', 'terminal', 'cushing', 'ttf', 'nbp', 'rotterdam', 'sullom voe'], kind: 'entity' },
  { live: false, db: 'location_type',    group: 'Logistics & Delivery', label: 'Location Types',      path: '/logistics/location-types', description: 'Location classification — PORT, GAS_HUB, LNG_TERMINAL, PIPELINE_HUB, GRID_NODE, STORAGE, REFINERY.', tags: ['location type', 'port', 'hub', 'terminal', 'grid', 'classification'] },
  { live: true,  db: 'vessel',           group: 'Logistics & Delivery', label: 'Vessels',             path: '/logistics/vessels',        description: 'Tankers with IMO number, vessel class, SIRE inspection expiry, CDI vetting, DWT, and cargo restrictions.', tags: ['vessel', 'ship', 'tanker', 'vlcc', 'aframax', 'suezmax', 'imo', 'sire', 'cdi', 'vetting', 'dwt'], kind: 'entity' },
  { live: false, db: 'vessel_certificate', group: 'Logistics & Delivery', label: 'Vessel Certificates', path: '/logistics/vessel-certs',   description: 'SOLAS, MARPOL, ISM, ISSC, class society certificates with expiry dates tracked per vessel.', tags: ['certificate', 'solas', 'marpol', 'ism', 'issc', 'class society', 'lloyds', 'dnv', 'bureau veritas'], kind: 'entity' },
  { live: false, db: 'inspection_type',  group: 'Logistics & Delivery', label: 'Inspection Types',    path: '/logistics/inspection-types', description: 'Cargo inspection types — SGS quantity, Q88 quality, tank calibration, independent inspector. Used on trade confirmations.', tags: ['inspection', 'sgs', 'bureau', 'cotecna', 'quantity', 'quality', 'independent'] },
  { live: true,  db: 'pipeline',         group: 'Logistics & Delivery', label: 'Pipelines',           path: '/logistics/pipelines',      description: 'Oil and gas pipeline systems — TSO, regulatory body, capacity, tariff, and product approvals.', tags: ['pipeline', 'tso', 'crude', 'gas', 'druzhba', 'keystone', 'ferc', 'ofgem', 'capacity'], kind: 'entity' },
  { live: false, db: 'pipeline_segment', group: 'Logistics & Delivery', label: 'Pipeline Segments',   path: '/logistics/pipeline-segments', description: 'Individual pipeline segments with injection/offtake points, flow direction, and nomination cycles.', tags: ['segment', 'injection', 'offtake', 'nomination', 'cycle', 'capacity'], kind: 'entity' },
  { live: false, db: 'pipeline_tariff',  group: 'Logistics & Delivery', label: 'Pipeline Tariffs',    path: '/logistics/pipeline-tariffs', description: 'Access tariffs by pipeline and product — throughput fees, booking fees, and quality adjustment charges.', tags: ['tariff', 'throughput', 'fee', 'booking', 'quality adjustment'] },
  { live: true,  db: 'truck',            group: 'Logistics & Delivery', label: 'Trucks & Road',       path: '/logistics/trucks',         description: 'Road tankers and bulk vehicles — ADR hazmat certificate, GVW, inspection expiry, operator, license plate.', tags: ['truck', 'tanker', 'road', 'adr', 'gvw', 'license', 'isotank', 'bulk'], kind: 'entity' },
  { live: true,  db: 'storage_facility', group: 'Logistics & Delivery', label: 'Storage Facilities',  path: '/logistics/storage',        description: 'Tank farms, gas caverns, LNG tanks, LME warehouses — injection/withdrawal rates, regulatory ref, operator.', tags: ['storage', 'tank', 'cavern', 'lme', 'warehouse', 'lng', 'gas', 'injection', 'withdrawal'], kind: 'entity' },
  { live: false, db: 'tank',             group: 'Logistics & Delivery', label: 'Tanks',               path: '/logistics/tanks',          description: 'Individual storage tanks within a facility — calibration tables, capacity, product grade, current status.', tags: ['tank', 'capacity', 'calibration', 'ullage', 'product', 'grade'], kind: 'entity' },
  { live: false, db: 'container',        group: 'Logistics & Delivery', label: 'Containers',          path: '/logistics/containers',     description: 'ISO containers and flexibags for bulk liquids and packaged goods — container number, type, owner, depot.', tags: ['container', 'iso', 'flexibag', '20ft', '40ft', 'depot', 'box'], kind: 'entity' },
  { live: false, db: 'railcar',          group: 'Logistics & Delivery', label: 'Rail Cars',           path: '/logistics/railcars',       description: 'Tank cars and bulk railcars — AAR designation, capacity, lessee, inspection date, commodity approval.', tags: ['railcar', 'tank car', 'aar', 'rail', 'bulk', 'lessee'], kind: 'entity' },
  { live: false, db: 'mot_type',         group: 'Logistics & Delivery', label: 'Mode of Transport',   path: '/logistics/mot-types',      description: 'Transport medium types — SEA, PIPELINE, ROAD, RAIL, BARGE, AIR. Controls which logistics fields appear on a trade.', tags: ['mot', 'mode', 'sea', 'pipeline', 'road', 'rail', 'barge'] },
  { live: false, db: 'transport_operator', group: 'Logistics & Delivery', label: 'Transport Operators', path: '/logistics/operators',    description: 'Haulage companies, rail operators, barge operators — contact, coverage area, commodity approvals.', tags: ['operator', 'haulage', 'rail', 'barge', 'carrier'], kind: 'entity' },

  // ── Freight & Shipping ────────────────────────────────────────
  { live: false, db: 'charter_party_type',     group: 'Freight & Shipping', label: 'Charter Party Types',    path: '/freight/charter-party-types',    description: 'Voyage, time charter, and bareboat charter types — rate basis (WS flat, LSUM, PDAY), typical clauses.', tags: ['charter', 'voyage', 'time charter', 'bareboat', 'worldscale', 'lsum'] },
  { live: false, db: 'freight_rate_index',     group: 'Freight & Shipping', label: 'Freight Rate Indices',   path: '/freight/rate-indices',           description: 'Freight benchmarks — BDTI, BCTI, BDI, Worldscale flat rate per route. Published by Baltic Exchange.', tags: ['bdti', 'bcti', 'bdi', 'worldscale', 'baltic exchange', 'freight rate', 'flat rate'] },
  { live: false, db: 'demurrage_dispatch_rate', group: 'Freight & Shipping', label: 'Demurrage & Dispatch',  path: '/freight/demurrage-rates',        description: 'Demurrage and dispatch rate schedules per port and vessel class — used in laytime calculations.', tags: ['demurrage', 'dispatch', 'laytime', 'port', 'vessel class', 'rate'] },
  { live: false, db: 'transport_route',        group: 'Freight & Shipping', label: 'Transport Routes',       path: '/freight/routes',                 description: 'Standard freight routes — Ras Tanura to Rotterdam, WAF to USG — with benchmark voyage days and typical freight.', tags: ['route', 'voyage', 'ras tanura', 'rotterdam', 'waf', 'usg', 'freight', 'days'] },

  // ── Power & Energy ────────────────────────────────────────────
  { live: false, db: 'generation_asset',     group: 'Power & Energy', label: 'Generation Assets',     path: '/power/generation-assets',    description: 'Power plants — gas peakers, wind farms, nuclear — with installed capacity, location, and balancing authority.', tags: ['generation', 'power plant', 'gas peaker', 'wind', 'nuclear', 'solar', 'capacity', 'mw'], kind: 'entity' },
  { live: false, db: 'load_shape_template',  group: 'Power & Energy', label: 'Load Shape Templates',  path: '/power/load-shapes',          description: 'Baseload, peak, off-peak, and custom hourly load profiles used in power trade capture.', tags: ['load shape', 'baseload', 'peak', 'off-peak', 'hourly', 'profile', 'mw'] },
  { live: false, db: 'balancing_authority',  group: 'Power & Energy', label: 'Balancing Authorities', path: '/power/balancing-authorities', description: 'Grid operators responsible for real-time balancing — ERCOT, PJM, MISO, National Grid ESO, RTE.', tags: ['balancing', 'ercot', 'pjm', 'miso', 'national grid', 'rte', 'eno', 'grid operator'] },
  { live: false, db: 'transmission_zone',   group: 'Power & Energy', label: 'Transmission Zones',    path: '/power/transmission-zones',   description: 'Price zones and load zones within a balancing authority — ERCOT HUB_NORTH, PJM PJMW, GB NATIONAL.', tags: ['zone', 'hub', 'load zone', 'price zone', 'ercot', 'pjm', 'national grid'] },
  { live: false, db: 'interconnector',      group: 'Power & Energy', label: 'Interconnectors',       path: '/power/interconnectors',      description: 'Cross-border and inter-zone power interconnectors — BritNed, IFA, Moyle — with capacity and regulatory auction rules.', tags: ['interconnector', 'britned', 'ifa', 'moyle', 'cross-border', 'capacity', 'auction'], kind: 'entity' },
  { live: false, db: 'transmission_right_type', group: 'Power & Energy', label: 'Transmission Right Types', path: '/power/transmission-rights', description: 'FTR, PTR, ATR — financial and physical transmission rights traded on interconnectors.', tags: ['ftr', 'ptr', 'atr', 'transmission right', 'interconnector', 'congestion', 'auction'] },

  // ── Calendar & Periods ────────────────────────────────────────
  { live: true,  db: 'holiday_calendar',  group: 'Calendar & Periods', label: 'Holiday Calendars',   path: '/calendar/holiday-calendars', description: 'Banking and exchange holiday calendars — London, New York, LME, ECB TARGET2, Tokyo — for pricing and settlement.', tags: ['calendar', 'holiday', 'london', 'nyc', 'lme', 'ecb', 'target2', 'tokyo'] },
  { live: true,  db: 'period',            group: 'Calendar & Periods', label: 'Trading Periods',     path: '/calendar/periods',           description: 'Monthly, quarterly, and annual delivery and pricing periods — Mar-25, Q2-25, CAL-25, Prompt, Spot.', tags: ['period', 'monthly', 'quarterly', 'annual', 'prompt', 'spot', 'front month', 'cal25'] },
  { live: false, db: 'settlement_calendar', group: 'Calendar & Periods', label: 'Settlement Calendars', path: '/calendar/settlement',      description: 'Settlement date calendars per commodity and currency pair — T+2, T+5, LME prompt date rules.', tags: ['settlement', 'calendar', 'value date', 'lme', 't+2', 'prompt', 'cash'] },

  // ── Pricing & Rates ───────────────────────────────────────────
  { live: true,  db: 'price_source',       group: 'Pricing & Rates', label: 'Price Sources',        path: '/pricing/price-sources',   description: 'Data vendor connections — Platts eWindow, Argus Direct, Bloomberg API, ICE Data Services, LME live feed.', tags: ['price source', 'platts', 'argus', 'bloomberg', 'ice', 'lme', 'vendor', 'api', 'feed'] },
  { live: true,  db: 'pricing_rule',       group: 'Pricing & Rates', label: 'Pricing Rules',        path: '/pricing/pricing-rules',   description: 'Fixed, floating, differential, and Asian average pricing formulas referenced in trade capture.', tags: ['pricing', 'fixed', 'floating', 'differential', 'asian', 'average', 'formula', 'swap'] },
  { live: false, db: 'pricing_type',       group: 'Pricing & Rates', label: 'Pricing Types',        path: '/pricing/pricing-types',   description: 'Pricing mechanism classifications — FIXED, FLOATING, FORMULA, DIFFERENTIAL, AVERAGE. Used in product configuration.', tags: ['pricing type', 'fixed', 'floating', 'formula', 'differential', 'average'] },
  { live: false, db: 'formula_template',   group: 'Pricing & Rates', label: 'Formula Templates',    path: '/pricing/formulas',        description: 'Reusable price formula templates — Dated Brent ± differential, JCC ×0.1485, average of front-month TTF.', tags: ['formula', 'template', 'dated brent', 'jcc', 'ttf', 'differential', 'asian'] },
  { live: false, db: 'interest_rate_index', group: 'Pricing & Rates', label: 'Interest Rate Indices', path: '/pricing/interest-rates',  description: 'SOFR, EURIBOR, SONIA — used for financing costs, late payment interest, and commodity-linked structures.', tags: ['interest rate', 'sofr', 'euribor', 'sonia', 'libor', 'rfr', 'financing'] },
  { live: false, db: 'fx_rate',            group: 'Pricing & Rates', label: 'FX Rates',             path: '/pricing/fx-rates',        description: 'Historical and live FX rates per currency pair. Used for P&L revaluation and cross-currency settlement.', tags: ['fx', 'exchange rate', 'usd', 'eur', 'gbp', 'jpy', 'currency pair', 'revaluation'] },

  // ── Finance & Settlement ──────────────────────────────────────
  { live: true,  db: 'currency',      group: 'Finance & Settlement', label: 'Currencies',       path: '/reference/currencies',    description: 'ISO 4217 currency codes with decimal places and base currency flag. USD is the system base currency.', tags: ['currency', 'usd', 'eur', 'gbp', 'jpy', 'iso4217', 'fx', 'base currency'] },
  { live: false, db: 'bank_account',  group: 'Finance & Settlement', label: 'Bank Accounts',    path: '/finance/bank-accounts',   description: 'Settlement bank accounts for legal entities and counterparties — IBAN, BIC/SWIFT, currency, account type (SETTLEMENT/MARGIN).', tags: ['bank', 'account', 'iban', 'bic', 'swift', 'nostro', 'vostro', 'settlement', 'margin'], kind: 'entity' },

  // ── Risk & Compliance ─────────────────────────────────────────
  { live: false, db: 'regulatory_obligation',  group: 'Risk & Compliance', label: 'Regulatory Obligations',  path: '/compliance/obligations',   description: 'REMIT, EMIR, CFTC, MiFID II reporting obligations — which trades require reporting, to which regime, by when.', tags: ['remit', 'emir', 'cftc', 'mifid', 'regulatory', 'reporting', 'obligation'] },
  { live: false, db: 'regulatory_report_type', group: 'Risk & Compliance', label: 'Report Types',            path: '/compliance/report-types',  description: 'Regulatory report type definitions — REMIT Table 1, EMIR REFIT, CFTC Part 43/45 — with field mapping rules.', tags: ['report type', 'remit', 'emir refit', 'cftc', 'part 43', 'part 45', 'field mapping'] },
  { live: false, db: 'trade_repository',       group: 'Risk & Compliance', label: 'Trade Repositories',      path: '/compliance/trade-repos',   description: 'DTCC, REGIS-TR, ICE TVEL — registered trade repositories by regime with connection credentials and status.', tags: ['trade repository', 'dtcc', 'regis-tr', 'ice tvel', 'regulatory', 'reporting'], kind: 'entity' },

  // ── Reference & Config ────────────────────────────────────────
  { live: true,  db: 'unit_of_measure', group: 'Reference & Config', label: 'Units of Measure',  path: '/reference/uom',         description: 'BBL, MT, MWH, MMBTU, THERM, BUSHEL, M3 — volume, weight, energy, and power units with conversion factors.', tags: ['uom', 'unit', 'bbl', 'mt', 'mwh', 'mmbtu', 'therm', 'bushel', 'conversion'] },
  { live: false, db: 'uom_conversion', group: 'Reference & Config', label: 'UoM Conversions',    path: '/reference/uom-conversions', description: 'Conversion factors between units — BBL to MT per crude grade, MMBTU to MWH, MT to m3 for LNG.', tags: ['conversion', 'bbl', 'mt', 'mmbtu', 'mwh', 'm3', 'lng', 'factor'] },
  { live: true,  db: '— (iso 3166)',   group: 'Reference & Config', label: 'Countries',          path: '/reference/countries',   description: 'ISO 3166 country codes with FATF status and sanctions lists — OFAC SDN, EU Consolidated, UN — for KYC screening.', tags: ['country', 'fatf', 'sanctions', 'ofac', 'eu', 'un', 'kyc', 'iso3166', 'jurisdiction'] },
  { live: true,  db: 'custom_config',  group: 'Reference & Config', label: 'Custom Config',      path: '/tier2/custom_config',    description: 'User-maintainable picklist values for counterparty types, KYC statuses, contact roles, and other configurable domain lists.', tags: ['custom config', 'picklist', 'dropdown', 'type', 'config'] },
  { live: false, db: 'lookup_value',   group: 'Reference & Config', label: 'Lookup Values',      path: '/reference/lookups',     description: 'Configurable dropdown lists not large enough for their own tables — port agent types, inspection statuses, etc.', tags: ['lookup', 'dropdown', 'picklist', 'enum', 'config', 'value list'] },
  { live: false, db: 'external_system', group: 'Reference & Config', label: 'External Systems',  path: '/reference/external-systems', description: 'ERP, ETRM, risk, and accounting system connections — SAP, OpenLink, Aspect, Murex — with integration type and status.', tags: ['external', 'integration', 'sap', 'openlink', 'aspect', 'murex', 'erp', 'api'] },
  { live: false, db: 'system_config',  group: 'Reference & Config', label: 'System Config',      path: '/admin/system-config',   description: 'Application-wide configuration — default currency, fiscal year start, position netting rules, rounding conventions.', tags: ['config', 'system', 'default', 'fiscal year', 'netting', 'rounding', 'convention'] },
];

const LIVE_COUNT  = ALL_ENTRIES.filter((e) => e.live).length;
const TOTAL_COUNT = ALL_ENTRIES.length;

const GROUP_MAP = Object.fromEntries(GROUPS.map((g) => [g.key, g])) as Record<GroupKey, typeof GROUPS[number]>;

export function MasterDataHub() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_ENTRIES;
    const q = search.toLowerCase();
    return ALL_ENTRIES.filter((e) =>
      e.label.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.group.toLowerCase().includes(q) ||
      e.db.toLowerCase().includes(q) ||
      e.tags.some((t) => t.includes(q)),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    GROUPS.forEach((g) => map.set(g.key, []));
    filtered.forEach((e) => map.get(e.group)?.push(e));
    return map;
  }, [filtered]);

  const visibleGroups = [...grouped.entries()].filter(([, v]) => v.length > 0);

  return (
    <>
      <PageHeader
        title="Master Data"
        description="Every reference and configuration table in the system — one searchable hub. Click any live card to open."
        moduleGroup="reference"
        extra={
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tag color="green"  style={{ fontWeight: 600, fontSize: 12, margin: 0 }}>{LIVE_COUNT} live</Tag>
            <Tag color="orange" style={{ fontWeight: 600, fontSize: 12, margin: 0 }}>{TOTAL_COUNT - LIVE_COUNT} coming soon</Tag>
            <Tag color="default" style={{ fontSize: 12, margin: 0 }}>{TOTAL_COUNT} tables total</Tag>
          </span>
        }
      />

      {/* Search */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#aaa' }} />}
          placeholder="Search by name, table, keyword — e.g. 'bank guarantee', 'worldscale', 'netting', 'imo', 'remit'..."
          size="large"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 640 }}
        />
        {search.trim() && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} in {visibleGroups.length} group{visibleGroups.length !== 1 ? 's' : ''}
          </Text>
        )}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <WarningOutlined style={{ fontSize: 32, color: '#d1d5db', display: 'block', marginBottom: 10 }} />
          <Text type="secondary">No tables match "{search}"</Text>
        </div>
      )}

      {/* Groups */}
      {GROUPS.map((g) => {
        const entries = grouped.get(g.key) ?? [];
        if (entries.length === 0) return null;
        const liveCount = entries.filter((e) => e.live).length;
        return (
          <div key={g.key} style={{ marginBottom: 36 }}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${g.color}30` }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: g.bg, color: g.color, fontSize: 14 }}>
                {g.icon}
              </span>
              <Title level={5} style={{ margin: 0, color: g.color, fontWeight: 700, fontSize: 14 }}>{g.label}</Title>
              <Tag color={g.color} style={{ fontSize: 11, padding: '0 5px', margin: 0, lineHeight: '18px' }}>{liveCount} live</Tag>
              {entries.length - liveCount > 0 && (
                <Tag style={{ fontSize: 11, padding: '0 5px', margin: 0, lineHeight: '18px', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                  {entries.length - liveCount} soon
                </Tag>
              )}
            </div>

            {/* Cards */}
            <Row gutter={[10, 10]}>
              {entries.map((entry) => {
                const gDef = GROUP_MAP[entry.group as GroupKey];
                const card = (
                  <Card
                    key={entry.path}
                    size="small"
                    hoverable={entry.live}
                    onClick={entry.live ? () => navigate(entry.path) : undefined}
                    style={{
                      borderLeft: `3px solid ${entry.live ? gDef?.color : '#e5e7eb'}`,
                      cursor: entry.live ? 'pointer' : 'default',
                      opacity: entry.live ? 1 : 0.6,
                      height: '100%',
                    }}
                    styles={{ body: { padding: '9px 11px' } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 12.5, lineHeight: 1.3, color: entry.live ? undefined : '#9ca3af' }}>
                        {entry.label}
                      </Text>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Tag color={entry.kind === 'entity' ? '#0f766e' : '#64748b'} style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px', flexShrink: 0 }}>
                          {entry.kind === 'entity' ? 'Entity' : 'Reference'}
                        </Tag>
                        {entry.live
                          ? <Tag color={gDef?.color} style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px', flexShrink: 0 }}>Live</Tag>
                          : <Tag style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px', flexShrink: 0, color: '#d1d5db', borderColor: '#f3f4f6' }}>Soon</Tag>
                        }
                      </div>
                    </div>
                    <Text style={{ fontSize: 10.5, display: 'block', lineHeight: 1.45, color: '#6b7280' }}>
                      {entry.description}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#d1d5db', display: 'block', marginTop: 5, fontFamily: 'monospace' }}>
                      dbo.{entry.db}
                    </Text>
                  </Card>
                );

                return (
                  <Col key={entry.path} xs={24} sm={12} md={8} lg={6}>
                    {entry.live ? card : <Tooltip title="Coming soon — not yet implemented">{card}</Tooltip>}
                  </Col>
                );
              })}
            </Row>
          </div>
        );
      })}

      <Divider style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {LIVE_COUNT} of {TOTAL_COUNT} tables implemented · {TOTAL_COUNT - LIVE_COUNT} on the roadmap · mapped to dbo.* in SQL Server
        </Text>
      </Divider>
    </>
  );
}
