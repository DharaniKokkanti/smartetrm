import { useState, useMemo } from 'react';
import { Input, Card, Tag, Typography, Divider, Tooltip } from 'antd';
import {
  SearchOutlined, ApartmentOutlined, TeamOutlined, ShopOutlined,
  GlobalOutlined, CalendarOutlined, DollarOutlined,
  FileTextOutlined, SafetyCertificateOutlined, BankOutlined,
  ThunderboltOutlined, CarOutlined, WarningOutlined, CloudOutlined, AuditOutlined,
  ReconciliationOutlined,
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
  { key: 'Trade Operations', label: 'Trade Operations', icon: <ReconciliationOutlined />, color: '#0f766e', bg: '#f0fdfa' },
  { key: 'Contract & Legal', label: 'Contract & Legal', icon: <FileTextOutlined />, color: '#b45309', bg: '#fffbeb' },
  { key: 'Logistics & Delivery', label: 'Logistics & Delivery', icon: <GlobalOutlined />, color: '#15803d', bg: '#f0fdf4' },
  { key: 'Freight & Shipping', label: 'Freight & Shipping', icon: <CarOutlined />, color: '#0f766e', bg: '#f0fdfa' },
  { key: 'Power & Energy', label: 'Power & Energy', icon: <ThunderboltOutlined />, color: '#6d28d9', bg: '#faf5ff' },
  { key: 'Calendar & Periods', label: 'Calendar & Periods', icon: <CalendarOutlined />, color: '#1d4ed8', bg: '#eff6ff' },
  { key: 'Pricing & Rates', label: 'Pricing & Rates', icon: <DollarOutlined />, color: '#b91c1c', bg: '#fff1f2' },
  { key: 'Finance & Settlement', label: 'Finance & Settlement', icon: <BankOutlined />, color: '#065f46', bg: '#ecfdf5' },
  { key: 'Sanctions & Regulatory Reporting', label: 'Sanctions & Regulatory Reporting', icon: <SafetyCertificateOutlined />, color: '#92400e', bg: '#fef3c7' },
  { key: 'RIN & Renewable Fuels', label: 'RIN & Renewable Fuels', icon: <AuditOutlined />, color: '#1d4ed8', bg: '#eff6ff' },
  { key: 'Carbon & Environmental', label: 'Carbon & Environmental', icon: <CloudOutlined />, color: '#166534', bg: '#f0fdf4' },
] as const;

type GroupKey = (typeof GROUPS)[number]['key'];

// ─── ALL ENTRIES — mapped 1:1 to dbo.{db} in SQL Server schema ──────────────
const ALL_ENTRIES: Entry[] = [
  // ── Organization & Users ──────────────────────────────────────
  { live: true,  db: 'legal_entity',      group: 'Organization & Users', label: 'Legal Entities',      path: '/tier1/legal-entity',          description: 'Registered companies used as booking or trading entities. Required FK for trade capture.', tags: ['entity', 'company', 'corporate', 'lei'], kind: 'entity' },
  { live: true,  db: 'legal_entity_type', group: 'Organization & Users', label: 'Legal Entity Types',  path: '/static-data/legal_entity_type',     description: 'Corporate structure classifications — Trading Company, Subsidiary, Branch, Holding, Broker. Parent table for legal_entity.entity_type FK.', tags: ['legal entity type', 'subsidiary', 'branch', 'holding', 'structure'] },
  { live: true,  db: 'app_user',          group: 'Organization & Users', label: 'System Users',        path: '/admin/users',                 description: 'Login accounts with assigned roles — ADMIN, TRADER, RISK_MANAGER, OPERATIONS, COMPLIANCE, VIEWER.', tags: ['user', 'role', 'access', 'admin', 'permission'], kind: 'entity' },
  { live: true,  db: 'user_role',         group: 'Organization & Users', label: 'User Roles',          path: '/admin/roles',                 description: 'Role definitions and module-level permission sets. Controls which screens and actions each role can access.', tags: ['role', 'permission', 'rbac', 'access control'] },
  { live: true,  db: 'desk',              group: 'Organization & Users', label: 'Trading Desks',       path: '/org/desks',                   description: 'Commodity desk hierarchy — crude, gas, power, metals. Defines commodity type assignments and desk heads.', tags: ['desk', 'trading', 'commodity', 'team'], kind: 'entity' },
  { live: true,  db: 'book',              group: 'Organization & Users', label: 'Trading Books',       path: '/org/books',                   description: 'P&L books with position limits, VAR limits, and desk assignment. Each trade is booked to a book.', tags: ['book', 'pnl', 'var', 'position', 'limit'], kind: 'entity' },
  { live: true,  db: 'book_type',         group: 'Organization & Users', label: 'Book Types',          path: '/static-data/book_type',             description: 'Trading mandate classifications — Trading, Hedging, Arbitrage, Prop, Client, Risk Mgmt. Parent table for book.book_type FK.', tags: ['book type', 'trading', 'hedging', 'arbitrage', 'prop', 'risk mgmt'] },
  { live: true,  db: 'trader',            group: 'Organization & Users', label: 'Traders',             path: '/org/traders',                 description: 'Individual traders — single-trade limits, daily limits, commodity mandates, and approval chains.', tags: ['trader', 'limit', 'mandate', 'approval'], kind: 'entity' },
  { live: false, db: 'contact',           group: 'Organization & Users', label: 'Contacts',            path: '/org/contacts',                description: 'Named contacts at counterparties and legal entities — ops, credit, trading, compliance contacts.', tags: ['contact', 'person', 'ops', 'credit', 'trading'], kind: 'entity' },
  { live: true,  db: 'contact_role',      group: 'Organization & Users', label: 'Contact Roles',       path: '/static-data/contact_role',          description: 'Functional roles for named contacts — Trader, Back Office, Legal, Compliance, KYC, Credit. Parent table for contact.contact_role FK.', tags: ['contact role', 'back office', 'legal', 'compliance', 'kyc', 'credit'] },

  // ── Counterparties & Agreements ───────────────────────────────
  // DB: counterparty.cp_type = PRODUCER|CONSUMER|TRADER|BANK|BROKER|EXCHANGE|INTERCOMPANY|UTILITY|OTHER
  // Note: dbo.broker is a separate table for IDB broker master data used in trade capture (V29 migration).
  { live: true,  db: 'counterparty',              group: 'Counterparties & Agreements', label: 'Counterparties',             path: '/tier1/counterparty',                  description: 'All trading party types in one table — Producers, Consumers, Traders, Banks, Utilities, Intercompany. Filtered by cp_type FK.', tags: ['counterparty', 'bank', 'producer', 'consumer', 'utility', 'intercompany', 'kyc', 'lei'], kind: 'entity' },
  { live: true,  db: 'broker',                   group: 'Counterparties & Agreements', label: 'Brokers',                    path: '/org/brokers',                         description: 'Inter-dealer brokers (IDBs) used in trade capture — ICAP, TP ICAP, BGC, Tradition, Tullett Prebon, GFI. Voice, electronic, and hybrid platforms.', tags: ['broker', 'idb', 'icap', 'tp icap', 'bgc', 'tradition', 'tullett', 'gfi', 'voice', 'electronic'] },
  { live: true,  db: 'counterparty_type',         group: 'Counterparties & Agreements', label: 'Counterparty Types',         path: '/static-data/counterparty_type',             description: 'Counterparty business function classifications — Producer, Consumer, Trader, Bank, Broker, Exchange, Utility. Parent table for counterparty.cp_type FK.', tags: ['counterparty type', 'producer', 'consumer', 'trader', 'bank', 'broker', 'utility'] },
  { live: true,  db: 'kyc_status',                group: 'Counterparties & Agreements', label: 'KYC Statuses',               path: '/static-data/kyc_status',                    description: 'Know-Your-Customer onboarding states — Pending, Approved, Review, Suspended, Rejected. Parent table for counterparty.kyc_status FK.', tags: ['kyc', 'status', 'pending', 'approved', 'review', 'suspended', 'rejected'] },
  { live: true,  db: 'credit_rating',             group: 'Counterparties & Agreements', label: 'Credit Ratings',             path: '/static-data/credit_rating',                 description: 'External credit rating classifications — S&P, Moody\'s, Fitch grades mapped to numeric risk scores and categories.', tags: ['credit', 'rating', 'sp', 'moodys', 'fitch'] },
  { live: false, db: 'credit_term',               group: 'Counterparties & Agreements', label: 'Credit Terms',               path: '/counterparties/credit-terms',         description: 'Credit facility terms per counterparty — credit period days, required collateral type, threshold amounts.', tags: ['credit', 'term', 'facility', 'collateral', 'threshold'] },
  { live: false, db: 'netting_agreement',         group: 'Counterparties & Agreements', label: 'Netting Agreements',         path: '/counterparties/netting',              description: 'ISDA/EFET master netting agreements. Determines whether offsetting trades with a counterparty can be netted for settlement.', tags: ['netting', 'isda', 'efet', 'master agreement', 'set-off'], kind: 'entity' },
  { live: true,  db: 'netting_agreement_type',    group: 'Counterparties & Agreements', label: 'Netting Agreement Types',    path: '/static-data/netting_agreement_type',        description: 'Master netting frameworks — ISDA 2002 MA, ISDA 1992, EFET, GTMA, NAESB. Parent table for netting_agreement.agreement_type FK.', tags: ['netting type', 'isda 2002', 'efet', 'gtma', 'naesb', 'master agreement'] },
  { live: false, db: 'cp_commercial_terms',       group: 'Counterparties & Agreements', label: 'CP Commercial Terms',        path: '/counterparties/commercial-terms',     description: 'Default payment terms, settlement days, and currency preferences per counterparty–legal entity pair.', tags: ['commercial', 'terms', 'default', 'settlement', 'payment'], kind: 'entity' },
  { live: false, db: 'cp_gtc_agreement',          group: 'Counterparties & Agreements', label: 'CP GTC Agreements',          path: '/counterparties/gtc-agreements',       description: 'Which version of which GTC is agreed per counterparty and legal entity — the contractual foundation for each relationship.', tags: ['gtc', 'agreement', 'contract', 'efet', 'isda', 'gafta'], kind: 'entity' },

  // ── Credit & Collateral ───────────────────────────────────────
  { live: false, db: 'bank_guarantee',        group: 'Credit & Collateral', label: 'Bank Guarantees',         path: '/credit/bank-guarantees',   description: 'Performance and payment bank guarantees issued or received — guarantor bank, amount, expiry, commodity context.', tags: ['bank guarantee', 'bg', 'performance', 'payment', 'guarantor'], kind: 'entity' },
  { live: true,  db: 'letter_of_credit',      group: 'Credit & Collateral', label: 'Letters of Credit',       path: '/credit/letters-of-credit', description: 'Irrevocable/revolving/standby LCs — issuing bank, beneficiary, LC amount, tolling date, and amendment tracking.', tags: ['lc', 'letter of credit', 'standby', 'revolving', 'issuing bank'], kind: 'entity' },
  { live: true,  db: 'margin_agreement',      group: 'Credit & Collateral', label: 'Margin Agreements',       path: '/credit/margin-agreements', description: 'CSA and pledge agreements — thresholds, MTA, eligible collateral, valuation frequency — per counterparty. Drives the margin call engine.', tags: ['margin', 'csa', 'collateral', 'threshold', 'mta', 'isda', 'pledge', 'variation margin'], kind: 'entity' },
  { live: true,  db: 'credit_limit',          group: 'Credit & Collateral', label: 'Credit Limits',           path: '/credit/limits',            description: 'Pre-settlement, settlement, delivery and mark-to-market credit limits per counterparty. Utilisation tracked against live trade exposure.', tags: ['credit limit', 'pre-settlement', 'mark-to-market', 'exposure', 'utilisation', 'risk'], kind: 'entity' },
  { live: false, db: 'parent_company_guarantee', group: 'Credit & Collateral', label: 'Parent Company Guarantees', path: '/credit/pcg',            description: 'PCGs from parent companies guaranteeing counterparty obligations — essential for intercompany and subsidiary trading.', tags: ['pcg', 'parent', 'guarantee', 'subsidiary', 'intercompany'], kind: 'entity' },
  { live: false, db: 'collateral',            group: 'Credit & Collateral', label: 'Collateral',              path: '/credit/collateral',        description: 'Cash and non-cash collateral posted or received — linked to margin accounts, direction, and value dates.', tags: ['collateral', 'margin', 'cash', 'securities', 'initial margin', 'variation margin'], kind: 'entity' },
  { live: false, db: 'margin_account',        group: 'Credit & Collateral', label: 'Margin Accounts',         path: '/credit/margin-accounts',   description: 'Exchange margin accounts for cleared trades — initial and variation margin tracking per exchange.', tags: ['margin', 'initial margin', 'variation', 'exchange', 'cleared', 'ccp'], kind: 'entity' },
  { live: false, db: 'insurance_policy',      group: 'Credit & Collateral', label: 'Insurance Policies',      path: '/credit/insurance',         description: 'Cargo, credit, and political risk insurance policies — insurer, coverage period, insured values per commodity.', tags: ['insurance', 'cargo', 'credit risk', 'political risk', 'marine', 'policy'], kind: 'entity' },
  { live: false, db: 'insurance_provider',    group: 'Credit & Collateral', label: 'Insurance Providers',     path: '/credit/insurance-providers', description: 'Insurance companies — Lloyd\'s syndicates, AIG, Zurich, Euler Hermes — with contact and credit rating.', tags: ['insurer', 'lloyds', 'aig', 'zurich', 'euler hermes', 'provider'], kind: 'entity' },
  { live: false, db: 'tax_registration',      group: 'Credit & Collateral', label: 'Tax Registrations',       path: '/credit/tax',               description: 'VAT, GST, and sales tax registration numbers per legal entity and counterparty per jurisdiction.', tags: ['tax', 'vat', 'gst', 'registration', 'jurisdiction', 'tin'], kind: 'entity' },

  // ── Products & Markets ────────────────────────────────────────
  { live: true,  db: 'product',               group: 'Products & Markets', label: 'Products',              path: '/markets/products',       description: 'Tradeable commodity products — Brent, TTF, LME Copper, JKM LNG — with lot sizes, settlement type FK, and pricing basis.', tags: ['product', 'brent', 'wti', 'ttf', 'jkm', 'copper', 'lng', 'lot size'] },
  { live: true,  db: 'deal_type',             group: 'Products & Markets', label: 'Deal Types',            path: '/static-data/deal_type',        description: 'Trade type classifications — Physical, Financial, Option, Freight. Parent table for trade.trade_type FK.', tags: ['deal type', 'trade type', 'physical', 'financial', 'option', 'freight'] },
  { live: true,  db: 'settlement_type',       group: 'Products & Markets', label: 'Settlement Types',      path: '/static-data/settlement_type',  description: 'How a trade obligation is fulfilled — Physical, Financial, Options, Swap, Netted. Parent table for product.settlement_type and trade.settlement_type FKs.', tags: ['settlement type', 'physical', 'financial', 'options', 'swap', 'netted'] },
  { live: true,  db: 'commodity',             group: 'Products & Markets', label: 'Commodities',           path: '/static-data/commodity',        description: 'Base commodity types — OIL, GAS, POWER, LNG, METALS, AGRI, FREIGHT. The top-level classification above product.', tags: ['commodity', 'oil', 'gas', 'power', 'metals', 'agri', 'freight'] },
  { live: false, db: 'product_spec_template', group: 'Products & Markets', label: 'Product Spec Templates', path: '/markets/spec-templates', description: 'Quality and grade specification parameters — API gravity, sulphur %, gas calorific value, metal purity, grain moisture.', tags: ['spec', 'grade', 'quality', 'api', 'sulphur', 'purity', 'specification'] },
  { live: true,  db: 'market',                group: 'Products & Markets', label: 'Markets',               path: '/markets/markets',        description: 'Trading venues — ICE Brent, NYMEX WTI, LME Copper, OTC bilateral, OTC cleared — linked to products and periods.', tags: ['market', 'otc', 'exchange', 'cleared', 'bilateral', 'venue'] },
  { live: true,  db: 'price_index',           group: 'Products & Markets', label: 'Price Indices',         path: '/markets/price-indices',  description: 'Benchmark price indices — Dated Brent, JKM, TTF, LME Official Settlement — from Platts, Argus, ICE.', tags: ['index', 'platts', 'argus', 'dated brent', 'ttf', 'jkm', 'lme official'] },
  { live: true,  db: 'exchange',              group: 'Products & Markets', label: 'Exchanges',             path: '/markets/exchanges',      description: 'Licensed exchanges — ICE, NYMEX, LME, EEX, TOCOM — with MIC codes, regulators, and clearing houses.', tags: ['exchange', 'ice', 'nymex', 'lme', 'eex', 'tocom', 'cme', 'mic'] },

  // ── Trade Operations ──────────────────────────────────────────
  { live: true, db: 'bolmo_agreement', group: 'Trade Operations', label: 'BOLMO Agreements', path: '/bolmo', description: 'Book Out / Let Me Out — bilateral agreements to net offsetting physical delivery obligations with a counterparty via cash settlement, eliminating logistics.', tags: ['bolmo', 'book out', 'let me out', 'netting', 'physical', 'delivery', 'offsetting', 'bilateral', 'cash settlement'], kind: 'entity' },
  { live: false, db: 'nomination', group: 'Trade Operations', label: 'Nominations', path: '/operations/nominations', description: 'Delivery scheduling and pipeline/terminal nominations — quantity, timing, vessel assignment, and nomination deadlines per trade order.', tags: ['nomination', 'scheduling', 'pipeline', 'terminal', 'vessel', 'timing', 'delivery'] },
  { live: false, db: 'delivery_instruction', group: 'Trade Operations', label: 'Delivery Instructions', path: '/operations/delivery-instructions', description: 'Formal delivery instructions to counterparties — tank, berth, terminal, agent, and quantity per cargo or tranche.', tags: ['delivery', 'instruction', 'cargo', 'tranche', 'tank', 'berth', 'terminal', 'agent'] },

  // ── Contract & Legal ──────────────────────────────────────────
  { live: true,  db: 'gtc',                     group: 'Contract & Legal', label: 'General T&Cs',           path: '/contracts/gtcs',                    description: 'Master contract templates — EFET 2019, BP Oil T&Cs, GAFTA 100, ISDA 2002 MA, NAESB Gas. Versioned per commodity.', tags: ['gtc', 'efet', 'isda', 'gafta', 'naesb', 'bp', 'master agreement', 'terms'] },
  { live: true,  db: 'broker_fee_agreement',    group: 'Contract & Legal', label: 'Broker Fee Agreements',  path: '/contracts/broker-fee-agreements',   description: 'Standing rate cards per IDB broker — fee type (per-lot, % notional, flat), rate, currency, pay period, and validity. Drives automatic fee population when a broker is selected on a trade.', tags: ['broker', 'fee', 'rate card', 'idb', 'icap', 'brokerage', 'per lot', 'monthly', 'auto-generate'] },
  { live: true,  db: 'incoterm',                group: 'Contract & Legal', label: 'Incoterms',              path: '/reference/incoterms',       description: 'ICC Incoterms 2020 — FOB, CIF, DDP, DAP, CIF. Defines risk transfer point and transport obligation.', tags: ['incoterm', 'fob', 'cif', 'dap', 'ddp', 'risk transfer', 'icc'] },
  { live: true,  db: 'payment_term',            group: 'Contract & Legal', label: 'Payment Terms',          path: '/contracts/payment-terms',   description: 'Invoice payment schedules — NET30, NET45, LME prompt date, prepayment. Each term references a payment_method FK.', tags: ['payment', 'net30', 'net45', 'lme prompt', 'invoice', 'prepayment'] },
  { live: true,  db: 'payment_method',          group: 'Contract & Legal', label: 'Payment Methods',        path: '/static-data/payment_method',      description: 'Settlement mechanisms — Wire, SWIFT, Letter of Credit, Bank Guarantee, Netting, Prepayment. Parent table for payment_term.payment_method FK.', tags: ['payment method', 'wire', 'swift', 'netting', 'lc', 'letter of credit', 'bank guarantee'] },
  { live: true,  db: 'transport_document_type', group: 'Contract & Legal', label: 'Transport Doc Types',    path: '/static-data/transport_document_type', description: 'Document types per mode of transport — Bill of Lading, CMR, CIM, Air Waybill, Pipeline Batch Ticket. Parent table for document.doc_type FK.', tags: ['bill of lading', 'bol', 'cmr', 'cim', 'document', 'transport', 'certificate'] },

  // ── Logistics & Delivery ──────────────────────────────────────
  { live: true,  db: 'location',               group: 'Logistics & Delivery', label: 'Locations',              path: '/logistics/locations',          description: 'Ports, gas hubs, grid nodes, LNG terminals, refinery gates, pipeline IPs. Used as delivery/loading points on trades.', tags: ['location', 'port', 'hub', 'terminal', 'cushing', 'ttf', 'nbp', 'rotterdam', 'sullom voe'], kind: 'entity' },
  { live: true,  db: 'location_type',          group: 'Logistics & Delivery', label: 'Location Types',         path: '/static-data/location_type',          description: 'Location classification — PORT, GAS_HUB, LNG_TERMINAL, PIPELINE_HUB, GRID_NODE, STORAGE_FACILITY, REFINERY. Parent table for location.location_type FK.', tags: ['location type', 'port', 'hub', 'terminal', 'grid', 'classification'] },
  { live: true,  db: 'vessel',                 group: 'Logistics & Delivery', label: 'Vessels',                path: '/logistics/vessels',            description: 'Tankers with IMO number, vessel class, SIRE inspection expiry, CDI vetting, DWT, and cargo restrictions.', tags: ['vessel', 'ship', 'tanker', 'vlcc', 'aframax', 'suezmax', 'imo', 'sire', 'cdi', 'vetting', 'dwt'], kind: 'entity' },
  { live: false, db: 'vessel_certificate',     group: 'Logistics & Delivery', label: 'Vessel Certificates',    path: '/logistics/vessel-certs',       description: 'SOLAS, MARPOL, ISM, ISSC, class society certificates with expiry dates tracked per vessel.', tags: ['certificate', 'solas', 'marpol', 'ism', 'issc', 'class society', 'lloyds', 'dnv', 'bureau veritas'], kind: 'entity' },
  { live: true,  db: 'inspection_type',        group: 'Logistics & Delivery', label: 'Inspection Types',       path: '/static-data/inspection_type',        description: 'Cargo inspection types — Quantity Survey, Quality Survey, Tank Calibration, Ullage, Draught, Independent. Used on trade confirmations.', tags: ['inspection', 'sgs', 'bureau', 'cotecna', 'quantity', 'quality', 'independent'] },
  { live: true,  db: 'pipeline',               group: 'Logistics & Delivery', label: 'Pipelines',              path: '/logistics/pipelines',          description: 'Oil and gas pipeline systems — TSO, regulatory body, capacity, tariff, and product approvals.', tags: ['pipeline', 'tso', 'crude', 'gas', 'druzhba', 'keystone', 'ferc', 'ofgem', 'capacity'], kind: 'entity' },
  { live: false, db: 'pipeline_segment',       group: 'Logistics & Delivery', label: 'Pipeline Segments',      path: '/logistics/pipeline-segments',  description: 'Individual pipeline segments with injection/offtake points, flow direction, and nomination cycles.', tags: ['segment', 'injection', 'offtake', 'nomination', 'cycle', 'capacity'], kind: 'entity' },
  { live: false, db: 'pipeline_tariff',        group: 'Logistics & Delivery', label: 'Pipeline Tariffs',       path: '/logistics/pipeline-tariffs',   description: 'Access tariffs by pipeline and product — throughput fees, booking fees, and quality adjustment charges.', tags: ['tariff', 'throughput', 'fee', 'booking', 'quality adjustment'] },
  { live: true,  db: 'truck',                  group: 'Logistics & Delivery', label: 'Trucks & Road',          path: '/logistics/trucks',             description: 'Road tankers and bulk vehicles — ADR hazmat certificate, GVW, inspection expiry, operator, license plate.', tags: ['truck', 'tanker', 'road', 'adr', 'gvw', 'license', 'isotank', 'bulk'], kind: 'entity' },
  { live: true,  db: 'storage_facility',       group: 'Logistics & Delivery', label: 'Storage Facilities',     path: '/logistics/storage',            description: 'Tank farms, gas caverns, LNG tanks, LME warehouses — references storage_facility_type FK for classification.', tags: ['storage', 'tank', 'cavern', 'lme', 'warehouse', 'lng', 'gas', 'injection', 'withdrawal'], kind: 'entity' },
  { live: true,  db: 'storage_facility_type',  group: 'Logistics & Delivery', label: 'Storage Facility Types', path: '/static-data/storage_facility_type',  description: 'Physical storage classifications — Tank, Warehouse, LNG Terminal, Grain Silo, Refinery, Cavern, Vault. Parent table for storage_facility.facility_type FK.', tags: ['storage facility type', 'tank', 'warehouse', 'lng terminal', 'cavern', 'vault', 'silo'] },
  { live: false, db: 'tank',                   group: 'Logistics & Delivery', label: 'Tanks',                  path: '/logistics/tanks',              description: 'Individual storage tanks within a facility — calibration tables, capacity, product grade, current status.', tags: ['tank', 'capacity', 'calibration', 'ullage', 'product', 'grade'], kind: 'entity' },
  { live: false, db: 'container',              group: 'Logistics & Delivery', label: 'Containers',             path: '/logistics/containers',         description: 'ISO containers and flexibags for bulk liquids and packaged goods — container number, type, owner, depot.', tags: ['container', 'iso', 'flexibag', '20ft', '40ft', 'depot', 'box'], kind: 'entity' },
  { live: false, db: 'railcar',                group: 'Logistics & Delivery', label: 'Rail Cars',              path: '/logistics/railcars',           description: 'Tank cars and bulk railcars — AAR designation, capacity, lessee, inspection date, commodity approval.', tags: ['railcar', 'tank car', 'aar', 'rail', 'bulk', 'lessee'], kind: 'entity' },
  { live: true,  db: 'mot_type',               group: 'Logistics & Delivery', label: 'Modes of Transport',     path: '/static-data/mot_type',               description: 'Transport medium types — SEA, PIPELINE, ROAD, RAIL, BARGE, AIR. Controls which logistics fields appear on a trade.', tags: ['mot', 'mode', 'sea', 'pipeline', 'road', 'rail', 'barge'] },
  { live: false, db: 'transport_operator',     group: 'Logistics & Delivery', label: 'Transport Operators',    path: '/logistics/operators',          description: 'Haulage companies, rail operators, barge operators — contact, coverage area, commodity approvals.', tags: ['operator', 'haulage', 'rail', 'barge', 'carrier'], kind: 'entity' },

  // ── Freight & Shipping ────────────────────────────────────────
  { live: true,  db: 'charter_party_type',     group: 'Freight & Shipping', label: 'Charter Party Types',    path: '/static-data/charter_party_type',       description: 'Voyage, time charter, bareboat, and COA charter types — rate basis (WS flat, LSUM, PDAY, PER_CBM for LNG), duration basis, and standard form reference (ASBATANKVOY/GENCON/LNGVOY/SHELLTIME4/BARECON). Parent table for charter_party FK.', tags: ['charter', 'voyage', 'time charter', 'bareboat', 'worldscale', 'lsum', 'lngvoy', 'shelltime'] },
  { live: true,  db: 'freight_rate_index',     group: 'Freight & Shipping', label: 'Freight Rate Indices',   path: '/static-data/freight_rate_index',       description: 'Freight benchmarks across commodities — Baltic dry-bulk indices (any dry cargo: ore, coal, grain), Worldscale tanker flat rates, and Spark30S for LNG. Published by Baltic Exchange / Worldscale Association / Spark Commodities.', tags: ['bdti', 'bcti', 'bdi', 'worldscale', 'baltic exchange', 'spark30s', 'lng freight', 'freight rate', 'flat rate'] },
  { live: true,  db: 'laytime_term_template',  group: 'Freight & Shipping', label: 'Laytime Term Templates', path: '/static-data/laytime_term_template',    description: 'Standard laytime clauses — which days count (SHINC/SHEX/WWD), reversibility, and the NOR-tendering basis (WIPON/WIBON/WIFPON/WCCON) that determines when laytime starts counting. Includes an LNG-specific template.', tags: ['laytime', 'shinc', 'shex', 'wibon', 'wipon', 'wifpon', 'wccon', 'nor', 'demurrage', 'vessel', 'charter', 'lng'] },
  { live: true,  db: 'demurrage_dispatch_rate', group: 'Freight & Shipping', label: 'Demurrage & Dispatch',  path: '/static-data/demurrage_dispatch_rate',  description: 'Demurrage/dispatch rate schedules by vessel class and commodity (oil tankers, LNG carriers, dry-bulk/metals) — includes the claim time-bar and despatch basis (all time saved vs. working time only).', tags: ['demurrage', 'dispatch', 'despatch', 'laytime', 'port', 'vessel class', 'rate', 'time bar', 'lng', 'metals'] },
  { live: true,  db: 'laytime_exception_type', group: 'Freight & Shipping', label: 'Laytime Exception Types', path: '/static-data/laytime_exception_type',  description: 'Standard reasons time is excepted from (or counted against) laytime — weather, strikes, breakdowns, port congestion, boil-off gas management — used in laytime calculations and demurrage disputes across any vessel-carried commodity.', tags: ['laytime', 'exception', 'weather', 'strike', 'breakdown', 'demurrage', 'dispute'] },
  { live: false, db: 'transport_route',        group: 'Freight & Shipping', label: 'Transport Routes',       path: '/freight/routes',                 description: 'Standard freight routes — Ras Tanura to Rotterdam, WAF to USG — with benchmark voyage days and typical freight.', tags: ['route', 'voyage', 'ras tanura', 'rotterdam', 'waf', 'usg', 'freight', 'days'] },

  // ── Power & Energy ────────────────────────────────────────────
  { live: false, db: 'generation_asset',     group: 'Power & Energy', label: 'Generation Assets',     path: '/power/generation-assets',    description: 'Power plants — gas peakers, wind farms, nuclear — with installed capacity, location, and balancing authority.', tags: ['generation', 'power plant', 'gas peaker', 'wind', 'nuclear', 'solar', 'capacity', 'mw'], kind: 'entity' },
  { live: true,  db: 'load_shape_template',  group: 'Power & Energy', label: 'Load Shape Templates',  path: '/static-data/load_shape_template',   description: 'Baseload, peak, off-peak, and custom hourly load profiles used in power trade capture.', tags: ['load shape', 'baseload', 'peak', 'off-peak', 'hourly', 'profile', 'mw'] },
  { live: true,  db: 'balancing_authority',  group: 'Power & Energy', label: 'Balancing Authorities', path: '/static-data/balancing_authority',   description: 'Grid operators responsible for real-time balancing — ERCOT, PJM, MISO, National Grid ESO, RTE.', tags: ['balancing', 'ercot', 'pjm', 'miso', 'national grid', 'rte', 'eno', 'grid operator'] },
  { live: true,  db: 'transmission_zone',   group: 'Power & Energy', label: 'Transmission Zones',    path: '/static-data/transmission_zone',     description: 'Price zones and load zones within a balancing authority — ERCOT HUB_NORTH, PJM PJMW, GB NATIONAL.', tags: ['zone', 'hub', 'load zone', 'price zone', 'ercot', 'pjm', 'national grid'] },
  { live: false, db: 'interconnector',      group: 'Power & Energy', label: 'Interconnectors',       path: '/power/interconnectors',      description: 'Cross-border and inter-zone power interconnectors — BritNed, IFA, Moyle — with capacity and regulatory auction rules.', tags: ['interconnector', 'britned', 'ifa', 'moyle', 'cross-border', 'capacity', 'auction'], kind: 'entity' },
  { live: true,  db: 'transmission_right_type', group: 'Power & Energy', label: 'Transmission Right Types', path: '/static-data/transmission_right_type', description: 'FTR, PTR, ATR — financial and physical transmission rights traded on interconnectors. Parent table for transmission_right FK.', tags: ['ftr', 'ptr', 'atr', 'transmission right', 'interconnector', 'congestion', 'auction'] },
  { live: true,  db: 'load_shape_interval',  group: 'Power & Energy', label: 'Load Shape Intervals',  path: '/static-data/load_shape_interval',   description: 'Hour-by-hour (or 15/30-min) MW weighting under a load shape — the profile detail behind solar bell curves and EV charging demand shapes.', tags: ['load shape', 'interval', 'hourly', 'profile', 'solar', 'ev', 'shaped', 'curve'] },
  { live: true,  db: 'load_shape_component', group: 'Power & Energy', label: 'Load Shape Components', path: '/static-data/load_shape_component',  description: 'Nested shape structure — composite shapes built from weighted child shapes with optional seasonal month windows, e.g. ATC = Peak + Off-Peak.', tags: ['load shape', 'composite', 'nested', 'seasonal', 'atc', 'peak', 'off-peak'] },
  { live: true,  db: 'energy_footprint',     group: 'Power & Energy', label: 'Energy Footprints',     path: '/static-data/energy_footprint',      description: 'Distributed asset portfolios traded as one unit — solar portfolios, EV charging networks, battery fleets, demand-response aggregations.', tags: ['footprint', 'solar', 'ev charging', 'network', 'portfolio', 'battery', 'vpp', 'der', 'demand response'] },
  { live: true,  db: 'energy_footprint_site', group: 'Power & Energy', label: 'Energy Footprint Sites', path: '/static-data/energy_footprint_site', description: 'Member sites of an energy footprint — solar arrays, EV charging hubs and depots, battery units — with per-site zone, capacity, and technology.', tags: ['site', 'solar array', 'rooftop', 'charging hub', 'depot', 'battery', 'charger', 'ccs'] },

  // ── Calendar & Periods ────────────────────────────────────────
  { live: true,  db: 'holiday_calendar',  group: 'Calendar & Periods', label: 'Holiday Calendars',   path: '/calendar/holiday-calendars', description: 'Banking and exchange holiday calendars — London, New York, LME, ECB TARGET2, Tokyo — for pricing and settlement.', tags: ['calendar', 'holiday', 'london', 'nyc', 'lme', 'ecb', 'target2', 'tokyo'] },
  { live: true,  db: 'period',            group: 'Calendar & Periods', label: 'Trading Periods',     path: '/calendar/periods',           description: 'Monthly, quarterly, and annual delivery and pricing periods — Mar-25, Q2-25, CAL-25, Prompt, Spot.', tags: ['period', 'monthly', 'quarterly', 'annual', 'prompt', 'spot', 'front month', 'cal25'] },
  { live: false, db: 'settlement_calendar', group: 'Calendar & Periods', label: 'Settlement Calendars', path: '/calendar/settlement',      description: 'Settlement date calendars per commodity and currency pair — T+2, T+5, LME prompt date rules.', tags: ['settlement', 'calendar', 'value date', 'lme', 't+2', 'prompt', 'cash'] },

  // ── Pricing & Rates ───────────────────────────────────────────
  { live: true,  db: 'price_source',        group: 'Pricing & Rates', label: 'Price Sources',          path: '/pricing/price-sources',        description: 'Data vendor connections — Platts eWindow, Argus Direct, Bloomberg API, ICE Data Services, LME live feed.', tags: ['price source', 'platts', 'argus', 'bloomberg', 'ice', 'lme', 'vendor', 'api', 'feed'] },
  { live: true,  db: 'pricing_rule',        group: 'Pricing & Rates', label: 'Pricing Rules',          path: '/pricing/pricing-rules',        description: 'Fixed, floating, differential, and Asian average pricing formulas — including TAS (Trade at Settlement) rules.', tags: ['pricing', 'fixed', 'floating', 'differential', 'asian', 'average', 'formula', 'tas', 'swap'] },
  { live: true,  db: 'pricing_type',        group: 'Pricing & Rates', label: 'Pricing Types',          path: '/static-data/pricing_type',     description: 'Pricing mechanism classifications — Fixed, Floating, Formula, Differential, Average, TAS, Option Strike, Platts Window.', tags: ['pricing type', 'fixed', 'floating', 'formula', 'differential', 'average', 'tas'] },
  { live: true,  db: 'settlement_price',    group: 'Pricing & Rates', label: 'Settlement Prices',      path: '/pricing/settlement-prices',    description: 'Daily exchange settlement prices — CME NYMEX (CL, NG, HO, RB) and ICE (Brent BZ). Used to lock TAS trade positions and calculate BALMO running averages.', tags: ['settlement price', 'cme', 'nymex', 'ice', 'tas', 'wti', 'crude', 'gas', 'heating oil', 'daily', 'close'] },
  { live: true,  db: 'balmo_product',      group: 'Pricing & Rates', label: 'BALMO Products',          path: '/pricing/balmo-products',       description: 'Balance of Month contract listings — one row per monthly BALMO contract on CME NYMEX (J42 WTI) or ICE. Pricing window = booking date → last business day of month. New row added each month as contracts are listed.', tags: ['balmo', 'balance of month', 'cme', 'nymex', 'ice', 'brent', 'wti', 'swap', 'partial month', 'average', 'settlement'] },
  { live: false, db: 'formula_template',    group: 'Pricing & Rates', label: 'Formula Templates',      path: '/pricing/formulas',             description: 'Reusable price formula templates — Dated Brent ± differential, JCC ×0.1485, average of front-month TTF.', tags: ['formula', 'template', 'dated brent', 'jcc', 'ttf', 'differential', 'asian'] },
  { live: false, db: 'interest_rate_index', group: 'Pricing & Rates', label: 'Interest Rate Indices',  path: '/pricing/interest-rates',       description: 'SOFR, EURIBOR, SONIA — used for financing costs, late payment interest, and commodity-linked structures.', tags: ['interest rate', 'sofr', 'euribor', 'sonia', 'libor', 'rfr', 'financing'] },
  { live: false, db: 'fx_rate',             group: 'Pricing & Rates', label: 'FX Rates',               path: '/pricing/fx-rates',             description: 'Historical and live FX rates per currency pair. Used for P&L revaluation and cross-currency settlement.', tags: ['fx', 'exchange rate', 'usd', 'eur', 'gbp', 'jpy', 'currency pair', 'revaluation'] },

  // ── Finance & Settlement ──────────────────────────────────────
  { live: true,  db: 'currency',         group: 'Finance & Settlement', label: 'Currencies',       path: '/reference/currencies',   description: 'ISO 4217 currency codes with decimal places and base currency flag. USD is the system base currency.', tags: ['currency', 'usd', 'eur', 'gbp', 'jpy', 'iso4217', 'fx', 'base currency'] },
  { live: false, db: 'bank_account',     group: 'Finance & Settlement', label: 'Bank Accounts',    path: '/finance/bank-accounts',  description: 'Settlement bank accounts for legal entities and counterparties — IBAN, BIC/SWIFT, currency, account type (SETTLEMENT/MARGIN).', tags: ['bank', 'account', 'iban', 'bic', 'swift', 'nostro', 'vostro', 'settlement', 'margin'], kind: 'entity' },
  { live: true,  db: 'unit_of_measure',  group: 'Finance & Settlement', label: 'Units of Measure', path: '/reference/uom',          description: 'BBL, MT, MWH, MMBTU, THERM, BUSHEL, M3 — volume, weight, energy, and power units with conversion factors.', tags: ['uom', 'unit', 'bbl', 'mt', 'mwh', 'mmbtu', 'therm', 'bushel', 'conversion'] },
  { live: true,  db: 'uom_conversion',   group: 'Finance & Settlement', label: 'UoM Conversions',  path: '/reference/uom-conversions', description: 'Conversion factors between units — BBL to MT per crude grade, MMBTU to MWH, MT to m3 for LNG.', tags: ['conversion', 'bbl', 'mt', 'mmbtu', 'mwh', 'm3', 'lng', 'factor'] },

  // ── Sanctions & Regulatory Reporting ───────────────────────────
  { live: true,  db: '— (iso 3166)',           group: 'Sanctions & Regulatory Reporting', label: 'Countries',               path: '/reference/countries',      description: 'ISO 3166 country codes with FATF status and sanctions lists — OFAC SDN, EU Consolidated, UN — for KYC and sanctions screening.', tags: ['country', 'fatf', 'sanctions', 'ofac', 'eu', 'un', 'kyc', 'iso3166', 'jurisdiction'] },
  { live: false, db: 'regulatory_obligation',  group: 'Sanctions & Regulatory Reporting', label: 'Regulatory Obligations',  path: '/compliance/obligations',   description: 'REMIT, EMIR, CFTC, MiFID II reporting obligations — which trades require reporting, to which regime, by when.', tags: ['remit', 'emir', 'cftc', 'mifid', 'regulatory', 'reporting', 'obligation'] },
  { live: false, db: 'regulatory_report_type', group: 'Sanctions & Regulatory Reporting', label: 'Report Types',            path: '/compliance/report-types',  description: 'Regulatory report type definitions — REMIT Table 1, EMIR REFIT, CFTC Part 43/45 — with field mapping rules.', tags: ['report type', 'remit', 'emir refit', 'cftc', 'part 43', 'part 45', 'field mapping'] },
  { live: false, db: 'trade_repository',       group: 'Sanctions & Regulatory Reporting', label: 'Trade Repositories',      path: '/compliance/trade-repos',   description: 'DTCC, REGIS-TR, ICE TVEL — registered trade repositories by regime with connection credentials and status.', tags: ['trade repository', 'dtcc', 'regis-tr', 'ice tvel', 'regulatory', 'reporting'], kind: 'entity' },

  // ── RIN & Renewable Fuels ─────────────────────────────────────
  { live: true, db: 'rin_fuel_category', group: 'RIN & Renewable Fuels', label: 'RIN Fuel Categories (D-Codes)', path: '/rins/fuel-categories', description: 'EPA D-code master: D3 Cellulosic (3.0 RINs/gal), D4 Biomass-Based Diesel (1.5), D5 Advanced (1.5), D6 Conventional Ethanol (1.0), D7 Cellulosic Diesel (1.7). Equivalence values mandated by 40 CFR Part 80.1415.', tags: ['rin', 'd3', 'd4', 'd5', 'd6', 'd7', 'rfs', 'rfs2', 'renewable fuel', 'equivalence value', 'biofuel', 'ethanol', 'biodiesel'] },
  { live: true, db: 'rin_account',       group: 'RIN & Renewable Fuels', label: 'RIN Accounts',                  path: '/rins/accounts',         description: 'EPA EMTS company and facility accounts for holding, transferring, and retiring RINs. Obligated parties register company-level accounts; renewable fuel producers also register facility-level accounts for RIN generation.', tags: ['rin', 'epa', 'emts', 'account', 'company', 'facility', 'obligated party', 'producer'], kind: 'entity' },
  { live: true, db: 'rin_obligation',    group: 'RIN & Renewable Fuels', label: 'RVO Obligations',               path: '/rins/obligations',      description: 'Annual Renewable Volume Obligations per legal entity and D-code. Tracks required vs. retired RINs, shortfall, and EPA compliance deadline (typically March 31). Integrates with transaction retirement events.', tags: ['rvo', 'obligation', 'compliance', 'rfs', 'rin', 'retire', 'deadline', 'annual'] },

  // ── Finance & Settlement (back-office) ────────────────────────
  { live: true, db: 'gl_account',     group: 'Finance & Settlement', label: 'GL Accounts',      path: '/finance/gl-accounts',    description: 'Chart of accounts entries for trade P&L, fees, and settlement postings — account code, type (REVENUE/COST/BALANCE_SHEET), and cost centre mapping.', tags: ['gl', 'general ledger', 'chart of accounts', 'cost centre', 'pnl', 'revenue', 'accounting'] },

  // ── Carbon & Environmental ────────────────────────────────────
  { live: true, db: 'emission_scheme',        group: 'Carbon & Environmental', label: 'Emission Schemes',       path: '/environmental/schemes',        description: 'Cap-and-trade and voluntary carbon schemes — EU ETS, UK ETS, California Cap-and-Trade, RGGI, VCS (Verra), Gold Standard. Parent table for allowance and offset products.', tags: ['eu ets', 'uk ets', 'california', 'rggi', 'vcs', 'gold standard', 'cap and trade', 'carbon scheme'] },
  { live: true, db: 'environmental_product',  group: 'Carbon & Environmental', label: 'Environmental Products', path: '/environmental/products',       description: 'Tradeable environmental instruments — EUA (EU Allowance), EUAA (Aviation), UKA (UK Allowance), CCA (California), REC (Renewable Energy Certificate), GO (Guarantee of Origin), VCU (Verra Carbon Unit).', tags: ['eua', 'euaa', 'uka', 'cca', 'rec', 'go', 'vcu', 'cer', 'carbon', 'allowance', 'certificate'], kind: 'entity' },
  { live: true, db: 'carbon_registry',        group: 'Carbon & Environmental', label: 'Carbon Registries',      path: '/environmental/registries',     description: 'Registries where environmental instruments are issued, held, and cancelled — EU Union Registry, UK Registry, Verra, Gold Standard, American Carbon Registry, APX.', tags: ['registry', 'union registry', 'verra', 'gold standard', 'acr', 'apx', 'issuance', 'cancellation'], kind: 'entity' },
  { live: true, db: 'emission_obligation',    group: 'Carbon & Environmental', label: 'Emission Obligations',   path: '/environmental/obligations',    description: 'Surrender obligations per legal entity per scheme year — how many allowances must be surrendered, due date, and compliance status under each scheme.', tags: ['surrender', 'obligation', 'compliance', 'scheme year', 'mrvscheme', 'emissions', 'reporting period'] },

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

            {/* Cards — auto-fill grid: column count adapts to viewport width */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
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
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    styles={{ body: { padding: '9px 11px', display: 'flex', flexDirection: 'column', flex: 1 } }}
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
                    <Text style={{ fontSize: 10.5, display: 'block', lineHeight: 1.45, color: '#6b7280', flex: 1 }}>
                      {entry.description}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#d1d5db', display: 'block', marginTop: 5, fontFamily: 'monospace' }}>
                      dbo.{entry.db}
                    </Text>
                  </Card>
                );

                return entry.live
                  ? <div key={entry.path}>{card}</div>
                  : <Tooltip key={entry.path} title="Coming soon — not yet implemented"><div>{card}</div></Tooltip>;
              })}
            </div>
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
