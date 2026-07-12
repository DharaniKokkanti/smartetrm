import type { RegistryEntry, TableMetadata, ReferenceDataRow, ColumnDataKind } from '@models/referenceData';

// ─── Column helper — cuts boilerplate in the complex-table metadata below ─────
// isDecimal defaults false (integer) — a 'number' column is an INT-family
// SQL type unless explicitly marked otherwise. Only rates, factors, prices,
// percentages, and physical capacities (which are genuinely fractional in
// this schema) pass true.
function col(
  name: string, label: string, kind: ColumnDataKind,
  nullable: boolean, isPrimaryKey: boolean, maxLength: number | null,
  enumValues: string[] | null = null, foreignKeyTable: string | null = null,
  foreignKeyCategory: string | null = null, isDecimal: boolean = false,
) {
  return {
    name, label, kind, isPrimaryKey, nullable, maxLength, enumValues, foreignKeyTable, foreignKeyCategory,
    numericSubKind: kind === 'number' ? (isDecimal ? 'decimal' as const : 'integer' as const) : null,
  };
}

// V55 moved commodity_type from a hardcoded VARCHAR+CHECK to an INT FK on
// dbo.lookup_value(lookup_id); V85 later pulled it back out into its own
// dedicated dbo.commodity_type table (see PARENT_LOOKUP_TABLES below —
// 'commodity_type' entry, ids seeded in the same order this comment used to
// document: OIL=1, GAS=2, POWER=3, LNG=4, AGRICULTURAL=5, METALS=6,
// FREIGHT=7, RINS=8, ENVIRONMENTAL=9, MULTI=10, OTHER=11). The various
// bespoke entity mocks below (book/desk/gl_account/etc., in etrmHandlers.ts,
// not this file) reference commodityType as a raw numeric id without a real
// FK lookup modeled in the mock layer — a pre-existing gap (see the `uomId`
// placeholder note further down) — but those ids do line up with real
// dbo.commodity_type rows now.

// ─── Factory: standard parent-lookup table metadata ───────────────────────────
// All 13 V17 parent tables share the same column shape:
//   {pk}  |  typeCode  |  typeName  |  description  |  sortOrder  |  isActive
function makeLookupMeta(tableName: string, displayName: string, pkCol: string): TableMetadata {
  return {
    tableName, displayName, primaryKeyColumn: pkCol, isTemporal: false,
    columns: [
      col(pkCol,         'ID',          'number',  false, true,  null),
      col('typeCode',    'Code',        'string',  false, false, 50),
      col('typeName',    'Name',        'string',  false, false, 100),
      col('description', 'Description', 'string',  true,  false, 500),
      col('sortOrder',   'Sort Order',  'number',  false, false, null),
      col('isActive',    'Active',      'boolean', false, false, null),
    ],
  };
}

// ─── Simple list — every V17 parent lookup table defined exactly once ─────────
// Add a new lookup table → add one entry here.  That's the only change needed.
interface LookupDef {
  name: string; label: string; pk: string; group: string; order: number;
  subGroup?: string; description?: string;
  rows: ReferenceDataRow[];
}

const PARENT_LOOKUP_TABLES: LookupDef[] = [
  {
    name: 'deal_type', label: 'Deal Types', pk: 'dealTypeId', group: 'Products & Markets', order: 1,
    subGroup: 'Trade Types', description: 'Classifies trades by the nature of the obligation — physical delivery, financial settlement, options, or freight charters. Used on every trade ticket to drive workflow rules and position logic.',
    rows: [
      { dealTypeId: 1, typeCode: 'PHYSICAL',  typeName: 'Physical',  description: 'Physical commodity delivery trade',            sortOrder: 1, isActive: true },
      { dealTypeId: 2, typeCode: 'FINANCIAL', typeName: 'Financial', description: 'Financial / paper trade with no physical leg', sortOrder: 2, isActive: true },
      { dealTypeId: 3, typeCode: 'OPTION',    typeName: 'Option',    description: 'Options contract — call or put',               sortOrder: 3, isActive: true },
      { dealTypeId: 4, typeCode: 'FREIGHT',   typeName: 'Freight',   description: 'Vessel charter or freight contract',           sortOrder: 4, isActive: true },
    ],
  },
  {
    name: 'payment_method', label: 'Payment Methods', pk: 'paymentMethodId', group: 'Contract & Legal', order: 1,
    subGroup: 'Settlement', description: 'Valid mechanisms for settling payment obligations — wire transfers, LCs, bank guarantees, and netting. Drives payment term configuration and bank account type requirements.',
    rows: [
      { paymentMethodId: 1, typeCode: 'WIRE',             typeName: 'Wire Transfer',    description: 'Bank-to-bank SWIFT wire transfer',              sortOrder: 1, isActive: true },
      { paymentMethodId: 2, typeCode: 'LETTER_OF_CREDIT', typeName: 'Letter of Credit', description: 'Documentary LC — irrevocable or revolving',     sortOrder: 2, isActive: true },
      { paymentMethodId: 3, typeCode: 'BANK_GUARANTEE',   typeName: 'Bank Guarantee',   description: 'Performance or payment bank guarantee',         sortOrder: 3, isActive: true },
      { paymentMethodId: 4, typeCode: 'PREPAYMENT',       typeName: 'Prepayment',       description: 'Full or partial payment before delivery',       sortOrder: 4, isActive: true },
      { paymentMethodId: 5, typeCode: 'NETTING',          typeName: 'Netting',          description: 'Net settlement against offsetting obligations', sortOrder: 5, isActive: true },
      { paymentMethodId: 6, typeCode: 'CHEQUE',           typeName: 'Cheque',           description: 'Physical or electronic cheque payment',         sortOrder: 6, isActive: true },
      { paymentMethodId: 7, typeCode: 'OTHER',            typeName: 'Other',            description: 'Other payment mechanism — see notes',           sortOrder: 7, isActive: true },
    ],
  },
  {
    name: 'counterparty_type', label: 'Counterparty Types', pk: 'counterpartyTypeId', group: 'Counterparties & Agreements', order: 1,
    subGroup: 'Classification', description: 'Classifies entities you trade WITH as the legal counterparty. IDB brokers (ICAP, BGC, Tradition etc.) are NOT counterparties — manage them in the Brokers table. FCM and Prime Broker ARE counterparties: they are the legal entity on the trade ticket and require credit lines.',
    rows: [
      { counterpartyTypeId: 1,  typeCode: 'PRODUCER',     typeName: 'Producer',          description: 'Physical commodity producer — oil field operator, gas producer, miner, farmer.',                                                                                                                                                                                       sortOrder: 1,  isActive: true },
      { counterpartyTypeId: 2,  typeCode: 'CONSUMER',     typeName: 'Consumer',          description: 'End-user of physical commodity — refinery, industrial buyer, utility offtaker.',                                                                                                                                                                                        sortOrder: 2,  isActive: true },
      { counterpartyTypeId: 3,  typeCode: 'TRADER',       typeName: 'Trader',            description: 'Trading house or commodity merchant buying and selling as principal (Vitol, Trafigura, Glencore, Mercuria).',                                                                                                                                                            sortOrder: 3,  isActive: true },
      { counterpartyTypeId: 4,  typeCode: 'BANK',         typeName: 'Bank',              description: 'Financial institution — commodity bank, investment bank, or treasury counterparty (Goldman, JP Morgan, Citi).',                                                                                                                                                          sortOrder: 4,  isActive: true },
      { counterpartyTypeId: 10, typeCode: 'FCM',          typeName: 'FCM — Clearing Broker', description: 'Futures Commission Merchant: the legal counterparty on your exchange-listed trades. Executes and clears futures/options on your behalf and holds your margin account (Marex, Macquarie, StoneX). Also register in Brokers for fee tracking.',                    sortOrder: 5,  isActive: true },
      { counterpartyTypeId: 11, typeCode: 'PRIME',        typeName: 'Prime Broker',      description: 'Central counterparty across all venues under one ISDA/GMRA umbrella. Credit intermediation, cross-product netting, portfolio margining. IS always the legal counterparty on every trade. Also register in Brokers for fee tracking.',                                  sortOrder: 6,  isActive: true },
      { counterpartyTypeId: 6,  typeCode: 'EXCHANGE',     typeName: 'Exchange',          description: 'Licensed trading exchange or CCP (ICE, NYMEX, LME, EEX) — for direct member or intercompany accounts.',                                                                                                                                                                sortOrder: 7,  isActive: true },
      { counterpartyTypeId: 7,  typeCode: 'INTERCOMPANY', typeName: 'Intercompany',      description: 'Affiliate, subsidiary, or parent entity within your own corporate group. Subject to transfer pricing and internal netting rules.',                                                                                                                                        sortOrder: 8,  isActive: true },
      { counterpartyTypeId: 8,  typeCode: 'UTILITY',      typeName: 'Utility',           description: 'Regulated energy utility — gas or power distribution/transmission company, often an off-taker or anchor counterparty.',                                                                                                                                                  sortOrder: 9,  isActive: true },
      { counterpartyTypeId: 9,  typeCode: 'OTHER',        typeName: 'Other',             description: 'Any entity not fitting the above categories.',                                                                                                                                                                                                                           sortOrder: 10, isActive: true },
    ],
  },
  {
    name: 'kyc_status', label: 'KYC Statuses', pk: 'kycStatusId', group: 'Counterparties & Agreements', order: 2,
    subGroup: 'Compliance', description: 'Know Your Customer (KYC) lifecycle statuses applied to each counterparty. A counterparty must reach Approved status before trades can be booked against it.',
    rows: [
      { kycStatusId: 1, typeCode: 'PENDING',   typeName: 'Pending',   sortOrder: 1, isActive: true },
      { kycStatusId: 2, typeCode: 'APPROVED',  typeName: 'Approved',  sortOrder: 2, isActive: true },
      { kycStatusId: 3, typeCode: 'REVIEW',    typeName: 'Review',    sortOrder: 3, isActive: true },
      { kycStatusId: 4, typeCode: 'SUSPENDED', typeName: 'Suspended', sortOrder: 4, isActive: true },
      { kycStatusId: 5, typeCode: 'REJECTED',  typeName: 'Rejected',  sortOrder: 5, isActive: true },
    ],
  },
  {
    name: 'contact_role', label: 'Contact Roles', pk: 'contactRoleId', group: 'Organization & Users', order: 1,
    subGroup: 'People', description: 'Functional roles assigned to contacts on counterparties and legal entities — e.g. Trader, Back Office, Legal, Compliance. A contact can hold multiple roles against different entities.',
    rows: [
      { contactRoleId:  1, typeCode: 'TRADER',      typeName: 'Trader',      sortOrder:  1, isActive: true },
      { contactRoleId:  2, typeCode: 'BACK_OFFICE',  typeName: 'Back Office', sortOrder:  2, isActive: true },
      { contactRoleId:  3, typeCode: 'LEGAL',        typeName: 'Legal',       sortOrder:  3, isActive: true },
      { contactRoleId:  4, typeCode: 'COMPLIANCE',   typeName: 'Compliance',  sortOrder:  4, isActive: true },
      { contactRoleId:  5, typeCode: 'ACCOUNTS',     typeName: 'Accounts',    sortOrder:  5, isActive: true },
      { contactRoleId:  6, typeCode: 'PRIMARY',      typeName: 'Primary',     sortOrder:  6, isActive: true },
      { contactRoleId:  7, typeCode: 'OPERATIONS',   typeName: 'Operations',  sortOrder:  7, isActive: true },
      { contactRoleId:  8, typeCode: 'TECHNICAL',    typeName: 'Technical',   sortOrder:  8, isActive: true },
      { contactRoleId:  9, typeCode: 'CREDIT',       typeName: 'Credit',      sortOrder:  9, isActive: true },
      { contactRoleId: 10, typeCode: 'KYC',          typeName: 'KYC',         sortOrder: 10, isActive: true },
      { contactRoleId: 11, typeCode: 'OTHER',        typeName: 'Other',       sortOrder: 11, isActive: true },
    ],
  },
  {
    name: 'address_type', label: 'Address Types', pk: 'addressTypeId', group: 'Counterparties & Agreements', order: 6,
    subGroup: 'Address & Banking', description: 'Categorises the purpose of a physical address assigned to a counterparty, legal entity, or broker — e.g. Registered Office, Trading Address, Billing or Shipping location.',
    rows: [
      { addressTypeId: 1, typeCode: 'REGISTERED', typeName: 'Registered', sortOrder: 1, isActive: true },
      { addressTypeId: 2, typeCode: 'TRADING',    typeName: 'Trading',    sortOrder: 2, isActive: true },
      { addressTypeId: 3, typeCode: 'BILLING',    typeName: 'Billing',    sortOrder: 3, isActive: true },
      { addressTypeId: 4, typeCode: 'SHIPPING',   typeName: 'Shipping',   sortOrder: 4, isActive: true },
      { addressTypeId: 5, typeCode: 'DELIVERY',   typeName: 'Delivery',   sortOrder: 5, isActive: true },
      { addressTypeId: 6, typeCode: 'OTHER',      typeName: 'Other',      sortOrder: 6, isActive: true },
    ],
  },
  {
    name: 'bank_account_type', label: 'Bank Account Types', pk: 'bankAccountTypeId', group: 'Counterparties & Agreements', order: 7,
    subGroup: 'Address & Banking', description: 'Designates the purpose of a bank account on a counterparty — settlement, collateral posting, margin, fee, or escrow. Drives the account selection on payment instructions and confirms correct routing.',
    rows: [
      { bankAccountTypeId: 1, typeCode: 'SETTLEMENT', typeName: 'Settlement', sortOrder: 1, isActive: true },
      { bankAccountTypeId: 2, typeCode: 'COLLATERAL', typeName: 'Collateral', sortOrder: 2, isActive: true },
      { bankAccountTypeId: 3, typeCode: 'FEE',        typeName: 'Fee',        sortOrder: 3, isActive: true },
      { bankAccountTypeId: 4, typeCode: 'MARGIN',     typeName: 'Margin',     sortOrder: 4, isActive: true },
      { bankAccountTypeId: 5, typeCode: 'GENERAL',    typeName: 'General',    sortOrder: 5, isActive: true },
      { bankAccountTypeId: 6, typeCode: 'ESCROW',     typeName: 'Escrow',     sortOrder: 6, isActive: true },
    ],
  },
  {
    name: 'commodity_type', label: 'Commodity Types', pk: 'commodityTypeId', group: 'Products & Markets', order: 9,
    subGroup: 'Classification', description: 'Sector classification reused across desks, books, GL accounts, periods, and other tables — pulled out of the generic Lookup Values system (V85) into its own dedicated table.',
    rows: [
      { commodityTypeId: 1,  typeCode: 'OIL',           typeName: 'Oil',             description: 'Crude oil and refined petroleum products.',        sortOrder: 1,  isActive: true },
      { commodityTypeId: 2,  typeCode: 'GAS',           typeName: 'Gas',             description: 'Pipeline natural gas.',                            sortOrder: 2,  isActive: true },
      { commodityTypeId: 3,  typeCode: 'POWER',         typeName: 'Power',           description: 'Wholesale electricity.',                           sortOrder: 3,  isActive: true },
      { commodityTypeId: 4,  typeCode: 'LNG',           typeName: 'LNG',             description: 'Liquefied natural gas.',                           sortOrder: 4,  isActive: true },
      { commodityTypeId: 5,  typeCode: 'AGRICULTURAL',  typeName: 'Agricultural',    description: 'Grains, oilseeds, and soft commodities.',          sortOrder: 5,  isActive: true },
      { commodityTypeId: 6,  typeCode: 'METALS',        typeName: 'Metals',          description: 'Base and precious metals.',                        sortOrder: 6,  isActive: true },
      { commodityTypeId: 7,  typeCode: 'FREIGHT',       typeName: 'Freight',         description: 'Vessel charter and freight contracts.',            sortOrder: 7,  isActive: true },
      { commodityTypeId: 8,  typeCode: 'RINS',          typeName: 'RINs',            description: 'Renewable Identification Numbers (RFS).',          sortOrder: 8,  isActive: true },
      { commodityTypeId: 9,  typeCode: 'ENVIRONMENTAL', typeName: 'Environmental',   description: 'Emissions, carbon, and environmental products.',   sortOrder: 9,  isActive: true },
      { commodityTypeId: 10, typeCode: 'MULTI',         typeName: 'Multi-Commodity', description: 'Spans more than one commodity sector.',            sortOrder: 10, isActive: true },
      { commodityTypeId: 11, typeCode: 'OTHER',         typeName: 'Other',           description: 'Sector not covered by the classifications above.', sortOrder: 11, isActive: true },
    ],
  },
  {
    name: 'book_type', label: 'Book Types', pk: 'bookTypeId', group: 'Organization & Users', order: 2,
    subGroup: 'Trading', description: 'Classifies trading books by mandate — proprietary trading, hedging, arbitrage, client facilitation, or risk management. Each book type carries distinct P&L attribution and risk limit rules.',
    rows: [
      { bookTypeId: 1, typeCode: 'TRADING',   typeName: 'Trading',   description: 'Proprietary trading book for physical and financial positions',  sortOrder: 1, isActive: true },
      { bookTypeId: 2, typeCode: 'HEDGING',   typeName: 'Hedging',   description: 'Risk-reduction book offsetting physical exposure',               sortOrder: 2, isActive: true },
      { bookTypeId: 3, typeCode: 'ARBITRAGE', typeName: 'Arbitrage', description: 'Book capturing price differentials across markets or locations', sortOrder: 3, isActive: true },
      { bookTypeId: 4, typeCode: 'PROP',      typeName: 'Prop',      description: 'Proprietary book with a directional market view mandate',        sortOrder: 4, isActive: true },
      { bookTypeId: 5, typeCode: 'CLIENT',    typeName: 'Client',    description: 'Third-party client facilitation book',                           sortOrder: 5, isActive: true },
      { bookTypeId: 6, typeCode: 'RISK_MGMT', typeName: 'Risk Mgmt', description: 'Risk management and internal hedging book',                     sortOrder: 6, isActive: true },
    ],
  },
  {
    name: 'legal_entity_type', label: 'Legal Entity Types', pk: 'legalEntityTypeId', group: 'Organization & Users', order: 3,
    subGroup: 'Entity', description: 'Legal form of each internal entity registered in the system — trading company, subsidiary, branch, holding company, or broker. Determines regulatory scope and guarantor eligibility.',
    rows: [
      { legalEntityTypeId: 1, typeCode: 'TRADING_COMPANY', typeName: 'Trading Company', description: 'Standalone commodity trading company',             sortOrder: 1, isActive: true },
      { legalEntityTypeId: 2, typeCode: 'SUBSIDIARY',      typeName: 'Subsidiary',      description: 'Wholly or majority-owned subsidiary',              sortOrder: 2, isActive: true },
      { legalEntityTypeId: 3, typeCode: 'BRANCH',          typeName: 'Branch',          description: 'Registered branch office of a parent entity',      sortOrder: 3, isActive: true },
      { legalEntityTypeId: 4, typeCode: 'HOLDING',         typeName: 'Holding',         description: 'Non-trading holding company owning subsidiaries',  sortOrder: 4, isActive: true },
      { legalEntityTypeId: 5, typeCode: 'BROKER',          typeName: 'Broker',          description: 'Intermediary entity with brokerage authorisation', sortOrder: 5, isActive: true },
    ],
  },
  {
    name: 'settlement_type', label: 'Settlement Types', pk: 'settlementTypeId', group: 'Products & Markets', order: 1,
    subGroup: 'Settlement', description: 'How a trade obligation is ultimately settled — physical commodity delivery, cash settlement against an index, options exercise, swap, or netting against an opposing position.',
    rows: [
      { settlementTypeId: 1, typeCode: 'PHYSICAL',  typeName: 'Physical',  description: 'Commodity physically delivered to buyer',                sortOrder: 1, isActive: true },
      { settlementTypeId: 2, typeCode: 'FINANCIAL', typeName: 'Financial', description: 'Cash settlement against index — no physical delivery',   sortOrder: 2, isActive: true },
      { settlementTypeId: 3, typeCode: 'OPTIONS',   typeName: 'Options',   description: 'Options contract — right but not obligation to deliver', sortOrder: 3, isActive: true },
      { settlementTypeId: 4, typeCode: 'SWAP',      typeName: 'Swap',      description: 'Fixed-for-floating price swap settled in cash',          sortOrder: 4, isActive: true },
      { settlementTypeId: 5, typeCode: 'NETTED',    typeName: 'Netted',    description: 'Offset against an opposing position before settlement',  sortOrder: 5, isActive: true },
    ],
  },
  {
    name: 'storage_facility_type', label: 'Storage Facility Types', pk: 'storageFacilityTypeId', group: 'Logistics & Delivery', order: 1,
    subGroup: 'Facilities', description: 'Classifies physical storage facilities — tanks, warehouses, LNG terminals, grain silos, refineries, underground caverns, and vaults. Used on logistics legs and inventory positions.',
    rows: [
      { storageFacilityTypeId: 1,  typeCode: 'TANK_FARM',            typeName: 'Tank Farm',            description: 'Fixed or floating-roof above-ground tanks (crude, refined products)',   sortOrder: 1,  isActive: true },
      { storageFacilityTypeId: 2,  typeCode: 'WAREHOUSE',            typeName: 'Warehouse',            description: 'Dry bulk or packaged goods warehouse',                                   sortOrder: 2,  isActive: true },
      { storageFacilityTypeId: 3,  typeCode: 'LNG_TANK',             typeName: 'LNG Tank',             description: 'Cryogenic LNG storage tank at an import/export terminal',                sortOrder: 3,  isActive: true },
      { storageFacilityTypeId: 4,  typeCode: 'SILO',                 typeName: 'Silo',                 description: 'Grain or dry-bulk silo / elevator',                                      sortOrder: 4,  isActive: true },
      { storageFacilityTypeId: 5,  typeCode: 'REFINERY',             typeName: 'Refinery',             description: 'Crude oil refinery with intermediate storage',                           sortOrder: 5,  isActive: true },
      { storageFacilityTypeId: 6,  typeCode: 'SALT_CAVERN',          typeName: 'Salt Cavern',          description: 'Underground salt cavern for crude, gas, or LPG storage',                 sortOrder: 6,  isActive: true },
      { storageFacilityTypeId: 7,  typeCode: 'VAULT',                typeName: 'Vault',                description: 'Secure vault for metals (LME-approved, precious)',                       sortOrder: 7,  isActive: true },
      { storageFacilityTypeId: 8,  typeCode: 'OTHER',                typeName: 'Other',                description: 'Facility type not covered by standard classifications',                  sortOrder: 8,  isActive: true },
      { storageFacilityTypeId: 9,  typeCode: 'FLOATING_STORAGE',     typeName: 'Floating Storage',     description: 'Vessel used as offshore storage unit (FSU)',                             sortOrder: 9,  isActive: true },
      { storageFacilityTypeId: 10, typeCode: 'GAS_STORAGE',          typeName: 'Gas Storage',          description: 'Depleted reservoir or aquifer underground gas storage',                  sortOrder: 10, isActive: true },
      { storageFacilityTypeId: 11, typeCode: 'PIPELINE_LINEFILL',    typeName: 'Pipeline Linefill',    description: 'Product held in an active pipeline as operational stock',                sortOrder: 11, isActive: true },
      { storageFacilityTypeId: 12, typeCode: 'REFRIGERATED_STORAGE', typeName: 'Refrigerated Storage', description: 'Pressure/refrigerated storage for LPG, ammonia, ethylene',               sortOrder: 12, isActive: true },
      { storageFacilityTypeId: 13, typeCode: 'CHEMICAL_TANK',        typeName: 'Chemical Tank',        description: 'Specialised tank for petrochemicals, solvents, acids',                   sortOrder: 13, isActive: true },
      { storageFacilityTypeId: 14, typeCode: 'FSRU',                 typeName: 'FSRU',                 description: 'Floating Storage and Regasification Unit',                               sortOrder: 14, isActive: true },
    ],
  },
  {
    name: 'netting_agreement_type', label: 'Netting Agreement Types', pk: 'nettingAgreementTypeId', group: 'Counterparties & Agreements', order: 2,
    subGroup: 'Legal', description: 'Industry-standard master agreements that govern the right to net outstanding obligations against a single counterparty — ISDA, EFET, GTMA, and NAESB. Required for bilateral netting under Basel III.',
    rows: [
      { nettingAgreementTypeId: 1, typeCode: 'ISDA_2002', typeName: 'ISDA 2002 MA', description: 'International Swaps & Derivatives Assoc. 2002 Master Agreement', sortOrder: 1, isActive: true },
      { nettingAgreementTypeId: 2, typeCode: 'ISDA_1992', typeName: 'ISDA 1992 MA', description: 'ISDA 1992 Master Agreement (predecessor to 2002 MA)',             sortOrder: 2, isActive: true },
      { nettingAgreementTypeId: 3, typeCode: 'EFET',      typeName: 'EFET GTMA',    description: 'European Federation of Energy Traders General Agreement',         sortOrder: 3, isActive: true },
      { nettingAgreementTypeId: 4, typeCode: 'GTMA',      typeName: 'GTMA',         description: 'Gas & Electricity Markets Trading Master Agreement',              sortOrder: 4, isActive: true },
      { nettingAgreementTypeId: 5, typeCode: 'NAESB',     typeName: 'NAESB',        description: 'North American Energy Standards Board Base Contract',            sortOrder: 5, isActive: true },
      { nettingAgreementTypeId: 6, typeCode: 'OTHER',     typeName: 'Other',        description: 'Bespoke or non-standard netting framework',                      sortOrder: 6, isActive: true },
    ],
  },
  {
    name: 'tax_type', label: 'Tax Types', pk: 'taxTypeId', group: 'Credit & Collateral', order: 8,
    subGroup: 'Fiscal', description: 'Tax and business registration identifier types used across counterparty and legal entity records — VAT, GST, EIN, UTR, TIN, ABN, SIREN, and others. Required for invoice generation and regulatory reporting.',
    rows: [
      { taxTypeId: 1, typeCode: 'VAT',   typeName: 'VAT',   description: 'Value Added Tax (EU, UK, and most jurisdictions)',      sortOrder: 1, isActive: true },
      { taxTypeId: 2, typeCode: 'GST',   typeName: 'GST',   description: 'Goods & Services Tax (Australia, Canada, India, etc.)', sortOrder: 2, isActive: true },
      { taxTypeId: 3, typeCode: 'EIN',   typeName: 'EIN',   description: 'Employer Identification Number (USA federal tax ID)',    sortOrder: 3, isActive: true },
      { taxTypeId: 4, typeCode: 'UTR',   typeName: 'UTR',   description: 'Unique Taxpayer Reference (UK HMRC)',                   sortOrder: 4, isActive: true },
      { taxTypeId: 5, typeCode: 'TIN',   typeName: 'TIN',   description: 'Taxpayer Identification Number (generic)',              sortOrder: 5, isActive: true },
      { taxTypeId: 6, typeCode: 'ABN',   typeName: 'ABN',   description: 'Australian Business Number',                           sortOrder: 6, isActive: true },
      { taxTypeId: 7, typeCode: 'SIREN', typeName: 'SIREN', description: 'French company identifier (Système SIRENE)',            sortOrder: 7, isActive: true },
      { taxTypeId: 8, typeCode: 'KVKK',  typeName: 'KVKK',  description: 'Turkish trade register number',                        sortOrder: 8, isActive: true },
      { taxTypeId: 9, typeCode: 'OTHER', typeName: 'Other', description: 'Tax registration type not covered by standard codes',   sortOrder: 9, isActive: true },
    ],
  },
  // ── Additional simple classification tables (non-V17, same shape) ──────────
  {
    name: 'mot_type', label: 'Modes of Transport', pk: 'motTypeId', group: 'Logistics & Delivery', order: 2,
    subGroup: 'Transport', description: 'Physical transport modes used to move commodity from origin to destination — sea vessel, pipeline, road tanker, rail car, barge, or air freight. Drives logistics leg type, Incoterm compatibility, and inspection rules.',
    rows: [
      { motTypeId: 1, typeCode: 'SEA',         typeName: 'Sea',         description: 'Ocean vessel — tanker, bulker, or LNG carrier',                         sortOrder: 1, isActive: true },
      { motTypeId: 2, typeCode: 'PIPELINE',    typeName: 'Pipeline',    description: 'Gas or liquid via pipeline infrastructure',                               sortOrder: 2, isActive: true },
      { motTypeId: 3, typeCode: 'ROAD',        typeName: 'Road',        description: 'Road tanker or bulk truck transport',                                     sortOrder: 3, isActive: true },
      { motTypeId: 4, typeCode: 'RAIL',        typeName: 'Rail',        description: 'Railway tank car or bulk rail wagon',                                     sortOrder: 4, isActive: true },
      { motTypeId: 5, typeCode: 'BARGE',       typeName: 'Barge',       description: 'River or inland waterway barge transport',                                sortOrder: 5, isActive: true },
      { motTypeId: 6, typeCode: 'AIR',         typeName: 'Air',         description: 'Air freight — metals, specialty chemicals, time-sensitive',               sortOrder: 6, isActive: true },
      { motTypeId: 7, typeCode: 'CERTIFICATE', typeName: 'Certificate', description: 'No physical transport — used for RINs, carbon credits, RECs, and all certificate instruments that transfer electronically via registry systems such as EPA EMTS, EUTL, or OFGEM', sortOrder: 7, isActive: true },
    ],
  },
  {
    name: 'location_type', label: 'Location Types', pk: 'locationTypeId', group: 'Logistics & Delivery', order: 3,
    subGroup: 'Locations', description: 'Types of delivery and trading locations used on trades and logistics legs — marine ports, gas hubs, LNG terminals, pipeline hubs, power grid nodes, storage facilities, and refineries.',
    rows: [
      { locationTypeId: 1, typeCode: 'PORT',             typeName: 'Port',             description: 'Marine loading or discharge port',                        sortOrder: 1, isActive: true },
      { locationTypeId: 2, typeCode: 'GAS_HUB',          typeName: 'Gas Hub',          description: 'Gas trading hub (NBP, TTF, Zeebrugge, NCG)',              sortOrder: 2, isActive: true },
      { locationTypeId: 3, typeCode: 'LNG_TERMINAL',     typeName: 'LNG Terminal',     description: 'Liquefaction or regasification terminal',                 sortOrder: 3, isActive: true },
      { locationTypeId: 4, typeCode: 'PIPELINE_HUB',     typeName: 'Pipeline Hub',     description: 'Pipeline interconnection or custody transfer station',    sortOrder: 4, isActive: true },
      { locationTypeId: 5, typeCode: 'GRID_NODE',        typeName: 'Grid Node',        description: 'Power grid delivery or locational marginal pricing node', sortOrder: 5, isActive: true },
      { locationTypeId: 6, typeCode: 'STORAGE_FACILITY', typeName: 'Storage Facility', description: 'Tank farm, cavern, warehouse, or LNG store',              sortOrder: 6, isActive: true },
      { locationTypeId: 7, typeCode: 'REFINERY',         typeName: 'Refinery',         description: 'Crude oil refinery intake or product offtake gate',       sortOrder: 7, isActive: true },
    ],
  },
  {
    name: 'pricing_type', label: 'Pricing Types', pk: 'pricingTypeId', group: 'Pricing & Rates', order: 9,
    subGroup: 'Pricing', description: 'Determines how the trade price is calculated — fixed at trade date, floating benchmark index, formula-based, differential spread, or Asian average over a pricing period.',
    rows: [
      { pricingTypeId: 1, typeCode: 'FIXED',          typeName: 'Fixed',                      description: 'Firm price agreed at trade date, no market linkage',                                                          sortOrder: 1, isActive: true },
      { pricingTypeId: 2, typeCode: 'FLOATING',       typeName: 'Floating',                   description: 'Price determined by a published benchmark index',                                                               sortOrder: 2, isActive: true },
      { pricingTypeId: 3, typeCode: 'FORMULA',        typeName: 'Formula',                    description: 'Price derived from a formula applied to one or more indices',                                                   sortOrder: 3, isActive: true },
      { pricingTypeId: 4, typeCode: 'DIFFERENTIAL',   typeName: 'Differential',               description: 'Index price plus or minus a fixed spread',                                                                     sortOrder: 4, isActive: true },
      { pricingTypeId: 5, typeCode: 'AVERAGE',        typeName: 'Average',                    description: 'Asian average of index over a defined pricing period',                                                         sortOrder: 5, isActive: true },
      { pricingTypeId: 6, typeCode: 'TAS',            typeName: 'Trade at Settlement (TAS)',  description: 'Price = exchange daily settlement ± differential in ticks. Price unknown at execution; locked at exchange close.',  sortOrder: 6, isActive: true },
      { pricingTypeId: 7, typeCode: 'OPTION_STRIKE',  typeName: 'Option Strike',              description: 'Price determined by the strike price of an option contract at exercise.',                                      sortOrder: 7, isActive: true },
      { pricingTypeId: 8, typeCode: 'PLATTS_WINDOW',  typeName: 'Platts MOC Window',          description: 'Price assessed within the Platts Market on Close (MOC) submission window.',                                    sortOrder: 8, isActive: true },
      { pricingTypeId: 9, typeCode: 'BALMO',          typeName: 'Balance of Month (BALMO)',   description: 'Exchange-cleared partial-month average price swap. Pricing window = booking date → last business day of contract month. Float = arithmetic average of daily front-month futures settlements.', sortOrder: 9, isActive: true },
    ],
  },
  {
    name: 'inspection_type', label: 'Inspection Types', pk: 'inspectionTypeId', group: 'Logistics & Delivery', order: 4,
    subGroup: 'Inspection', description: 'Types of independent cargo and vessel inspections that can be arranged for a shipment — quantity survey, quality survey, tank calibration, ullage, and draught surveys.',
    rows: [
      { inspectionTypeId: 1, typeCode: 'QUANTITY',         typeName: 'Quantity Survey',    description: 'Independent inspector for cargo quantity / weight survey',   sortOrder: 1, isActive: true },
      { inspectionTypeId: 2, typeCode: 'QUALITY',          typeName: 'Quality Survey',     description: 'Q88 or equivalent product quality and grade verification',   sortOrder: 2, isActive: true },
      { inspectionTypeId: 3, typeCode: 'TANK_CALIBRATION', typeName: 'Tank Calibration',   description: 'Shore tank gauge calibration and capacity certificate',       sortOrder: 3, isActive: true },
      { inspectionTypeId: 4, typeCode: 'ULLAGE',           typeName: 'Ullage Survey',      description: 'Vessel or shore tank ullage and temperature measurement',    sortOrder: 4, isActive: true },
      { inspectionTypeId: 5, typeCode: 'DRAUGHT',          typeName: 'Draught Survey',     description: 'Vessel displacement / dead weight tonnage survey',           sortOrder: 5, isActive: true },
      { inspectionTypeId: 6, typeCode: 'INDEPENDENT',      typeName: 'Independent Survey', description: 'Jointly appointed third-party independent cargo survey',     sortOrder: 6, isActive: true },
    ],
  },
  {
    name: 'transport_document_type', label: 'Transport Document Types', pk: 'transportDocumentTypeId', group: 'Contract & Legal', order: 3,
    subGroup: 'Documentation', description: 'Title and consignment documents produced when commodity is moved — Bills of Lading, CMR/CIM consignment notes, air waybills, pipeline batch tickets, and delivery notes.',
    rows: [
      { transportDocumentTypeId: 1, typeCode: 'BOL',                   typeName: 'Bill of Lading',          description: 'Maritime bill of lading — title document for sea cargo',          sortOrder: 1, isActive: true },
      { transportDocumentTypeId: 2, typeCode: 'CMR',                   typeName: 'CMR Consignment Note',    description: 'Road transport consignment note (CMR Convention)',                sortOrder: 2, isActive: true },
      { transportDocumentTypeId: 3, typeCode: 'CIM',                   typeName: 'CIM Rail Consignment',    description: 'Rail transport consignment note (COTIF-CIM Convention)',          sortOrder: 3, isActive: true },
      { transportDocumentTypeId: 4, typeCode: 'AWB',                   typeName: 'Air Waybill',             description: 'Air freight document (IATA AWB)',                                sortOrder: 4, isActive: true },
      { transportDocumentTypeId: 5, typeCode: 'PIPELINE_BATCH_TICKET', typeName: 'Pipeline Batch Ticket',  description: 'Pipeline quality/quantity nomination and batch ticket',           sortOrder: 5, isActive: true },
      { transportDocumentTypeId: 6, typeCode: 'TANK_CAR_CERT',         typeName: 'Tank Car Certificate',   description: 'Railcar or ISO tank container certificate',                     sortOrder: 6, isActive: true },
      { transportDocumentTypeId: 7, typeCode: 'DELIVERY_NOTE',         typeName: 'Delivery Note',          description: 'Road or rail delivery confirmation note',                        sortOrder: 7, isActive: true },
    ],
  },
  // transmission_right_type moved out of this simple-lookup list (V65) — the
  // real V12 backend schema is richer than the {code,name,description,sortOrder}
  // shape (FK to balancing_authority, two enum columns), and this entry's old
  // seed data (FTR/PTR/ATR) didn't even match the real seeded codes (FTR/CRR/
  // TCC) — see the full TABLE_DEFS entry further down instead.
  // ── Payment Term calculation lookups ──────────────────────────────────────
  {
    name: 'base_date_event_type', label: 'Base Date Event Types', pk: 'baseDateEventTypeId', group: 'Contract & Legal', order: 4,
    subGroup: 'Payment Terms', description: 'The trade event that anchors payment date calculation — invoice date, Bill of Lading, end of delivery month, pricing date, etc. Referenced by Payment Terms to drive the payment date formula. Each commodity type typically uses a different anchor event.',
    rows: [
      { baseDateEventTypeId:  1, typeCode: 'INVOICE_DATE',            typeName: 'Invoice Date',              description: 'Payment date calculated from the date the invoice is issued. Standard for most commercial trades.',                                                  applicableCommodity: 'All commodities',                    sortOrder:  10, isActive: true },
      { baseDateEventTypeId:  2, typeCode: 'TRADE_DATE',              typeName: 'Trade Date',                description: 'Payment date anchored to the date the trade was executed. Common for financial instruments and short-dated settlements.',                          applicableCommodity: 'Financial, Metals',                  sortOrder:  20, isActive: true },
      { baseDateEventTypeId:  3, typeCode: 'DELIVERY_DATE',           typeName: 'Delivery Date',             description: 'Payment date calculated from the date of physical delivery or transfer of title.',                                                                   applicableCommodity: 'Oil, Agricultural, Metals',          sortOrder:  30, isActive: true },
      { baseDateEventTypeId:  4, typeCode: 'END_OF_DELIVERY_MONTH',   typeName: 'End of Delivery Month',     description: 'Payment date anchored to the last calendar day of the delivery period month. Standard for pipeline gas and power contracts (e.g. M+20 or M+1 DOM 20).', applicableCommodity: 'Gas, Power',                        sortOrder:  40, isActive: true },
      { baseDateEventTypeId:  5, typeCode: 'BL_DATE',                 typeName: 'Bill of Lading Date',       description: 'Payment date anchored to the date the Bill of Lading is issued. Dominant for crude oil and LNG cargo trades.',                                       applicableCommodity: 'Crude Oil, LNG, Refined Products',  sortOrder:  50, isActive: true },
      { baseDateEventTypeId:  6, typeCode: 'NOR_TENDERED',            typeName: 'NOR Tendered',              description: 'Payment date anchored to the date/time the vessel tenders Notice of Readiness at the discharge port.',                                               applicableCommodity: 'Crude Oil, LNG, Tanker',            sortOrder:  60, isActive: true },
      { baseDateEventTypeId:  7, typeCode: 'COMPLETION_OF_DISCHARGE', typeName: 'Completion of Discharge',   description: 'Payment date anchored to the date cargo offloading is fully completed at the discharge terminal.',                                                    applicableCommodity: 'Crude Oil, LNG, Product Tankers',   sortOrder:  70, isActive: true },
      { baseDateEventTypeId:  8, typeCode: 'OUTTURN_DATE',            typeName: 'Outturn Date',              description: 'Payment date anchored to the pipeline outturn confirmation date — when measured volume is certified.',                                                applicableCommodity: 'Pipeline Gas, Crude Oil',           sortOrder:  80, isActive: true },
      { baseDateEventTypeId:  9, typeCode: 'PRICING_DATE',            typeName: 'Pricing / Prompt Date',     description: 'Payment date anchored to the pricing or LME prompt date. Standard for exchange-traded metals (LME T+2 business days).',                              applicableCommodity: 'Metals, Exchange-Traded',           sortOrder:  90, isActive: true },
      { baseDateEventTypeId: 10, typeCode: 'METER_READ_DATE',         typeName: 'Meter Read Date',           description: 'Payment date anchored to the date of metered quantity confirmation. Used in regulated gas and power supply contracts.',                              applicableCommodity: 'Gas, Power, Utilities',             sortOrder: 100, isActive: true },
      { baseDateEventTypeId: 11, typeCode: 'SETTLEMENT_DATE',         typeName: 'Settlement Date',           description: 'Payment date anchored to the financial settlement date of the underlying instrument. Used for cleared swaps and futures.',                          applicableCommodity: 'Financial Swaps, Futures, Cleared', sortOrder: 110, isActive: true },
    ],
  },
  {
    name: 'business_day_convention_type', label: 'Business Day Conventions', pk: 'bdcTypeId', group: 'Contract & Legal', order: 5,
    subGroup: 'Payment Terms', description: 'Defines how to roll a calculated payment date when it falls on a weekend or public holiday. Modified Following is the market standard for most commodity trades. The convention is applied using the associated holiday calendar.',
    rows: [
      { bdcTypeId: 1, typeCode: 'UNADJUSTED',    typeName: 'Unadjusted',           description: 'No adjustment — payment falls on the calculated date even if it is a holiday or weekend. Rare in practice.',                                                                                  sortOrder: 10, isActive: true },
      { bdcTypeId: 2, typeCode: 'FOLLOWING',     typeName: 'Following',             description: 'If the calculated date is a non-business day, roll forward to the next business day. May cross into the next calendar month.',                                                                sortOrder: 20, isActive: true },
      { bdcTypeId: 3, typeCode: 'MOD_FOLLOWING', typeName: 'Modified Following',    description: 'Roll forward to the next business day unless it would cross into the next calendar month, in which case roll backward. The most common convention in commodity trading (ISDA standard).',     sortOrder: 30, isActive: true },
      { bdcTypeId: 4, typeCode: 'PRECEDING',     typeName: 'Preceding',             description: 'If the calculated date is a non-business day, roll backward to the previous business day.',                                                                                                    sortOrder: 40, isActive: true },
      { bdcTypeId: 5, typeCode: 'MOD_PRECEDING', typeName: 'Modified Preceding',    description: 'Roll backward to the previous business day unless it would cross into the prior calendar month, in which case roll forward.',                                                                  sortOrder: 50, isActive: true },
    ],
  },
  // ── Trade — commodity-detail dropdowns ────────────────────────────────────────
  // crude_grade_type removed — was a pure mock duplicate of dbo.product
  // (BRENT-CRUDE/WTI-CRUDE/etc. already exist there as real products, not a
  // separate grade lookup). gas_day_type removed — was already correctly
  // wired as dbo.period.gas_day_type_lookup_id -> lookup_value since V57;
  // its rows now live in the lookup_value seed above, not here.
  {
    name: 'metal_shape', label: 'Metal Physical Forms', pk: 'metalShapeId', group: 'Products & Markets', order: 6,
    subGroup: 'Metals Details', description: 'Physical form in which a metal is traded and delivered — the real CHECK values on dbo.metal_brand.metal_form (V68), now a dedicated FK table (V84).',
    rows: [
      { metalShapeId: 1,  typeCode: 'CATHODE',            typeName: 'Cathode',              description: 'Standard refined metal cathode — copper, zinc.', sortOrder: 1,  isActive: true },
      { metalShapeId: 2,  typeCode: 'CATHODE_FULL_PLATE',  typeName: 'Cathode (Full Plate)', description: 'Full-plate cathode form, as distinct from cut cathode.', sortOrder: 2,  isActive: true },
      { metalShapeId: 3,  typeCode: 'INGOT',               typeName: 'Ingot',                description: 'Cast metal ingot — aluminium, lead, zinc, tin.', sortOrder: 3,  isActive: true },
      { metalShapeId: 4,  typeCode: 'WIRE_ROD',            typeName: 'Wire Rod',             description: 'Drawn wire rod — copper, aluminium.', sortOrder: 4,  isActive: true },
      { metalShapeId: 5,  typeCode: 'PIG',                 typeName: 'Pig',                  description: 'Pig-cast metal form.', sortOrder: 5,  isActive: true },
      { metalShapeId: 6,  typeCode: 'BAR',                 typeName: 'Bar',                  description: 'Bar-cast metal form.', sortOrder: 6,  isActive: true },
      { metalShapeId: 7,  typeCode: 'GRANULES',            typeName: 'Granules',             description: 'Granulated metal form.', sortOrder: 7,  isActive: true },
      { metalShapeId: 8,  typeCode: 'BRIQUETTE',           typeName: 'Briquette',            description: 'Compressed briquette form.', sortOrder: 8,  isActive: true },
      { metalShapeId: 9,  typeCode: 'SLAB',                typeName: 'Slab',                 description: 'Slab-cast metal form — aluminium, steel.', sortOrder: 9,  isActive: true },
      { metalShapeId: 10, typeCode: 'OTHER',               typeName: 'Other',                description: 'Physical form not covered by the standard classifications above.', sortOrder: 10, isActive: true },
    ],
  },
  {
    name: 'nomination_type', label: 'Gas Nomination Types', pk: 'nominationTypeId', group: 'Products & Markets', order: 8,
    subGroup: 'Gas Details', description: 'Defines the firm vs. interruptible nature of a gas nomination — i.e. whether the shipper/supplier is guaranteed to deliver the nominated quantity or may curtail with notice.',
    rows: [
      { nominationTypeId: 1, typeCode: 'FIRM',          typeName: 'Firm',          description: 'Shipper guarantees delivery of the full nominated quantity. Higher price; used for regulated supply obligations and industrial customers.', sortOrder: 10, isActive: true },
      { nominationTypeId: 2, typeCode: 'INTERRUPTIBLE', typeName: 'Interruptible', description: 'Supplier may curtail delivery with contractual notice (typically 24–48h). Lower tariff; suitable for flexible industrial users with backup fuel capability.', sortOrder: 20, isActive: true },
      { nominationTypeId: 3, typeCode: 'RENOMINATABLE', typeName: 'Renominatable', description: 'Firm delivery but buyer may re-nominate quantity within agreed windows during the gas day. Flexible gas for balancing.', sortOrder: 30, isActive: true },
    ],
  },
  // lng_price_basis removed — was a pure mock duplicate of dbo.price_index
  // (JCC/HH/TTF/NBP are benchmark indices, the same concept price_index
  // already models via index_code — DATED_BRENT/WTI/TTF are already real
  // rows there; an LNG deal referencing JCC or HH is just another
  // price_index row, not a distinct linkage concept needing its own table).
  // power_load_type removed — was a pure mock duplicate of dbo.load_shape_template
  // (BASELOAD/PEAK/OFFPEAK/CUSTOM already exist there, and
  // power_product_detail.default_load_shape_id already FKs to it).
  // ── Credit & Risk classification tables ───────────────────────────────────
  {
    name: 'margin_agreement_type', label: 'Margin Agreement Types', pk: 'marginAgreementTypeId', group: 'Credit & Collateral', order: 1,
    subGroup: 'Margin & Collateral', description: 'Types of credit support annex (CSA) and pledge arrangements governing how collateral is exchanged between two counterparties. CSA_BILATERAL = mutual obligation. CSA_ONE_WAY = only one party posts. PLEDGE = title transfer collateral. CTA = collateral transfer agreement.',
    rows: [
      { marginAgreementTypeId: 1, typeCode: 'CSA_BILATERAL',   typeName: 'CSA Bilateral',        description: 'Both parties can be required to post collateral depending on MTM direction. Standard under ISDA 2002 Credit Support Annex (English law).', sortOrder: 10, isActive: true },
      { marginAgreementTypeId: 2, typeCode: 'CSA_ONE_WAY_IN',  typeName: 'CSA One-Way (We Receive)', description: 'Only the counterparty posts collateral to us — we are never required to post. Used when counterparty credit quality is significantly lower.', sortOrder: 20, isActive: true },
      { marginAgreementTypeId: 3, typeCode: 'CSA_ONE_WAY_OUT', typeName: 'CSA One-Way (We Post)', description: 'Only we post collateral to the counterparty — they are never required to post. Typically required by highly rated bank counterparties or CCPs.', sortOrder: 30, isActive: true },
      { marginAgreementTypeId: 4, typeCode: 'PLEDGE',          typeName: 'Pledge Agreement',      description: 'Title-transfer collateral arrangement (New York law). Collateral ownership transfers to the receiving party; no rehypothecation restrictions.', sortOrder: 40, isActive: true },
      { marginAgreementTypeId: 5, typeCode: 'CTA',             typeName: 'CTA (Collateral Transfer)', description: 'Collateral Transfer Agreement — typically paired with an ISDA Master to govern initial margin posting under UMR (Uncleared Margin Rules) from 2016 onwards.', sortOrder: 50, isActive: true },
    ],
  },
  {
    name: 'valuation_frequency_type', label: 'Valuation Frequencies', pk: 'valuationFrequencyTypeId', group: 'Credit & Collateral', order: 2,
    subGroup: 'Margin & Collateral', description: 'How often MTM valuation is performed and compared against the CSA threshold to determine whether a margin call must be issued. Daily is the market standard under ISDA and EMIR clearing rules.',
    rows: [
      { valuationFrequencyTypeId: 1, typeCode: 'DAILY',   typeName: 'Daily',   description: 'MTM valuation performed every business day. Margin calls issued next business day if call amount exceeds MTA. Standard under ISDA 2002 and EMIR.', sortOrder: 10, isActive: true },
      { valuationFrequencyTypeId: 2, typeCode: 'WEEKLY',  typeName: 'Weekly',  description: 'MTM valuation performed once per week (typically Friday). Used in some bilateral agreements for less liquid portfolios.', sortOrder: 20, isActive: true },
      { valuationFrequencyTypeId: 3, typeCode: 'MONTHLY', typeName: 'Monthly', description: 'MTM valuation performed monthly. Used for lower-volume or long-dated contracts where daily margining is operationally impractical.', sortOrder: 30, isActive: true },
    ],
  },
  {
    name: 'governing_law_type', label: 'CSA Governing Laws', pk: 'governingLawTypeId', group: 'Credit & Collateral', order: 3,
    subGroup: 'Margin & Collateral', description: 'Legal jurisdiction under which the Credit Support Annex is governed. English law and New York law are the two dominant ISDA CSA jurisdictions; each has different title-transfer vs. security-interest treatment of collateral.',
    rows: [
      { governingLawTypeId: 1, typeCode: 'ENGLISH',  typeName: 'English Law',   description: 'ISDA 1995 / 2016 Credit Support Annex (Transfer — English law). Collateral is transferred by way of title, not security interest. Most common in Europe and Asia.', sortOrder: 10, isActive: true },
      { governingLawTypeId: 2, typeCode: 'NEW_YORK', typeName: 'New York Law',  description: 'ISDA 1994 Credit Support Annex (Security Interest — New York law). Collateral is pledged as security interest; rehypothecation typically permitted. Standard in US markets.', sortOrder: 20, isActive: true },
      { governingLawTypeId: 3, typeCode: 'OTHER',    typeName: 'Other',         description: 'Alternative jurisdiction — e.g. Japanese law CSA, French law, or bespoke bilateral arrangement. See agreement notes for details.', sortOrder: 30, isActive: true },
    ],
  },
  {
    name: 'credit_limit_type', label: 'Credit Limit Types', pk: 'creditLimitTypeId', group: 'Credit & Collateral', order: 4,
    subGroup: 'Credit Limits', description: 'Classifies what type of credit exposure the limit controls. A single counterparty typically has separate limits for each type — pre-settlement, settlement, and MTM exposure are independently tracked against their own approved limits.',
    rows: [
      { creditLimitTypeId: 1, typeCode: 'PRE_SETTLEMENT',  typeName: 'Pre-Settlement',    description: 'Forward exposure risk — the replacement cost if the counterparty defaults before maturity. Calculated as sum of positive MTM of all open trades. Most important limit type for long-dated OTC portfolios.', sortOrder: 10, isActive: true },
      { creditLimitTypeId: 2, typeCode: 'SETTLEMENT',      typeName: 'Settlement',         description: 'Payment-due-today risk — the cash owed by or to the counterparty on transactions settling within T+2. Spikes on invoice payment dates and delivery day.', sortOrder: 20, isActive: true },
      { creditLimitTypeId: 3, typeCode: 'DELIVERY',        typeName: 'Delivery',           description: 'Physical commodity delivery risk — the value of commodity we expect to deliver to (or receive from) the counterparty in the current period. Relevant for physical ETRM books.', sortOrder: 30, isActive: true },
      { creditLimitTypeId: 4, typeCode: 'MARK_TO_MARKET',  typeName: 'Mark-to-Market',    description: 'Current unrealised gain/loss exposure on all open positions valued at today\'s market price. Used for intraday risk monitoring and variation margin calculations.', sortOrder: 40, isActive: true },
    ],
  },
  {
    name: 'credit_limit_status_type', label: 'Credit Limit Statuses', pk: 'creditLimitStatusTypeId', group: 'Credit & Collateral', order: 5,
    subGroup: 'Credit Limits', description: 'Lifecycle status of a credit limit record. Only ACTIVE limits are checked during trade booking. SUSPENDED limits block new trades but do not cancel existing ones. EXPIRED limits are automatically transitioned by the system at end of day on the expiry date.',
    rows: [
      { creditLimitStatusTypeId: 1, typeCode: 'ACTIVE',    typeName: 'Active',    description: 'Limit is in effect and enforced. New trades are validated against this limit during booking. Utilisaton tracked in real time.',                                   sortOrder: 10, isActive: true },
      { creditLimitStatusTypeId: 2, typeCode: 'EXPIRED',   typeName: 'Expired',   description: 'Limit has passed its expiry date. System auto-transitions. New trades cannot consume this limit — booking will fail without a replacement active limit.',          sortOrder: 20, isActive: true },
      { creditLimitStatusTypeId: 3, typeCode: 'SUSPENDED', typeName: 'Suspended', description: 'Limit temporarily blocked by credit team (e.g. during CP review or KYC renewal). Existing trades not affected, but no new exposure can be booked against this limit.', sortOrder: 30, isActive: true },
      { creditLimitStatusTypeId: 4, typeCode: 'CANCELLED', typeName: 'Cancelled', description: 'Limit permanently withdrawn — counterparty credit facility removed. Any existing open trades must be novated or closed.',                                          sortOrder: 40, isActive: true },
    ],
  },
  {
    name: 'lc_type', label: 'Letter of Credit Types', pk: 'lcTypeId', group: 'Credit & Collateral', order: 6,
    subGroup: 'Letters of Credit', description: 'Category of letter of credit, which determines the conditions under which it can be drawn and whether it can be transferred or renewed. Most commodity trades use Standby or Documentary LCs. Governed by ICC UCP 600 (documentary) or ISP98 (standby).',
    rows: [
      { lcTypeId: 1, typeCode: 'STANDBY',       typeName: 'Standby LC',        description: 'Independent payment guarantee — drawn only on default or non-performance. No physical document presentation required. Governed by ISP98. Used as general credit support for commodity trades.', sortOrder: 10, isActive: true },
      { lcTypeId: 2, typeCode: 'DOCUMENTARY',   typeName: 'Documentary LC',    description: 'Payment triggered by presentation of specified shipping documents (B/L, inspection certificate, invoice). Governed by ICC UCP 600. Standard for physical cargo trades — oil, LNG, metals, agri.', sortOrder: 20, isActive: true },
      { lcTypeId: 3, typeCode: 'REVOLVING',     typeName: 'Revolving LC',      description: 'Automatically reinstates (up to the face value) after each drawing or at specified intervals. Used for regular shipment programmes to avoid issuing a new LC for every cargo.', sortOrder: 30, isActive: true },
      { lcTypeId: 4, typeCode: 'TRANSFERABLE',  typeName: 'Transferable LC',   description: 'Beneficiary can transfer the LC (in whole or part) to a second beneficiary — typically a supplier or sub-contractor. Requires explicit "transferable" endorsement from issuing bank.', sortOrder: 40, isActive: true },
    ],
  },
  {
    name: 'lc_status_type', label: 'LC Statuses', pk: 'lcStatusTypeId', group: 'Credit & Collateral', order: 7,
    subGroup: 'Letters of Credit', description: 'Lifecycle status of a letter of credit record. Tracks the LC from issuance through partial or full drawdown to expiry or cancellation. PARTIALLY_DRAWN and FULLY_DRAWN are system-computed based on drawdown_amount vs lc_amount.',
    rows: [
      { lcStatusTypeId: 1, typeCode: 'ACTIVE',           typeName: 'Active',           description: 'LC is current and available to draw against. Expiry date is in the future and face value is not fully drawn.',                                                                     sortOrder: 10, isActive: true },
      { lcStatusTypeId: 2, typeCode: 'EXPIRED',          typeName: 'Expired',          description: 'LC has passed its expiry date without being drawn or renewed. Any unused available amount is forfeited. Bank is released from obligation.',                                          sortOrder: 20, isActive: true },
      { lcStatusTypeId: 3, typeCode: 'CANCELLED',        typeName: 'Cancelled',        description: 'LC cancelled by mutual agreement before expiry — e.g. trade novated, counterparty substituted alternative collateral, or CP provided cash instead.',                               sortOrder: 30, isActive: true },
      { lcStatusTypeId: 4, typeCode: 'PARTIALLY_DRAWN',  typeName: 'Partially Drawn',  description: 'One or more drawdown events have occurred but the full LC face value has not been consumed. Remaining available balance still callable.',                                          sortOrder: 40, isActive: true },
      { lcStatusTypeId: 5, typeCode: 'FULLY_DRAWN',      typeName: 'Fully Drawn',      description: 'All available LC face value has been drawn. LC is exhausted — no further drawings possible. Revolving LCs may reinstate after a drawing.',                                         sortOrder: 50, isActive: true },
    ],
  },
  {
    name: 'uom_type', label: 'UoM Types', pk: 'uomTypeId', group: 'Finance & Settlement', order: 10,
    subGroup: 'Units & Conversions', description: 'Physical dimension classification for a unit of measure — the real CHECK values on dbo.unit_of_measure.uom_category, now a dedicated FK table (V84).',
    rows: [
      { uomTypeId: 1, typeCode: 'VOLUME',      typeName: 'Volume',      description: 'Liquid or gas volume units — barrels, cubic metres, gallons, litres. Used for crude, refined products, and LNG.', sortOrder: 1, isActive: true },
      { uomTypeId: 2, typeCode: 'WEIGHT',      typeName: 'Weight',      description: 'Mass units — metric tonnes, short tons, pounds, kilograms. Used for metals, agri commodities, and weight-settled cargoes.', sortOrder: 2, isActive: true },
      { uomTypeId: 3, typeCode: 'ENERGY',      typeName: 'Energy',      description: 'Heat content units — MMBtu, therms, gigajoules. Used for natural gas and LNG priced on a calorific basis.', sortOrder: 3, isActive: true },
      { uomTypeId: 4, typeCode: 'POWER',       typeName: 'Power',       description: 'Electrical power and energy units — MW, MWh, kWh. Used for power trade quantities and load profiles.', sortOrder: 4, isActive: true },
      { uomTypeId: 5, typeCode: 'TEMPERATURE', typeName: 'Temperature', description: 'Temperature units — used for weather-linked and degree-day products.', sortOrder: 5, isActive: true },
      { uomTypeId: 6, typeCode: 'COUNT',       typeName: 'Count',       description: 'Discrete count units — lots, cargoes, contracts. Used where a commodity trades in standard-sized units.', sortOrder: 6, isActive: true },
      { uomTypeId: 7, typeCode: 'OTHER',       typeName: 'Other',       description: 'Unit category not covered by the standard classifications above.', sortOrder: 7, isActive: true },
    ],
  },
  {
    name: 'emission_scheme_type', label: 'Emission Scheme Types', pk: 'emissionSchemeTypeId', group: 'Carbon & Environmental', order: 11,
    subGroup: 'Carbon & Environmental', description: 'Classification of emission trading schemes. Compliance schemes are mandatory (EU ETS, UK ETS, CA Cap-and-Trade, RGGI). Voluntary schemes are market-driven (VCS, Gold Standard).',
    rows: [
      { emissionSchemeTypeId: 1, typeCode: 'COMPLIANCE', typeName: 'Compliance', description: 'Mandatory cap-and-trade scheme imposed by law. Participants must surrender allowances equal to verified emissions.', sortOrder: 10, isActive: true },
      { emissionSchemeTypeId: 2, typeCode: 'VOLUNTARY',  typeName: 'Voluntary',  description: 'Market-driven scheme where companies voluntarily offset their emissions. Credits are verified under recognised standards such as Verra VCS or Gold Standard.', sortOrder: 20, isActive: true },
    ],
  },
  {
    name: 'environmental_product_type', label: 'Environmental Product Types', pk: 'environmentalProductTypeId', group: 'Carbon & Environmental', order: 12,
    subGroup: 'Carbon & Environmental', description: 'Classification of tradeable environmental instruments. Allowances represent the right to emit one tonne CO2e. Certificates prove renewable energy generation. Offsets represent verified emission reductions from projects.',
    rows: [
      { environmentalProductTypeId: 1, typeCode: 'ALLOWANCE',   typeName: 'Allowance',   description: 'Cap-and-trade permit conferring the right to emit one unit (typically one tonne CO2e). EUA, UKA, CCA and EUAA are allowances.', sortOrder: 10, isActive: true },
      { environmentalProductTypeId: 2, typeCode: 'CERTIFICATE', typeName: 'Certificate', description: 'Tradeable instrument proving that one unit of energy was generated from a renewable source. REC (US) and GO (EU/UK) are certificates.', sortOrder: 20, isActive: true },
      { environmentalProductTypeId: 3, typeCode: 'OFFSET',      typeName: 'Offset',      description: 'Verified emission reduction from a project outside a cap-and-trade scheme. VCU (Verra), CER (UNFCCC), and Gold Standard credits are offsets.', sortOrder: 30, isActive: true },
    ],
  },
  {
    name: 'carbon_registry_type', label: 'Carbon Registry Types', pk: 'carbonRegistryTypeId', group: 'Carbon & Environmental', order: 13,
    subGroup: 'Carbon & Environmental', description: 'Classification of carbon registries. Compliance registries are established by law to track mandatory allowance holdings and transfers. Voluntary registries operate privately to issue and retire voluntary carbon credits.',
    rows: [
      { carbonRegistryTypeId: 1, typeCode: 'COMPLIANCE', typeName: 'Compliance', description: 'Registry mandated by a regulator to issue, transfer and cancel compliance allowances — EU Union Registry, UK Registry, CITSS (California).', sortOrder: 10, isActive: true },
      { carbonRegistryTypeId: 2, typeCode: 'VOLUNTARY',  typeName: 'Voluntary',  description: 'Privately operated registry for voluntary carbon market credits — Verra Registry, Gold Standard Impact Registry, American Carbon Registry, APX.', sortOrder: 20, isActive: true },
    ],
  },
  {
    name: 'emission_obligation_status', label: 'Emission Obligation Statuses', pk: 'emissionObligationStatusId', group: 'Carbon & Environmental', order: 14,
    subGroup: 'Carbon & Environmental', description: 'Lifecycle status of an annual surrender obligation for a legal entity under a specific emission scheme.',
    rows: [
      { emissionObligationStatusId: 1, typeCode: 'OPEN',                  typeName: 'Open',                  description: 'Obligation is active and not yet settled. Verified emissions and/or allowances held may still be incomplete.', sortOrder: 10, isActive: true },
      { emissionObligationStatusId: 2, typeCode: 'SURRENDERED',           typeName: 'Surrendered',           description: 'All required allowances have been surrendered to the registry by the compliance deadline.', sortOrder: 20, isActive: true },
      { emissionObligationStatusId: 3, typeCode: 'PARTIALLY_SURRENDERED', typeName: 'Partially Surrendered', description: 'Some allowances surrendered but a shortfall remains. Further action required before the deadline.', sortOrder: 30, isActive: true },
      { emissionObligationStatusId: 4, typeCode: 'OVERDUE',               typeName: 'Overdue',               description: 'Surrender deadline has passed without full compliance. Financial penalties and reputational risk apply.', sortOrder: 40, isActive: true },
    ],
  },
  // gl_account_type removed — already seeded as a lookup_value category in
  // real SQL (V37 itself), never a missing table; wired in V84, rows above.
  // rin_transaction_type / rin_obligation_status removed — already seeded
  // as lookup_value categories in real SQL (V38); wired in V81, rows above.
  // instrument_type / storage_agreement_type / transport_agreement_type /
  // price_adjustment_type / demurrage_basis removed — all five already had
  // their lookup_value rows seeded in real SQL (V44/V46), just never wired
  // to the consuming column until V81; rows now live in the lookup_value
  // seed above, not here.
];

// ─── Complex table metadata (tables with unique column shapes) ────────────────
// Tables whose columns differ from the standard lookup pattern stay fully defined.

const SPECIAL_TABLE_METADATA: Record<string, TableMetadata> = {
  currency: {
    tableName: 'currency', displayName: 'Currencies', primaryKeyColumn: 'currencyId', isTemporal: false,
    columns: [
      col('currencyId',    'ID',             'number',  false, true,  null),
      col('currencyCode',  'Code',           'string',  false, false, 3),
      col('currencyName',  'Name',           'string',  false, false, 100),
      col('symbol',        'Symbol',         'string',  true,  false, 5),
      col('decimalPlaces', 'Decimal Places', 'number',  false, false, null),
      col('isActive',      'Active',         'boolean', false, false, null),
    ],
  },
  // V58 dropped commodity_type (redundant 1:1 self-tag). V59/this session's
  // cleanup also removes commoditySubtype/defaultUomId/defaultCurrencyId —
  // none of these were ever real SQL columns (checked: dbo.commodity in
  // 01_master_data_foundation.sql only ever had commodity_id/code/name/
  // description/is_active — the subtype+defaults were frontend-only mock
  // additions with no backing schema, and nothing outside this file read
  // them). The category/grouping concept they were standing in for is now
  // properly `commodity_family` (V59), linked to `product`, not sitting on
  // `commodity`. `commodity` stays exactly what it's for: the unique list of
  // top-level commodity types this ETRM supports — nothing else.
  commodity: {
    tableName: 'commodity', displayName: 'Commodities', primaryKeyColumn: 'commodityId', isTemporal: false,
    columns: [
      col('commodityId',      'ID',           'number',  false, true,  null),
      col('commodityCode',    'Code',         'string',  false, false, 20),
      col('commodityName',    'Name',         'string',  false, false, 100),
      col('description',      'Description',  'string',  true,  false, 500),
      col('isActive',         'Active',       'boolean', false, false, null),
    ],
  },
  commodity_family: {
    tableName: 'commodity_family', displayName: 'Commodity Families', primaryKeyColumn: 'commodityFamilyId', isTemporal: false,
    columns: [
      col('commodityFamilyId', 'ID',          'number',      false, true,  null),
      col('commodityId',       'Commodity',   'foreign_key', false, false, null, null, 'commodity'),
      col('familyCode',        'Family Code', 'string',      false, false, 30),
      col('familyName',        'Family Name', 'string',      false, false, 100),
      // V61 — locked to a fixed list (was free text in V59; user reconsidered
      // and wanted a closed dropdown, not typeable text, to prevent drift).
      col('familyType',        'Family Type', 'enum',        true,  false, 30,
        ['CRUDE', 'REFINED', 'PETROCHEMICAL', 'PIPELINE_GAS', 'LNG', 'BASE_METAL', 'PRECIOUS_METAL', 'GRAIN', 'ELECTRICITY']),
      col('description',       'Description', 'string',      true,  false, 500),
      col('isActive',          'Active',      'boolean',     false, false, null),
    ],
  },
  // V63 — dbo.lookup_value: the generic category+code+display_name table used
  // across many small enums in this schema (was never mocked on the frontend
  // before — every prior lookup_value-backed FK used its own hardcoded
  // id->label array instead, e.g. desks/types.ts's COMMODITY_TYPE_LOOKUP).
  // Only the REPORTING_CLASSIFICATION_TYPE rows are seeded here — this does
  // NOT attempt to backfill every other category already hardcoded elsewhere.
  //
  // V85 — category went from a free-text VARCHAR to a real categoryId FK
  // against the new dbo.lookup_category master (dedicated tables built in
  // V82/V83/V84 are untouched by this — this only fixes lookup_value itself,
  // the generic table, so its own category axis is a managed list instead of
  // an unconstrained string).
  lookup_value: {
    tableName: 'lookup_value', displayName: 'Lookup Values', primaryKeyColumn: 'lookupId', isTemporal: false,
    columns: [
      col('lookupId',     'ID',           'number',      false, true,  null),
      col('categoryId',   'Category',     'foreign_key', false, false, null, null, 'lookup_category'),
      col('code',         'Code',         'string',      false, false, 50),
      col('displayName',  'Display Name', 'string',      false, false, 200),
      col('sortOrder',    'Sort Order',   'number',      true,  false, null),
      col('isActive',     'Active',       'boolean',     false, false, null),
    ],
  },
  // V85 — dbo.lookup_category: the category master lookup_value.categoryId
  // now points at, so the category axis itself is a managed list (creatable
  // from the GUI) instead of a free-text string on every lookup_value row.
  lookup_category: {
    tableName: 'lookup_category', displayName: 'Lookup Categories', primaryKeyColumn: 'categoryId', isTemporal: false,
    columns: [
      col('categoryId',   'ID',          'number',  false, true,  null),
      col('categoryCode', 'Code',        'string',  false, false, 100),
      col('categoryName', 'Name',        'string',  false, false, 200),
      col('description',  'Description', 'string',  true,  false, 500),
      col('sortOrder',    'Sort Order',  'number',  false, false, null),
      col('isActive',     'Active',      'boolean', false, false, null),
    ],
  },
  // V60/V63 — independent per-report classification axes (Position, VaR,
  // Settlement/GL...), separate from commodity_family. classification_type
  // was originally a plain unconstrained string (V60); V63 converted it to a
  // proper lookup_value FK since more axes will likely be added over time and
  // the user wanted a managed list, not free text. group_code was dropped —
  // a product is assigned directly to a named reporting_group row, no short
  // code was ever needed for that. Products are linked via the
  // product_reporting_group bridge table (managed from the Products page's
  // "Reporting Groups" tab, not here).
  reporting_group: {
    tableName: 'reporting_group', displayName: 'Reporting Groups', primaryKeyColumn: 'reportingGroupId', isTemporal: false,
    columns: [
      col('reportingGroupId',    'ID',             'number',      false, true,  null),
      col('classificationTypeId','Classification', 'foreign_key', false, false, null, null, 'lookup_value', 'REPORTING_CLASSIFICATION_TYPE'),
      col('groupName',           'Group Name',     'string',      false, false, 100),
      col('description',         'Description',    'string',      true,  false, 500),
      col('isActive',            'Active',         'boolean',     false, false, null),
    ],
  },
  credit_rating: {
    tableName: 'credit_rating', displayName: 'Credit Ratings', primaryKeyColumn: 'creditRatingId', isTemporal: false,
    columns: [
      col('creditRatingId', 'ID',            'number',  false, true,  null),
      col('agency',         'Agency',        'string',  false, false, 20),
      col('rating',         'Rating',        'string',  false, false, 10),
      col('numericScore',   'Numeric Score', 'number',  false, false, null),
      col('riskCategory',   'Risk Category', 'enum',    false, false, null, ['INVESTMENT_GRADE', 'SPECULATIVE', 'DEFAULT', 'UNRATED']),
      col('isActive',       'Active',        'boolean', false, false, null),
    ],
  },
  incoterm: {
    tableName: 'incoterm', displayName: 'Incoterms', primaryKeyColumn: 'incotermId', isTemporal: false,
    columns: [
      col('incotermId',     'ID',             'number',  false, true,  null),
      col('code',           'Code',           'string',  false, false, 10),
      col('name',           'Name',           'string',  false, false, 100),
      col('transportMode',  'Transport Mode', 'enum',    false, false, null, ['ANY', 'SEA_INLAND_WATERWAY']),
      col('versionYear',    'Version Year',   'number',  false, false, null),
      col('isActive',       'Active',         'boolean', false, false, null),
    ],
  },
  charter_party_type: {
    tableName: 'charter_party_type', displayName: 'Charter Party Types', primaryKeyColumn: 'charterPartyTypeId', isTemporal: false,
    columns: [
      col('charterPartyTypeId',    'ID',                      'number',  false, true,  null),
      col('typeCode',              'Type Code',               'string',  false, false, 20),
      col('typeName',              'Type Name',               'string',  false, false, 100),
      col('rateBasis',             'Rate Basis',              'enum',    false, false, null, ['PER_DAY', 'PER_TONNE', 'LUMPSUM', 'PER_CBM', 'WORLDSCALE']),
      col('durationBasis',         'Duration Basis',          'enum',    false, false, null, ['SINGLE_VOYAGE', 'TIME_PERIOD', 'BAREBOAT_PERIOD', 'CONTRACT_PERIOD']),
      col('standardFormReference', 'Standard Form Reference', 'string',  true,  false, 100),
      col('description',           'Description',             'string',  true,  false, 300),
      col('isActive',              'Active',                  'boolean', false, false, null),
    ],
  },
  fx_period: {
    tableName: 'fx_period', displayName: 'FX Periods / Tenors', primaryKeyColumn: 'fxPeriodId', isTemporal: false,
    columns: [
      col('fxPeriodId',  'ID',          'number',  false, true,  null),
      col('periodCode',  'Period Code', 'string',  false, false, 20),
      col('periodName',  'Period Name', 'string',  false, false, 100),
      col('periodType',  'Period Type', 'enum',    false, false, null, ['SPOT', 'STANDARD_TENOR', 'DAILY_FORWARD']),
      col('daysOffset',  'Days Offset', 'number',  false, false, null),
      col('isActive',    'Active',      'boolean', false, false, null),
    ],
  },
  freight_rate_index: {
    tableName: 'freight_rate_index', displayName: 'Freight Rate Indices', primaryKeyColumn: 'freightRateIndexId', isTemporal: false,
    columns: [
      col('freightRateIndexId',   'ID',                   'number',      false, true,  null),
      col('indexCode',            'Index Code',           'string',      false, false, 30),
      col('indexName',            'Index Name',           'string',      false, false, 200),
      col('indexType',            'Index Type',           'enum',        false, false, null, ['BALTIC', 'WORLDSCALE', 'ASSESSED', 'OTHER']),
      col('vesselType',           'Vessel Type',          'string',      true,  false, 30),
      col('routeDescription',     'Route',                'string',      true,  false, 200),
      col('commodityType',        'Commodity',            'foreign_key', true,  false, null, null, 'commodity_type'),
      col('currencyId',           'Currency',             'foreign_key', true,  false, null, null, 'currency'),
      col('uomId',                'UoM',                  'number',      true,  false, null),
      col('publicationSource',    'Publication Source',   'string',      true,  false, 100),
      col('publicationFrequency', 'Publication Frequency','enum',        true,  false, null, ['DAILY', 'WEEKLY', 'ANNUAL']),
      col('description',          'Description',          'string',      true,  false, 300),
      col('isActive',             'Active',               'boolean',     false, false, null),
    ],
  },
  laytime_term_template: {
    tableName: 'laytime_term_template', displayName: 'Laytime Term Templates', primaryKeyColumn: 'laytimeTermId', isTemporal: false,
    columns: [
      col('laytimeTermId',     'ID',                  'number',  false, true,  null),
      col('termCode',          'Term Code',           'string',  false, false, 20),
      col('termName',          'Term Name',           'string',  false, false, 150),
      col('exclusionBasis',    'Exclusion Basis',     'enum',    false, false, null, ['SHINC', 'SHEX', 'SHEXEIU', 'SHEXUU', 'WWD', 'WWDSHEXUU', 'FHEX']),
      col('isReversible',      'Reversible',          'boolean', false, false, null),
      col('norWiponAllowed',   'NOR — WIPON',         'boolean', false, false, null),
      col('norWibonAllowed',   'NOR — WIBON',         'boolean', false, false, null),
      col('norWifponAllowed',  'NOR — WIFPON',        'boolean', false, false, null),
      col('norWcconAllowed',   'NOR — WCCON',         'boolean', false, false, null),
      col('noticeOfReadinessTurnTimeMins', 'NOR Turn Time (mins)', 'number', false, false, null),
      col('commodityType',     'Commodity',           'foreign_key', true,  false, null, null, 'commodity_type'),
      col('description',       'Description',         'string',  true,  false, 300),
      col('isActive',          'Active',              'boolean', false, false, null),
    ],
  },
  demurrage_dispatch_rate: {
    tableName: 'demurrage_dispatch_rate', displayName: 'Demurrage & Dispatch Rates', primaryKeyColumn: 'demurrageRateId', isTemporal: false,
    columns: [
      col('demurrageRateId',     'ID',                  'number',      false, true,  null),
      col('vesselType',          'Vessel Type',         'string',      true,  false, 30),
      col('charterPartyTypeId',  'Charter Party Type',  'foreign_key', true,  false, null, null, 'charter_party_type'),
      col('demurrageRatePerDay', 'Demurrage $/Day',     'number',      false, false, null, null, null, null, true),
      col('dispatchRatePerDay',  'Dispatch $/Day',      'number',      true,  false, null, null, null, null, true),
      col('currencyId',          'Currency',            'foreign_key', false, false, null, null, 'currency'),
      col('commodityType',       'Commodity',           'foreign_key', true,  false, null, null, 'commodity_type'),
      col('claimTimeBarDays',    'Claim Time-Bar (days)','number',     true,  false, null),
      col('despatchBasis',       'Despatch Basis',      'enum',        true,  false, null, ['ALL_TIME_SAVED', 'WORKING_TIME_SAVED_ONLY']),
      col('effectiveFrom',       'Effective From',      'date',        false, false, null),
      col('effectiveTo',         'Effective To',        'date',        true,  false, null),
      col('notes',               'Notes',               'string',      true,  false, 500),
      col('isActive',            'Active',              'boolean',     false, false, null),
    ],
  },
  laytime_exception_type: {
    tableName: 'laytime_exception_type', displayName: 'Laytime Exception Types', primaryKeyColumn: 'exceptionTypeId', isTemporal: false,
    columns: [
      col('exceptionTypeId',              'ID',                    'number',  false, true,  null),
      col('exceptionCode',                'Code',                  'string',  false, false, 30),
      col('exceptionName',                'Name',                  'string',  false, false, 150),
      col('defaultCountsAgainstLaytime',  'Counts vs. Laytime',    'boolean', false, false, null),
      col('isWeatherRelated',             'Weather-Related',       'boolean', false, false, null),
      col('description',                  'Description',           'string',  true,  false, 300),
      col('isActive',                     'Active',                'boolean', false, false, null),
    ],
  },
  load_shape_template: {
    tableName: 'load_shape_template', displayName: 'Load Shape Templates', primaryKeyColumn: 'loadShapeId', isTemporal: false,
    columns: [
      col('loadShapeId', 'ID',         'number',  false, true,  null),
      col('shapeCode',   'Shape Code', 'string',  false, false, 30),
      col('shapeName',   'Shape Name', 'string',  false, false, 150),
      col('shapeType',   'Shape Type', 'enum',    false, false, null, ['BASELOAD', 'PEAK', 'OFFPEAK', 'CUSTOM']),
      col('startHour',        'Start Hour',         'number',  true,  false, null),
      col('endHour',          'End Hour',           'number',  true,  false, null),
      col('intervalMinutes',  'Interval (Minutes)', 'number',  false, false, null),
      col('isComposite',      'Composite',          'boolean', false, false, null),
      col('isActive',         'Active',             'boolean', false, false, null),
    ],
  },
  balancing_authority: {
    tableName: 'balancing_authority', displayName: 'Balancing Authorities', primaryKeyColumn: 'balancingAuthorityId', isTemporal: false,
    columns: [
      col('balancingAuthorityId', 'ID',          'number',  false, true,  null),
      col('baCode',               'BA Code',     'string',  false, false, 20),
      col('baName',               'Name',        'string',  false, false, 200),
      col('countryId',            'Country',     'foreign_key', false, false, null, null, 'country'),
      col('marketType',           'Market Type', 'enum',    false, false, null, ['ISO', 'RTO', 'TSO', 'VERTICALLY_INTEGRATED', 'OTHER']),
      col('isActive',             'Active',      'boolean', false, false, null),
    ],
  },
  transmission_zone: {
    tableName: 'transmission_zone', displayName: 'Transmission Zones', primaryKeyColumn: 'zoneId', isTemporal: false,
    columns: [
      col('zoneId',               'ID',                  'number',      false, true,  null, null, null),
      col('balancingAuthorityId', 'Balancing Authority', 'foreign_key', false, false, null, null, 'balancing_authority'),
      col('zoneCode',             'Zone Code',           'string',      false, false, 30),
      col('zoneName',             'Zone Name',           'string',      false, false, 200),
      col('zoneType',             'Zone Type',           'enum',        false, false, null, ['LOAD_ZONE', 'GSP_GROUP', 'PRICING_NODE_GROUP', 'HUB', 'OTHER']),
      col('isActive',             'Active',              'boolean',     false, false, null),
    ],
  },
  load_shape_interval: {
    tableName: 'load_shape_interval', displayName: 'Load Shape Intervals', primaryKeyColumn: 'shapeIntervalId', isTemporal: false,
    columns: [
      col('shapeIntervalId', 'ID',              'number',      false, true,  null),
      col('loadShapeId',     'Load Shape',      'foreign_key', false, false, null, null, 'load_shape_template'),
      col('dayType',         'Day Type',        'enum',        false, false, null, ['ALL', 'WEEKDAYS', 'WEEKENDS', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'HOLIDAY']),
      col('intervalNo',      'Interval No',     'number',      false, false, null),
      col('intervalFactor',  'Interval Factor', 'number',      false, false, null, null, null, null, true),
    ],
  },
  load_shape_component: {
    tableName: 'load_shape_component', displayName: 'Load Shape Components', primaryKeyColumn: 'shapeComponentId', isTemporal: false,
    columns: [
      col('shapeComponentId',  'ID',            'number',      false, true,  null),
      col('parentLoadShapeId', 'Parent Shape',  'foreign_key', false, false, null, null, 'load_shape_template'),
      col('childLoadShapeId',  'Child Shape',   'foreign_key', false, false, null, null, 'load_shape_template'),
      col('weightFactor',      'Weight Factor', 'number',      false, false, null, null, null, null, true),
      col('monthFrom',         'Month From',    'number',      true,  false, null),
      col('monthTo',           'Month To',      'number',      true,  false, null),
      col('sequenceNo',        'Sequence',      'number',      false, false, null),
    ],
  },
  energy_footprint: {
    tableName: 'energy_footprint', displayName: 'Energy Footprints', primaryKeyColumn: 'energyFootprintId', isTemporal: false,
    columns: [
      col('energyFootprintId',    'ID',                  'number',      false, true,  null),
      col('footprintCode',        'Code',                'string',      false, false, 30),
      col('footprintName',        'Name',                'string',      false, false, 200),
      col('footprintType',        'Footprint Type',      'enum',        false, false, null, ['SOLAR_PORTFOLIO', 'WIND_PORTFOLIO', 'EV_CHARGING_NETWORK', 'BATTERY_FLEET', 'DEMAND_RESPONSE', 'MICROGRID', 'HYBRID']),
      col('flowDirection',        'Flow Direction',      'enum',        false, false, null, ['GENERATION', 'LOAD', 'BIDIRECTIONAL']),
      col('balancingAuthorityId', 'Balancing Authority', 'foreign_key', true,  false, null, null, 'balancing_authority'),
      col('defaultZoneId',        'Default Zone',        'foreign_key', true,  false, null, null, 'transmission_zone'),
      col('totalCapacityMw',      'Capacity (MW)',       'number',      true,  false, null, null, null, null, true),
      col('defaultLoadShapeId',   'Default Load Shape',  'foreign_key', true,  false, null, null, 'load_shape_template'),
      col('isAggregatedDispatch', 'Aggregated Dispatch', 'boolean',     false, false, null),
      col('isActive',             'Active',              'boolean',     false, false, null),
    ],
  },
  energy_footprint_site: {
    tableName: 'energy_footprint_site', displayName: 'Energy Footprint Sites', primaryKeyColumn: 'footprintSiteId', isTemporal: false,
    columns: [
      col('footprintSiteId',    'ID',                 'number',      false, true,  null),
      col('energyFootprintId',  'Footprint',          'foreign_key', false, false, null, null, 'energy_footprint'),
      col('siteCode',           'Site Code',          'string',      false, false, 30),
      col('siteName',           'Site Name',          'string',      false, false, 200),
      col('siteType',           'Site Type',          'enum',        false, false, null, ['SOLAR_ARRAY', 'ROOFTOP_SOLAR', 'WIND_TURBINE_GROUP', 'EV_CHARGING_HUB', 'EV_DEPOT', 'BATTERY_UNIT', 'CURTAILABLE_LOAD', 'OTHER']),
      col('zoneId',             'Zone',               'foreign_key', true,  false, null, null, 'transmission_zone'),
      col('capacityMw',         'Capacity (MW)',      'number',      false, false, null, null, null, null, true),
      col('storageCapacityMwh', 'Storage (MWh)',      'number',      true,  false, null, null, null, null, true),
      col('chargerCount',       'Charger Count',      'number',      true,  false, null),
      col('maxChargerKw',       'Max Charger (kW)',   'number',      true,  false, null, null, null, null, true),
      col('connectorStandard',  'Connector Standard', 'enum',        true,  false, null, ['CCS', 'CHADEMO', 'NACS', 'TYPE2', 'MIXED']),
      col('technology',         'Technology',         'string',      true,  false, 50),
      col('isActive',           'Active',             'boolean',     false, false, null),
    ],
  },

  // V65 — Power registry orphans: these tables have real V11/V12 schemas and
  // seed data but were never registered/mocked as Static Data — a pure
  // "link it correctly" gap, not new schema. location_id/owner_counterparty_id
  // FKs on generation_asset are omitted from the mock (same simplification
  // transmission_zone's own location_id already accepted) since `location`/
  // `counterparty` aren't in this file's rowSeed — flagged here rather than
  // silently faked.
  interconnector: {
    tableName: 'interconnector', displayName: 'Interconnectors', primaryKeyColumn: 'interconnectorId', isTemporal: false,
    columns: [
      col('interconnectorId',   'ID',                  'number',      false, true,  null),
      col('interconnectorCode', 'Code',                'string',      false, false, 30),
      col('interconnectorName', 'Name',                'string',      false, false, 200),
      col('fromZoneId',         'From Zone',           'foreign_key', false, false, null, null, 'transmission_zone'),
      col('toZoneId',           'To Zone',             'foreign_key', false, false, null, null, 'transmission_zone'),
      col('capacityMw',         'Capacity (MW)',       'number',      true,  false, null, null, null, null, true),
      col('directionType',      'Direction',           'enum',        false, false, null, ['UNIDIRECTIONAL', 'BIDIRECTIONAL']),
      col('operator',           'Operator',            'string',      true,  false, 200),
      col('isActive',           'Active',              'boolean',     false, false, null),
    ],
  },
  generation_asset: {
    tableName: 'generation_asset', displayName: 'Generation Assets', primaryKeyColumn: 'generationAssetId', isTemporal: false,
    columns: [
      col('generationAssetId',    'ID',                  'number',      false, true,  null),
      col('assetCode',            'Asset Code',          'string',      false, false, 30),
      col('assetName',            'Asset Name',          'string',      false, false, 200),
      col('balancingAuthorityId', 'Balancing Authority', 'foreign_key', true,  false, null, null, 'balancing_authority'),
      col('zoneId',               'Zone',                'foreign_key', true,  false, null, null, 'transmission_zone'),
      col('fuelType',             'Fuel Type',           'enum',        false, false, null, ['GAS', 'COAL', 'NUCLEAR', 'HYDRO', 'WIND', 'SOLAR', 'BIOMASS', 'OIL', 'STORAGE', 'OTHER']),
      col('technology',           'Technology',          'string',      true,  false, 50),
      col('nameplateCapacityMw',  'Nameplate Capacity (MW)', 'number',  false, false, null, null, null, null, true),
      col('commissioningDate',    'Commissioning Date',   'date',      true,  false, null),
      col('decommissioningDate',  'Decommissioning Date', 'date',      true,  false, null),
      col('isActive',             'Active',              'boolean',     false, false, null),
    ],
  },
  power_product_detail: {
    tableName: 'power_product_detail', displayName: 'Power Product Detail', primaryKeyColumn: 'productId', isTemporal: false,
    columns: [
      col('productId',                  'Product',             'foreign_key', false, true,  null, null, 'product'),
      col('defaultLoadShapeId',         'Default Load Shape',  'foreign_key', true,  false, null, null, 'load_shape_template'),
      col('voltageLevel',               'Voltage Level',       'enum',        true,  false, null, ['LOW', 'MEDIUM', 'HIGH', 'EXTRA_HIGH']),
      col('settlementPointType',        'Settlement Point',    'enum',        true,  false, null, ['NODE', 'ZONE', 'HUB', 'SYSTEM']),
      col('defaultBalancingAuthorityId','Default Balancing Authority', 'foreign_key', true, false, null, null, 'balancing_authority'),
      col('defaultZoneId',              'Default Zone',        'foreign_key', true,  false, null, null, 'transmission_zone'),
      col('isAncillaryService',         'Ancillary Service',   'boolean',     false, false, null),
      col('notes',                      'Notes',               'string',      true,  false, 500),
    ],
  },
  transmission_right_type: {
    tableName: 'transmission_right_type', displayName: 'Transmission Right Types', primaryKeyColumn: 'rightTypeId', isTemporal: false,
    columns: [
      col('rightTypeId',              'ID',                    'number',      false, true,  null),
      col('typeCode',                  'Code',                  'string',      false, false, 10),
      col('typeName',                    'Name',                  'string',      false, false, 100),
      col('homeBalancingAuthorityId',      'Home Balancing Authority', 'foreign_key', true, false, null, null, 'balancing_authority'),
      col('settlementBasis',                'Settlement Basis',      'enum',        false, false, null, ['DA_LMP_DIFFERENCE', 'RT_LMP_DIFFERENCE']),
      col('allocationMethod',                 'Allocation Method',     'enum',        false, false, null, ['AUCTION', 'ARR_ALLOCATION', 'BILATERAL_TRANSFER']),
      col('description',                        'Description',           'string',      true,  false, 300),
      col('isActive',                             'Active',                'boolean',     false, false, null),
    ],
  },

  // Lightweight `product` entry — NOT registered as its own Static Data tab
  // (Products already has its own dedicated page/store in etrmHandlers.ts;
  // duplicating that here would violate "single source of GUI"). Exists
  // purely so FK columns pointing at product_id (power_product_detail, and
  // any future 1:1 product-extension table) can resolve a real label instead
  // of a raw id.
  product: {
    tableName: 'product', displayName: 'Products', primaryKeyColumn: 'productId', isTemporal: false,
    columns: [
      col('productId',   'ID',   'number', false, true,  null),
      col('productCode', 'Code', 'string', false, false, 30),
      col('productName', 'Name', 'string', false, false, 200),
    ],
  },

  // Lightweight `storage_facility` mirror — same rationale as `product` above.
  // Field name is `facilityId` (the real backend PK) even though the
  // dedicated Storage Facilities page's own store calls it `storageId` —
  // this mirror exists only so lng_terminal_detail.facility_id resolves to a
  // real label, not to duplicate that page.
  storage_facility: {
    tableName: 'storage_facility', displayName: 'Storage Facilities', primaryKeyColumn: 'facilityId', isTemporal: false,
    columns: [
      col('facilityId',   'ID',   'number', false, true,  null),
      col('facilityCode', 'Code', 'string', false, false, 30),
      col('facilityName', 'Name', 'string', false, false, 200),
    ],
  },

  // V66 — LNG terminal capacity detail, 1:1 extension of storage_facility
  // (only populated for facility_type = 'LNG_TANK' rows).
  lng_terminal_detail: {
    tableName: 'lng_terminal_detail', displayName: 'LNG Terminal Detail', primaryKeyColumn: 'facilityId', isTemporal: false,
    columns: [
      col('facilityId',               'Storage Facility',        'foreign_key', false, true,  null, null, 'storage_facility'),
      col('terminalType',             'Terminal Type',           'enum',        false, false, null, ['IMPORT_REGAS', 'EXPORT_LIQUEFACTION', 'FSRU', 'DUAL']),
      col('regasCapacityMmscmd',      'Regas Capacity (mmscm/d)', 'number',     true,  false, null, null, null, null, true),
      col('liquefactionCapacityMtpa', 'Liquefaction Capacity (MTPA)', 'number', true,  false, null, null, null, null, true),
      col('storageCapacityCbm',       'Storage Capacity (CBM)',  'number',      true,  false, null, null, null, null, true),
      col('numStorageTanks',          'Storage Tanks',           'number',      true,  false, null),
      col('numBerths',                'Berths',                 'number',      true,  false, null),
      col('minCargoSizeCbm',          'Min Cargo Size (CBM)',    'number',      true,  false, null, null, null, null, true),
      col('maxCargoSizeCbm',          'Max Cargo Size (CBM)',    'number',      true,  false, null, null, null, null, true),
      col('notes',                    'Notes',                   'string',      true,  false, 500),
    ],
  },

  // V67 — commodity_grade_standard: named grade tiers with a discount/premium
  // schedule vs. the contract par grade, linked from commodity_family.
  commodity_grade_standard: {
    tableName: 'commodity_grade_standard', displayName: 'Commodity Grade Standards', primaryKeyColumn: 'gradeStandardId', isTemporal: false,
    columns: [
      col('gradeStandardId',        'ID',                    'number',      false, true,  null),
      // V69: rescoped from commodity_family_id to product_id — real exchange
      // grade differential schedules are per listed contract (CBOT Corn's
      // schedule differs from CBOT Wheat's, even though both are GRAINS).
      col('productId',              'Product',               'foreign_key', false, false, null, null, 'product'),
      col('issuingBody',            'Issuing Body',          'string',      false, false, 50),
      col('gradeCode',              'Grade Code',            'string',      false, false, 30),
      col('gradeName',              'Grade Name',            'string',      false, false, 150),
      col('isParGrade',             'Par Grade',             'boolean',     false, false, null),
      col('priceAdjustmentPerUom',  'Price Adjustment',      'number',      false, false, null, null, null, null, true),
      col('adjustmentCurrencyId',   'Adjustment Currency',   'foreign_key', true,  false, null, null, 'currency'),
      // uom isn't a tier2-registered table, so this can't use the generic
      // foreign_key resolution (see the uomId 'placeholder' precedent in
      // makeExchangeMeta above) — stored as a plain numeric id. The row data
      // also carries a denormalized adjustmentUomCode (not a form/grid
      // column here) so TradeBlotter.tsx can display the short UoM code
      // directly without its own lookup.
      col('adjustmentUomId',        'Adjustment UoM',        'number',      true,  false, null),
      col('description',            'Description',           'string',     true,  false, 500),
      col('isActive',               'Active',                'boolean',     false, false, null),
    ],
  },

  // V68 — metal_brand: LME-style approved brand register (producer + metal
  // form), the real mechanism determining what physical metal is deliverable
  // against an exchange contract — replaces the previous boolean-only flag.
  metal_brand: {
    tableName: 'metal_brand', displayName: 'Metal Brand Register', primaryKeyColumn: 'metalBrandId', isTemporal: false,
    columns: [
      col('metalBrandId',       'ID',                'number',      false, true,  null),
      col('commodityFamilyId',  'Commodity Family',  'foreign_key', false, false, null, null, 'commodity_family'),
      col('brandCode',          'Brand Code',        'string',      false, false, 30),
      col('brandName',          'Brand Name',        'string',      false, false, 150),
      col('producerName',       'Producer',          'string',      true,  false, 200),
      col('metalForm',          'Metal Form',        'enum',        false, false, null, ['CATHODE', 'CATHODE_FULL_PLATE', 'INGOT', 'WIRE_ROD', 'PIG', 'BAR', 'GRANULES', 'BRIQUETTE', 'SLAB', 'OTHER']),
      col('countryOfOriginId',  'Country of Origin', 'foreign_key', true,  false, null, null, 'country'),
      col('approvalDate',       'Approval Date',     'date',        true,  false, null),
      col('delistingDate',      'Delisting Date',    'date',        true,  false, null),
      col('isActive',           'Active',            'boolean',     false, false, null),
    ],
  },

  // Lightweight `counterparty` mirror — same rationale as `product`/
  // `storage_facility` above: counterparty has its own dedicated feature
  // module/store, not this file's rowSeed, so this exists purely for FK
  // label resolution (insurance_provider.counterparty_id, transport_operator
  // .counterparty_id), not to duplicate the Counterparty page.
  counterparty: {
    tableName: 'counterparty', displayName: 'Counterparties', primaryKeyColumn: 'counterpartyId', isTemporal: false,
    columns: [
      col('counterpartyId', 'ID',   'number', false, true,  null),
      col('cpCode',         'Code', 'string', false, false, 20),
      col('legalName',      'Name', 'string', false, false, 300),
    ],
  },

  // Lightweight `vessel` mirror — same FK-resolution-only rationale as
  // product/storage_facility/counterparty above. Vessels has its own
  // dedicated page/store in etrmHandlers.ts (vesselId 1 = NORDIC LUNA);
  // this exists purely so V96's lng_boil_off_rule.vessel_id resolves to a
  // real label instead of a raw id.
  vessel: {
    tableName: 'vessel', displayName: 'Vessels', primaryKeyColumn: 'vesselId', isTemporal: false,
    columns: [
      col('vesselId',   'ID',   'number', false, true,  null),
      col('imoNumber',  'IMO',  'string', false, false, 10),
      col('vesselName', 'Name', 'string', false, false, 200),
    ],
  },

  // Lightweight `unit_of_measure` mirror — closes the pre-existing gap noted
  // next to freight_rate_index's uomId placeholder further down (no `uom`
  // mock table existed at all before this). V96's metal_assay_component_rule
  // .penalty_uom_id and agri_moisture_discount_scale.discount_uom_id both
  // carry a real FK to dbo.unit_of_measure, so this is a real resolution
  // target, not another placeholder. Ids/order match the real V1 seed
  // (01_master_data_foundation.sql): 1=BBL...10=BUSHEL...12=MT_MET.
  unit_of_measure: {
    tableName: 'unit_of_measure', displayName: 'Units of Measure', primaryKeyColumn: 'uomId', isTemporal: false,
    columns: [
      col('uomId',   'ID',   'number', false, true,  null),
      col('uomCode', 'Code', 'string', false, false, 20),
      col('uomName', 'Name', 'string', false, false, 100),
    ],
  },

  // Lightweight `legal_entity` mirror — same rationale as `vessel` above.
  // Legal Entities has its own dedicated page/store (`legalEntitiesRef` in
  // etrmHandlers.ts); exists purely so V96's intercompany_transfer_rule
  // source/destination FKs resolve to a real label.
  legal_entity: {
    tableName: 'legal_entity', displayName: 'Legal Entities', primaryKeyColumn: 'legalEntityId', isTemporal: false,
    columns: [
      col('legalEntityId', 'ID',   'number', false, true,  null),
      col('entityCode',    'Code', 'string', false, false, 20),
      col('name',          'Name', 'string', false, false, 200),
    ],
  },

  // Lightweight `payment_term` mirror — same rationale as `vessel` above.
  // Payment Terms has its own dedicated page/store in etrmHandlers.ts
  // (paymentTermId 1 = NET_30); exists purely so V96's
  // payment_calendar_assignment.payment_term_id resolves to a real label.
  payment_term: {
    tableName: 'payment_term', displayName: 'Payment Terms', primaryKeyColumn: 'paymentTermId', isTemporal: false,
    columns: [
      col('paymentTermId', 'ID',   'number', false, true,  null),
      col('termCode',      'Code', 'string', false, false, 30),
      col('termName',      'Name', 'string', false, false, 200),
    ],
  },

  // Lightweight `location` mirror — same rationale as `vessel` above.
  // Locations has its own dedicated page/store in etrmHandlers.ts
  // (locationId 1 = SULLOM-VOE); exists purely so V96's
  // payment_calendar_assignment.location_id resolves to a real label.
  location: {
    tableName: 'location', displayName: 'Locations', primaryKeyColumn: 'locationId', isTemporal: false,
    columns: [
      col('locationId',   'ID',   'number', false, true,  null),
      col('locationCode', 'Code', 'string', false, false, 30),
      col('locationName', 'Name', 'string', false, false, 200),
    ],
  },

  // V70 — genuine Static Data registry orphans found during a whole-project
  // master-data review: real backend tables (with real seed data) that had
  // no dedicated page and no frontend mock at all. All four already appear
  // in MasterDataHub.tsx's `live: false` backlog — confirmed planned, not an
  // overlooked concept.
  insurance_provider: {
    tableName: 'insurance_provider', displayName: 'Insurance Providers', primaryKeyColumn: 'providerId', isTemporal: false,
    columns: [
      col('providerId',      'ID',                'number',      false, true,  null),
      col('providerCode',    'Code',              'string',      false, false, 20),
      col('providerName',    'Name',              'string',      false, false, 200),
      col('providerType',    'Provider Type',     'enum',        false, false, null, ['PI_CLUB', 'UNDERWRITER', 'INSURER', 'BROKER', 'REINSURER']),
      col('countryId',       'Country',           'foreign_key', true,  false, null, null, 'country'),
      col('creditRatingId',  'Credit Rating',     'foreign_key', true,  false, null, null, 'credit_rating'),
      col('counterpartyId',  'Counterparty',      'foreign_key', true,  false, null, null, 'counterparty'),
      col('isActive',        'Active',            'boolean',     false, false, null),
      col('notes',           'Notes',             'string',      true,  false, 300),
    ],
  },
  interest_rate_index: {
    tableName: 'interest_rate_index', displayName: 'Interest Rate Indices', primaryKeyColumn: 'rateIndexId', isTemporal: false,
    columns: [
      col('rateIndexId',         'ID',                  'number',      false, true,  null),
      col('indexCode',           'Code',                'string',      false, false, 20),
      col('indexName',           'Name',                'string',      false, false, 200),
      col('currencyId',          'Currency',            'foreign_key', false, false, null, null, 'currency'),
      col('tenor',                'Tenor',               'string',      true,  false, 20),
      col('dayCountConvention',   'Day Count Convention','enum',        false, false, null, ['ACT_360', 'ACT_365', 'ACT_ACT', '30_360', 'ACT_365F']),
      col('compounding',           'Compounding',         'enum',        false, false, null, ['SIMPLE', 'COMPOUNDED', 'OVERNIGHT_COMPOUNDED']),
      col('publicationSource',      'Publication Source',  'string',      true,  false, 100),
      col('isRfrr',                   'Risk-Free Rate',      'boolean',     false, false, null),
      col('isActive',                   'Active',              'boolean',     false, false, null),
      col('description',                  'Description',         'string',      true,  false, 300),
    ],
  },
  regulatory_report_type: {
    tableName: 'regulatory_report_type', displayName: 'Regulatory Report Types', primaryKeyColumn: 'reportTypeId', isTemporal: false,
    columns: [
      col('reportTypeId',       'ID',                 'number',  false, true,  null),
      col('reportCode',         'Code',               'string',  false, false, 30),
      col('reportName',         'Name',               'string',  false, false, 200),
      col('regulation',         'Regulation',         'enum',    false, false, null, ['EMIR', 'REMIT', 'CFTC', 'DODD_FRANK', 'MIFID2', 'SFTR', 'UK_EMIR', 'ASIC', 'MAS', 'INTERNAL', 'OTHER']),
      col('jurisdictionId',     'Jurisdiction',       'foreign_key', true, false, null, null, 'country'),
      col('submissionTarget',   'Submission Target',  'string',  true,  false, 100),
      col('reportingDeadline',  'Reporting Deadline',  'string', true,  false, 100),
      col('reportFormat',        'Report Format',       'string', true,  false, 20),
      col('isMandatory',           'Mandatory',           'boolean', false, false, null),
      col('isActive',                'Active',              'boolean', false, false, null),
      col('description',                'Description',         'string',  true,  false, 500),
    ],
  },
  transport_operator: {
    tableName: 'transport_operator', displayName: 'Transport Operators', primaryKeyColumn: 'operatorId', isTemporal: false,
    columns: [
      col('operatorId',      'ID',            'number',      false, true,  null),
      col('operatorCode',    'Code',          'string',      false, false, 20),
      col('operatorName',    'Name',          'string',      false, false, 200),
      col('operatorType',    'Operator Type', 'foreign_key', false, false, null, null, 'lookup_value', 'OPERATOR_TYPE'),
      col('motTypeId',       'MOT Type',      'foreign_key', true,  false, null, null, 'mot_type'),
      col('countryId',       'Country',       'foreign_key', true,  false, null, null, 'country'),
      col('counterpartyId',  'Counterparty',  'foreign_key', true,  false, null, null, 'counterparty'),
      col('isActive',        'Active',        'boolean',     false, false, null),
      col('notes',           'Notes',         'string',      true,  false, 500),
    ],
  },

  // V71 — genuine registry orphans deliberately excluded from MasterDataHub's
  // plan initially, investigated and confirmed worth adding: collateral_type
  // connects to a known gap (margin_agreement.eligible_collateral is free
  // text); event_category/event_type and external_system have real schemas
  // but no consumer yet (no notification engine / integrations built) — added
  // as plain reference data ahead of those features.
  collateral_type: {
    tableName: 'collateral_type', displayName: 'Collateral Types', primaryKeyColumn: 'collateralTypeId', isTemporal: false,
    columns: [
      col('collateralTypeId',   'ID',                'number',  false, true,  null),
      col('typeCode',           'Code',              'string',  false, false, 30),
      col('typeName',           'Name',              'string',  false, false, 100),
      col('assetClass',         'Asset Class',       'enum',    false, false, null, ['CASH', 'GOVERNMENT_BOND', 'CORPORATE_BOND', 'EQUITY', 'LETTER_OF_CREDIT', 'BANK_GUARANTEE', 'COMMODITY', 'OTHER']),
      col('standardHaircutPct', 'Standard Haircut %', 'number', false, false, null, null, null, null, true),
      col('isActive',           'Active',            'boolean', false, false, null),
      col('description',        'Description',       'string',  true,  false, 300),
    ],
  },
  event_category: {
    tableName: 'event_category', displayName: 'Event Categories', primaryKeyColumn: 'categoryId', isTemporal: false,
    columns: [
      col('categoryId',   'ID',          'number',  false, true,  null),
      col('categoryCode', 'Code',        'string',  false, false, 30),
      col('categoryName', 'Name',        'string',  false, false, 100),
      col('description',  'Description', 'string',  true,  false, 300),
      col('isActive',     'Active',      'boolean', false, false, null),
    ],
  },
  event_type: {
    tableName: 'event_type', displayName: 'Event Types', primaryKeyColumn: 'eventTypeId', isTemporal: false,
    columns: [
      col('eventTypeId',           'ID',                  'number',      false, true,  null),
      col('categoryId',            'Category',            'foreign_key', false, false, null, null, 'event_category'),
      col('eventCode',             'Code',                'string',      false, false, 50),
      col('eventName',             'Name',                'string',      false, false, 200),
      col('entityType',            'Entity Type',         'enum',        false, false, null, ['TRADE', 'POSITION', 'DELIVERY', 'NOMINATION', 'SETTLEMENT', 'INVOICE', 'PAYMENT', 'RISK', 'CREDIT', 'MARGIN', 'MARKET_DATA', 'SYSTEM', 'USER', 'COUNTERPARTY', 'VESSEL', 'PIPELINE', 'OTHER']),
      col('severity',              'Severity',            'enum',        false, false, null, ['INFO', 'WARNING', 'ALERT', 'CRITICAL', 'BREACH']),
      col('requiresAction',        'Requires Action',     'boolean',     false, false, null),
      col('requiresApproval',      'Requires Approval',   'boolean',     false, false, null),
      col('triggersNotification',  'Triggers Notification', 'boolean',   false, false, null),
      col('slaMinutes',            'SLA (Minutes)',       'number',      true,  false, null),
      col('isReportable',          'Reportable',          'boolean',     false, false, null),
      col('isActive',              'Active',              'boolean',     false, false, null),
      col('description',           'Description',         'string',      true,  false, 500),
    ],
  },
  external_system: {
    tableName: 'external_system', displayName: 'External Systems', primaryKeyColumn: 'externalSystemId', isTemporal: false,
    columns: [
      col('externalSystemId', 'ID',             'number',  false, true,  null),
      col('systemCode',       'Code',           'string',  false, false, 30),
      col('systemName',       'Name',           'string',  false, false, 150),
      col('systemType',       'System Type',    'enum',    false, false, null, ['MARKET_DATA', 'ERP', 'CTRM', 'SHIPPING', 'BANK', 'REGULATORY', 'RISK', 'AIS_TRACKING', 'OTHER']),
      col('vendorName',       'Vendor',         'string',  true,  false, 150),
      col('connectionType',   'Connection Type', 'enum',   true,  false, null, ['API', 'SFTP', 'FILE', 'MANUAL', 'MESSAGE_QUEUE']),
      col('baseUrl',          'Base URL',       'string',  true,  false, 500),
      col('ownerTeam',        'Owner Team',     'string',  true,  false, 100),
      col('isActive',         'Active',         'boolean', false, false, null),
      col('notes',            'Notes',          'string',  true,  false, 500),
    ],
  },

  // V72 — credit_term: reusable reference template (not counterparty-scoped
  // itself — no counterparty_id column), same role as payment_term. Assigned
  // to a counterparty via cp_commercial_terms.credit_term_id.
  credit_term: {
    tableName: 'credit_term', displayName: 'Credit Terms', primaryKeyColumn: 'creditTermId', isTemporal: false,
    columns: [
      col('creditTermId',        'ID',                    'number',  false, true,  null),
      col('termCode',            'Code',                  'string',  false, false, 30),
      col('termName',            'Name',                  'string',  false, false, 200),
      col('creditPeriodDays',    'Credit Period (Days)',  'number',  false, false, null),
      col('collateralType',      'Collateral Type',       'enum',    true,  false, null, ['NONE', 'CASH', 'LETTER_OF_CREDIT', 'PARENT_GUARANTEE', 'BANK_GUARANTEE', 'PLEDGE', 'OTHER']),
      col('marginCallThreshold', 'Margin Call Threshold', 'number',  true,  false, null, null, null, null, true),
      col('marginCallCurrencyId','Margin Call Currency',  'foreign_key', false, false, null, null, 'currency'),
      col('nettingEligible',     'Netting Eligible',      'boolean', false, false, null),
      col('requiresIsda',        'Requires ISDA',         'boolean', false, false, null),
      col('description',         'Description',           'string', true,  false, 500),
      col('isActive',            'Active',                'boolean', false, false, null),
    ],
  },

  // Lightweight holiday_calendar mirror — same FK-resolution-only rationale
  // as product/storage_facility/counterparty above (has its own dedicated
  // HolidayCalendarsPage.tsx, not registered here).
  holiday_calendar: {
    tableName: 'holiday_calendar', displayName: 'Holiday Calendars', primaryKeyColumn: 'calendarId', isTemporal: false,
    columns: [
      col('calendarId',   'ID',   'number', false, true,  null),
      col('calendarCode', 'Code', 'string', false, false, 20),
      col('calendarName', 'Name', 'string', false, false, 200),
    ],
  },

  // V73 — fx_rate, settlement_calendar, trade_repository: flat reference/
  // bridge tables (no real workflow), fit the generic Static Data mechanism.
  fx_rate: {
    tableName: 'fx_rate', displayName: 'FX Rates', primaryKeyColumn: 'fxRateId', isTemporal: false,
    columns: [
      col('fxRateId',        'ID',              'number',      false, true,  null),
      col('fromCurrencyId',  'From Currency',   'foreign_key', false, false, null, null, 'currency'),
      col('toCurrencyId',    'To Currency',     'foreign_key', false, false, null, null, 'currency'),
      col('rate',            'Rate',            'number',      false, false, null, null, null, null, true),
      col('rateDate',        'Rate Date',       'date',        false, false, null),
      col('rateType',        'Rate Type',       'enum',        false, false, null, ['EOD', 'INTRADAY', 'SETTLEMENT', 'FIXING', 'MID']),
      col('source',          'Source',          'string',      true,  false, 50),
    ],
  },
  settlement_calendar: {
    tableName: 'settlement_calendar', displayName: 'Settlement Calendars', primaryKeyColumn: 'scId', isTemporal: false,
    columns: [
      col('scId',        'ID',              'number',      false, true,  null),
      col('productId',   'Product',         'foreign_key', false, false, null, null, 'product'),
      col('calendarId',  'Holiday Calendar','foreign_key', false, false, null, null, 'holiday_calendar'),
      col('priority',    'Priority',        'number',      false, false, null),
      col('isActive',    'Active',          'boolean',     false, false, null),
    ],
  },
  trade_repository: {
    tableName: 'trade_repository', displayName: 'Trade Repositories', primaryKeyColumn: 'repositoryId', isTemporal: false,
    columns: [
      col('repositoryId',    'ID',              'number',      false, true,  null),
      col('repositoryCode',  'Code',            'string',      false, false, 20),
      col('repositoryName',  'Name',            'string',      false, false, 200),
      col('regulation',      'Regulation',      'enum',        false, false, null, ['EMIR', 'REMIT', 'CFTC', 'DODD_FRANK', 'MIFID2', 'SFTR', 'UK_EMIR', 'ASIC', 'MAS', 'INTERNAL', 'OTHER']),
      col('jurisdiction',    'Jurisdiction',    'string',      true,  false, 2),
      col('operatorCpId',    'Operator',        'foreign_key', true,  false, null, null, 'counterparty'),
      col('submissionUrl',   'Submission URL',  'string',      true,  false, 300),
      col('submissionFormat','Submission Format','enum',       true,  false, null, ['XML', 'REST', 'SFTP']),
      col('isActive',        'Active',          'boolean',     false, false, null),
      col('notes',           'Notes',           'string',      true,  false, 300),
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════
  // V96 — Commodity-specific master data: Metals warrants/assay, LNG
  // boil-off, Power pnode/ancillary services, Agri moisture/crop-year, and
  // multi-country intercompany/payment-calendar guardrails. See
  // 96_commodity_specific_master_data.sql for the full review/rationale —
  // every FK below matches a real constraint added in that migration.
  // ═══════════════════════════════════════════════════════════════════════
  metal_warrant: {
    tableName: 'metal_warrant', displayName: 'Metal Warrants', primaryKeyColumn: 'warrantId', isTemporal: false,
    columns: [
      col('warrantId',            'ID',                  'number',      false, true,  null),
      col('warrantNumber',        'Warrant Number',      'string',      false, false, 50),
      col('facilityId',           'Vault Facility',      'foreign_key', false, false, null, null, 'storage_facility'),
      col('productId',            'Product',             'foreign_key', false, false, null, null, 'product'),
      col('metalBrandId',         'Brand',               'foreign_key', false, false, null, null, 'metal_brand'),
      col('metalShapeId',         'Shape',               'foreign_key', false, false, null, null, 'metal_shape'),
      col('slotVaultLocation',    'Slot/Vault Location', 'string',      true,  false, 50),
      col('netWeightMt',          'Net Weight (MT)',     'number',      false, false, null, null, null, null, true),
      col('warrantDate',          'Warrant Date',        'date',        false, false, null),
      col('rentPaidThroughDate',  'Rent Paid Through',   'date',        true,  false, null),
      col('isPledgedCollateral',  'Pledged as Collateral', 'boolean',   false, false, null),
      col('holderCounterpartyId', 'Holder',              'foreign_key', true,  false, null, null, 'counterparty'),
      col('isActive',             'Active',              'boolean',     false, false, null),
      col('notes',                'Notes',               'string',      true,  false, 500),
    ],
  },
  metal_assay_component_rule: {
    tableName: 'metal_assay_component_rule', displayName: 'Metal Assay Component Rules', primaryKeyColumn: 'ruleId', isTemporal: false,
    columns: [
      col('ruleId',                  'ID',                'number',      false, true,  null),
      col('productId',                'Product',           'foreign_key', false, false, null, null, 'product'),
      col('elementCode',               'Element',           'string',      false, false, 10),
      col('elementType',                'Element Type',      'enum',        false, false, null, ['PAYABLE', 'PENALTY', 'IMPURITY']),
      col('baseContentPct',              'Base Content (%)',  'number',      false, false, null, null, null, null, true),
      col('rejectionThresholdPct',        'Rejection Threshold (%)', 'number', true, false, null, null, null, null, true),
      col('penaltyPerPpmOverBase',         'Penalty per PPM Over Base', 'number', true, false, null, null, null, null, true),
      col('penaltyCurrencyId',              'Penalty Currency',  'foreign_key', true,  false, null, null, 'currency'),
      col('penaltyUomId',                    'Penalty UoM',       'foreign_key', true,  false, null, null, 'unit_of_measure'),
      col('isActive',                          'Active',            'boolean',     false, false, null),
      col('notes',                               'Notes',             'string',      true,  false, 500),
    ],
  },
  lng_boil_off_rule: {
    tableName: 'lng_boil_off_rule', displayName: 'LNG Boil-Off Rules', primaryKeyColumn: 'ruleId', isTemporal: false,
    columns: [
      col('ruleId',                     'ID',                        'number',      false, true,  null),
      col('ruleCode',                    'Code',                      'string',      false, false, 30),
      col('ruleName',                     'Name',                      'string',      false, false, 150),
      col('vesselId',                      'Vessel',                    'foreign_key', true,  false, null, null, 'vessel'),
      col('facilityId',                     'Storage Facility',          'foreign_key', true,  false, null, null, 'storage_facility'),
      col('dailyBoilOffRatePct',              'Daily Boil-Off Rate (%)',   'number',      false, false, null, null, null, null, true),
      col('isForcingBoilOffAllowed',           'Forcing Boil-Off Allowed',  'boolean',     false, false, null),
      col('effectiveFrom',                       'Effective From',           'date',        true,  false, null),
      col('effectiveTo',                           'Effective To',              'date',        true,  false, null),
      col('isActive',                                'Active',                    'boolean',     false, false, null),
      col('notes',                                     'Notes',                     'string',      true,  false, 500),
    ],
  },
  power_pnode: {
    tableName: 'power_pnode', displayName: 'Power Pricing Nodes', primaryKeyColumn: 'pnodeId', isTemporal: false,
    columns: [
      col('pnodeId',              'ID',                  'number',      false, true,  null),
      col('pnodeMarketName',       'Market Node Name',    'string',      false, false, 50),
      col('balancingAuthorityId',   'Balancing Authority', 'foreign_key', false, false, null, null, 'balancing_authority'),
      col('transmissionZoneId',      'Transmission Zone',   'foreign_key', true,  false, null, null, 'transmission_zone'),
      col('nodeType',                  'Node Type',           'enum',        false, false, null, ['HUB', 'INTERFACE', 'BUS', 'ZONE']),
      col('isActive',                    'Active',              'boolean',     false, false, null),
      col('notes',                         'Notes',               'string',      true,  false, 500),
    ],
  },
  power_ancillary_service_type: {
    tableName: 'power_ancillary_service_type', displayName: 'Power Ancillary Service Types', primaryKeyColumn: 'serviceTypeId', isTemporal: false,
    columns: [
      col('serviceTypeId',         'ID',                  'number',      false, true,  null),
      col('serviceCode',            'Code',                'string',      false, false, 30),
      col('serviceName',             'Name',                'string',      false, false, 150),
      col('balancingAuthorityId',      'Balancing Authority', 'foreign_key', false, false, null, null, 'balancing_authority'),
      col('description',                 'Description',         'string',      true,  false, 500),
      col('isActive',                      'Active',              'boolean',     false, false, null),
    ],
  },
  agri_moisture_discount_scale: {
    tableName: 'agri_moisture_discount_scale', displayName: 'Agri Moisture Discount Scales', primaryKeyColumn: 'scaleId', isTemporal: false,
    columns: [
      col('scaleId',                 'ID',                       'number',      false, true,  null),
      col('gradeStandardId',          'Grade Standard',           'foreign_key', false, false, null, null, 'commodity_grade_standard'),
      col('moisturePctMin',            'Moisture % Min',           'number',      false, false, null, null, null, null, true),
      col('moisturePctMax',             'Moisture % Max',           'number',      false, false, null, null, null, null, true),
      col('priceDiscountPerUom',          'Price Discount',           'number',      false, false, null, null, null, null, true),
      col('discountCurrencyId',             'Discount Currency',        'foreign_key', false, false, null, null, 'currency'),
      col('discountUomId',                   'Discount UoM',             'foreign_key', false, false, null, null, 'unit_of_measure'),
      col('weightShrinkageFactorPct',           'Weight Shrinkage Factor (%)', 'number', true, false, null, null, null, null, true),
      col('isActive',                              'Active',                   'boolean',     false, false, null),
      col('notes',                                   'Notes',                    'string',      true,  false, 500),
    ],
  },
  agri_crop_year_lifecycle: {
    tableName: 'agri_crop_year_lifecycle', displayName: 'Agri Crop Year Lifecycle', primaryKeyColumn: 'lifecycleId', isTemporal: false,
    columns: [
      col('lifecycleId',            'ID',                  'number',      false, true,  null),
      col('commodityId',             'Commodity',           'foreign_key', false, false, null, null, 'commodity'),
      col('countryId',                 'Country',             'foreign_key', false, false, null, null, 'country'),
      col('cropYearLabel',              'Crop Year',           'string',      false, false, 20),
      col('harvestStartDate',             'Harvest Start',       'date',        false, false, null),
      col('harvestEndDate',                 'Harvest End',         'date',        false, false, null),
      col('regulatoryCutoffDate',             'Regulatory Cutoff',   'date',        true,  false, null),
      col('isActive',                           'Active',              'boolean',     false, false, null),
      col('notes',                                'Notes',               'string',      true,  false, 500),
    ],
  },
  intercompany_transfer_rule: {
    tableName: 'intercompany_transfer_rule', displayName: 'Intercompany Transfer Rules', primaryKeyColumn: 'ruleId', isTemporal: false,
    columns: [
      col('ruleId',                       'ID',                       'number',      false, true,  null),
      col('sourceLegalEntityId',           'Source Legal Entity',      'foreign_key', false, false, null, null, 'legal_entity'),
      col('destinationLegalEntityId',        'Destination Legal Entity', 'foreign_key', false, false, null, null, 'legal_entity'),
      col('transferPricingMarkupType',         'Markup Type',             'enum',        false, false, null, ['FLAT', 'PERCENT', 'INDEX_OFFSET']),
      col('markupValue',                          'Markup Value',            'number',      false, false, null, null, null, null, true),
      col('markupCurrencyId',                       'Markup Currency',         'foreign_key', true,  false, null, null, 'currency'),
      col('automaticBookingEnabled',                   'Automatic Booking',       'boolean',     false, false, null),
      col('isActive',                                    'Active',                  'boolean',     false, false, null),
      col('notes',                                         'Notes',                   'string',      true,  false, 500),
    ],
  },
  payment_calendar_assignment: {
    tableName: 'payment_calendar_assignment', displayName: 'Payment Calendar Assignments', primaryKeyColumn: 'assignmentId', isTemporal: false,
    columns: [
      col('assignmentId',                   'ID',                     'number',      false, true,  null),
      col('paymentTermId',                    'Payment Term',           'foreign_key', false, false, null, null, 'payment_term'),
      col('currencyId',                         'Currency',               'foreign_key', false, false, null, null, 'currency'),
      col('locationId',                           'Location',               'foreign_key', true,  false, null, null, 'location'),
      col('primaryHolidayCalendarId',                'Primary Calendar',       'foreign_key', false, false, null, null, 'holiday_calendar'),
      col('secondaryHolidayCalendarId',                 'Secondary Calendar',     'foreign_key', true,  false, null, null, 'holiday_calendar'),
      col('isActive',                                      'Active',                 'boolean',     false, false, null),
      col('notes',                                           'Notes',                  'string',      true,  false, 500),
    ],
  },
};

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Mirrors master_data_table_registry. Only a subset of the ~120 eventual Tier 2
 * tables are seeded here — enough to prove the generic mechanism works across
 * every column shape. Adding the rest is one entry in PARENT_LOOKUP_TABLES,
 * not new code (per the Master Data Entry Technical Design doc).
 */
export const registrySeed: RegistryEntry[] = [
  { registryId: 1, tableName: 'currency',            displayName: 'Currencies',           moduleGroup: 'Finance & Settlement', subGroup: 'Global Codes',      description: 'ISO 4217 currency codes used across all monetary fields. The 3-letter alphabetic code (e.g. USD, EUR, GBP) is enforced. Reference: iso.org/iso-4217-currency-codes.html', allowCreate: true,  allowEdit: true,  allowDelete: false, allowExcelUpload: true,  isEnabled: true, displayOrder: 1 },
  { registryId: 2, tableName: 'commodity',           displayName: 'Commodities',          moduleGroup: 'Products & Markets', subGroup: 'Classification',    description: 'Top-level commodity classification — Oil, Gas, Power, Agricultural, Metals, and Other. Drives product group assignment, applicable trade types, and pricing curve linkage.',                                allowCreate: true,  allowEdit: true,  allowDelete: false, allowExcelUpload: false, isEnabled: true, displayOrder: 2 },
  { registryId: 3, tableName: 'credit_rating',       displayName: 'Credit Ratings',       moduleGroup: 'Counterparties & Agreements', subGroup: 'Classification',    description: 'S&P, Moody\'s, and Fitch credit rating scales with numeric equivalents. Used to derive credit exposure limits and margin requirements for each counterparty.',                                                   allowCreate: true,  allowEdit: true,  allowDelete: true,  allowExcelUpload: false, isEnabled: true, displayOrder: 3 },
  { registryId: 4, tableName: 'incoterm',            displayName: 'Incoterms',            moduleGroup: 'Contract & Legal', subGroup: 'Global Codes',      description: 'ICC Incoterms® 2020 rules that define the point at which risk and cost transfer from seller to buyer. Reference: iccwbo.org/resources-for-business/incoterms-rules',                            allowCreate: true,  allowEdit: true,  allowDelete: false, allowExcelUpload: false, isEnabled: true, displayOrder: 4 },
  { registryId: 5, tableName: 'charter_party_type',  displayName: 'Charter Party Types',  moduleGroup: 'Freight & Shipping',   subGroup: 'Charter',           description: 'Types of vessel charter arrangements — Voyage Charter (fixed route, per tonne) or Time Charter (per day, operator controls routing). Determines freight cost calculation and demurrage liability.',     allowCreate: true,  allowEdit: true,  allowDelete: true,  allowExcelUpload: false, isEnabled: true, displayOrder: 1 },
  { registryId: 6, tableName: 'load_shape_template', displayName: 'Load Shape Templates', moduleGroup: 'Power & Energy',     subGroup: 'Markets',           description: 'Standard electricity delivery profiles — Baseload (7×24), Peak (5×16 or 6×16), Off-peak, and user-defined shapes. Templates constrain the hours delivered under a power supply contract.',               allowCreate: true,  allowEdit: true,  allowDelete: true,  allowExcelUpload: false, isEnabled: true, displayOrder: 1 },
  { registryId: 7, tableName: 'balancing_authority', displayName: 'Balancing Authorities',moduleGroup: 'Power & Energy',     subGroup: 'Markets',           description: 'Grid operators (ISOs/RTOs and utilities) responsible for maintaining real-time balance between supply and demand within their control area — PJM, ERCOT, CAISO, and others.',                        allowCreate: true,  allowEdit: true,  allowDelete: false, allowExcelUpload: false, isEnabled: true, displayOrder: 2 },
  { registryId: 8, tableName: 'transmission_zone',   displayName: 'Transmission Zones',   moduleGroup: 'Power & Energy',     subGroup: 'Grid',              description: 'Pricing and scheduling zones within a balancing authority area — hubs, load zones, and LMP nodes. Each zone has its own congestion and loss components for locational marginal pricing.',            allowCreate: true,  allowEdit: true,  allowDelete: true,  allowExcelUpload: false, isEnabled: true, displayOrder: 3 },
  // V51 — nested shape structure + distributed energy footprints (ids above the 10+i parent-lookup block)
  { registryId: 201, tableName: 'load_shape_interval',   displayName: 'Load Shape Intervals',   moduleGroup: 'Power & Energy', subGroup: 'Markets', description: 'Per-interval MW weighting under a load shape template — the hourly (or 15/30-min) profile behind shaped products such as solar generation or EV charging demand curves.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 4 },
  { registryId: 202, tableName: 'load_shape_component',  displayName: 'Load Shape Components',  moduleGroup: 'Power & Energy', subGroup: 'Markets', description: 'Nested shape structure — composite parent shapes built from weighted child shapes, optionally scoped to a seasonal month window (e.g. ATC = Peak + Off-Peak).',           allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 5 },
  { registryId: 203, tableName: 'energy_footprint',      displayName: 'Energy Footprints',      moduleGroup: 'Power & Energy', subGroup: 'Assets',  description: 'Distributed asset portfolios and networks traded as one unit — solar portfolios, EV charging networks, battery fleets, demand-response aggregations.',                     allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 6 },
  { registryId: 204, tableName: 'energy_footprint_site', displayName: 'Energy Footprint Sites', moduleGroup: 'Power & Energy', subGroup: 'Assets',  description: 'Member sites of an energy footprint — per-site location, settlement zone, capacity, and technology detail (solar array, EV charging hub, battery unit).',                  allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 7 },
  // V53 — freight/demurrage master data enhancement (works across oil, LNG, dry-bulk/metals — NOT power, which doesn't move by vessel)
  { registryId: 205, tableName: 'freight_rate_index',     displayName: 'Freight Rate Indices',      moduleGroup: 'Freight & Shipping', subGroup: 'Charter', description: 'Freight benchmarks — Baltic dry-bulk indices (any dry cargo: ore, coal, grain), Worldscale tanker flat rates, and Spark30S for LNG. Used to set/escalate time charter hire or benchmark voyage freight.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 2 },
  { registryId: 206, tableName: 'laytime_term_template',  displayName: 'Laytime Term Templates',    moduleGroup: 'Freight & Shipping', subGroup: 'Charter', description: 'Standard laytime clauses — which days count (SHINC/SHEX/WWD), whether laytime is reversible, and the NOR-tendering basis (WIPON/WIBON/WIFPON/WCCON) that determines when laytime starts counting.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 3 },
  { registryId: 207, tableName: 'demurrage_dispatch_rate',displayName: 'Demurrage & Dispatch Rates',moduleGroup: 'Freight & Shipping', subGroup: 'Charter', description: 'Standard demurrage/dispatch rates by vessel class and commodity — includes the claim time-bar (days to submit with supporting docs) and despatch basis (all time saved vs. working time only).', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 4 },
  { registryId: 208, tableName: 'laytime_exception_type', displayName: 'Laytime Exception Types',   moduleGroup: 'Freight & Shipping', subGroup: 'Charter', description: 'Standard reasons time is excepted from (or counted against) laytime — weather, strikes, breakdowns, port congestion — used in laytime calculations and demurrage disputes across any vessel-carried commodity.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 5 },
  // V56 — dedicated FX tenor/period master, linked from fx_rate (not a lookup_value category — needs to scale to 1000+ daily-forward rows)
  { registryId: 209, tableName: 'fx_period',              displayName: 'FX Periods / Tenors',       moduleGroup: 'Pricing & Rates',    subGroup: 'FX',      description: 'Standard FX tenors (SPOT, 1M-2Y) plus individual daily-forward periods used to build a full FX forward curve. Linked from fx_rate.fx_period_id — scales to 1000+ daily delivery days without bloating the generic lookup table.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: true, isEnabled: true, displayOrder: 6 },
  // V59 — commodity_family: the missing middle tier between commodity (sector) and product (instrument), replacing product.product_family's raw unconstrained string
  { registryId: 210, tableName: 'commodity_family',       displayName: 'Commodity Families',        moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Grouping of similar products beneath a commodity — e.g. Crude Oil vs Refined Products under Oil, Base vs Precious Metals under Metals. Linked from product.commodity_family_id.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 3 },
  // V60 — reporting_group: independent per-report classification axes (Position, VaR, Settlement/GL) — a product's group can differ per reporting context, unlike commodity_family which is a single taxonomy
  { registryId: 211, tableName: 'reporting_group',        displayName: 'Reporting Groups',          moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Per-report classification groups (Position Reporting, VaR/Risk, Settlement/GL) — a product can sit in a different group per reporting context. Assigned to products via the Products page "Reporting Groups" tab.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 4 },
  // V63 — lookup_value: the generic category+code+display_name table (only REPORTING_CLASSIFICATION_TYPE rows seeded here so far)
  { registryId: 212, tableName: 'lookup_value',           displayName: 'Lookup Values',             moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Generic category/code/display-name reference table. Only the Reporting Classification Type category is populated here — add rows under a new "category" value to introduce a new axis for Reporting Groups.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 5 },
  // V65 — Power registry orphans: real V11/V12 tables/seed data that were never registered, found during an LNG/Power/Agri/Metals master-data review
  { registryId: 213, tableName: 'interconnector',         displayName: 'Interconnectors',           moduleGroup: 'Power & Energy',     subGroup: 'Grid',           description: 'Cross-zone / cross-border transmission links between two transmission zones — the grid-capacity equivalent of a freight route. Directional or bidirectional, with a rated MW capacity.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 8 },
  { registryId: 214, tableName: 'generation_asset',       displayName: 'Generation Assets',         moduleGroup: 'Power & Energy',     subGroup: 'Assets',         description: 'Plant-level technical master data — fuel type, technology, nameplate capacity, and ownership. The power equivalent of `vessel` for oil shipping.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 9 },
  { registryId: 215, tableName: 'power_product_detail',   displayName: 'Power Product Detail',      moduleGroup: 'Power & Energy',     subGroup: 'Markets',        description: '1:1 power-specific extension of a product — default load shape, voltage level, settlement point type (node/zone/hub/system), and whether it is an ancillary-service product.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 10 },
  { registryId: 216, tableName: 'transmission_right_type',displayName: 'Transmission Right Types',  moduleGroup: 'Power & Energy',     subGroup: 'Grid',           description: 'Regional terminology for the same financial transmission-right instrument — FTR (PJM/MISO), CRR (CAISO/ERCOT), TCC (NYISO) — with its settlement basis and allocation method.', allowCreate: true, allowEdit: true, allowDelete: false, allowExcelUpload: false, isEnabled: true, displayOrder: 11 },
  // V66 — lng_terminal_detail: 1:1 LNG extension of storage_facility (send-out/liquefaction capacity, berths, cargo lot size range)
  { registryId: 217, tableName: 'lng_terminal_detail',    displayName: 'LNG Terminal Detail',       moduleGroup: 'Freight & Shipping', subGroup: 'Charter',        description: 'Terminal-level LNG capacity data — regasification send-out rate (import) or liquefaction nameplate (export) in MTPA, storage tank/berth count, and the acceptable cargo-lot size range for scheduling.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 6 },
  // V67 — commodity_grade_standard: named grade tiers (e.g. USDA No. 2 Yellow Corn) with a discount/premium schedule vs. the contract par grade
  { registryId: 218, tableName: 'commodity_grade_standard', displayName: 'Commodity Grade Standards', moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Named grade tiers for a specific product/contract (e.g. CBOT Corn\'s USDA No. 2 Yellow par grade) and the flat price adjustment vs. par for delivering an alternate grade. Scoped per product, not per commodity family — real exchange differential schedules are contract-specific (Corn\'s schedule differs from Wheat\'s). Selectable per order in the Trade Blotter to auto-populate a price adjustment.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 6 },
  // V68 — metal_brand: LME-style approved brand register (producer + metal form) — the real mechanism determining what physical metal is deliverable
  { registryId: 219, tableName: 'metal_brand',              displayName: 'Metal Brand Register',      moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Exchange-approved producer brands by metal form (cathode, ingot, wire rod, etc.) — only brands on this list may be placed on warrant and delivered against an exchange contract.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 7 },
  // V70 — genuine registry orphans found via a whole-project master-data review (all four already in MasterDataHub.tsx's live:false backlog)
  { registryId: 220, tableName: 'insurance_provider',       displayName: 'Insurance Providers',        moduleGroup: 'Credit & Collateral',   subGroup: 'Insurance',   description: 'Insurance companies, P&I clubs, and underwriters — Lloyd\'s syndicates, AIG, Zurich, Euler Hermes — with contact and credit rating, for cargo/credit/political-risk coverage.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 8 },
  { registryId: 221, tableName: 'interest_rate_index',      displayName: 'Interest Rate Indices',      moduleGroup: 'Pricing & Rates',       subGroup: 'FX',          description: 'Reference rate indices (SOFR, EURIBOR, SONIA) with day-count/compounding conventions — used for financing costs, late-payment interest, and commodity-linked structures.', allowCreate: true, allowEdit: true, allowDelete: false, allowExcelUpload: false, isEnabled: true, displayOrder: 7 },
  { registryId: 222, tableName: 'regulatory_report_type',   displayName: 'Regulatory Report Types',    moduleGroup: 'Sanctions & Regulatory Reporting', subGroup: 'Reporting', description: 'Regulatory report type definitions — EMIR, REMIT, CFTC, MiFID II — with submission target and reporting deadline, driving which reports a trade requires.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 1 },
  { registryId: 223, tableName: 'transport_operator',       displayName: 'Transport Operators',        moduleGroup: 'Logistics & Delivery',  subGroup: 'Transport',   description: 'Haulage companies, rail/pipeline operators, ship managers, and terminal operators — coverage area, primary transport mode, and commodity approvals.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 9 },
  // V71 — collateral_type (connects to a known margin_agreement gap), event_category/event_type and external_system (real schema, no consumer built yet)
  { registryId: 224, tableName: 'collateral_type', displayName: 'Collateral Types', moduleGroup: 'Credit & Collateral',   subGroup: 'Collateral', description: 'Eligible collateral asset classes and their standard haircut % — cash, government/corporate bonds, letters of credit, bank guarantees. Reference for margin agreement collateral eligibility.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 10 },
  { registryId: 225, tableName: 'event_category',  displayName: 'Event Categories', moduleGroup: 'Organization & Users', subGroup: 'System',     description: 'Top-level classification for system workflow/lifecycle events — Trade, Delivery, Settlement, Risk, Credit, Market Data, Regulatory.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 10 },
  { registryId: 226, tableName: 'event_type',      displayName: 'Event Types',     moduleGroup: 'Organization & Users', subGroup: 'System',     description: 'Full catalogue of system event codes with severity, SLA, and workflow flags (requires action/approval, triggers notification) — drives the notification engine and audit trail.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 11 },
  { registryId: 227, tableName: 'external_system', displayName: 'External Systems', moduleGroup: 'Organization & Users', subGroup: 'System',    description: 'Integration endpoints — market data vendors, ERP, CTRM, shipping, bank, regulatory systems — for the polymorphic external_system_mapping crosswalk.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 12 },
  // V72 — credit_term: reusable credit-facility term template, referenced by cp_commercial_terms
  { registryId: 228, tableName: 'credit_term', displayName: 'Credit Terms', moduleGroup: 'Counterparties & Agreements', subGroup: 'Terms', description: 'Reusable credit facility terms — credit period, required collateral type, margin call threshold, netting eligibility. Assigned to a counterparty via CP Commercial Terms.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 1 },
  // V73 — fx_rate, settlement_calendar, trade_repository
  { registryId: 229, tableName: 'fx_rate',             displayName: 'FX Rates',             moduleGroup: 'Pricing & Rates',                  subGroup: 'FX',        description: 'Daily FX rates per currency pair — EOD, intraday, settlement, fixing, or mid. Used for P&L revaluation and cross-currency settlement.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: true, isEnabled: true, displayOrder: 8 },
  { registryId: 230, tableName: 'settlement_calendar', displayName: 'Settlement Calendars', moduleGroup: 'Products & Markets',                subGroup: 'Classification', description: 'Which holiday calendars apply to a product\'s settlement date calculation — a product may use multiple (e.g. UK + US bank holidays), with a priority order.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 8 },
  { registryId: 231, tableName: 'trade_repository',    displayName: 'Trade Repositories',   moduleGroup: 'Sanctions & Regulatory Reporting', subGroup: 'Reporting', description: 'Approved trade repositories for regulatory reporting submission — DTCC, REGIS-TR, ICE TVEL — by regime with submission format and endpoint.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 3 },
  // V85 — lookup_category: the category master lookup_value.categoryId now points at
  { registryId: 232, tableName: 'lookup_category',     displayName: 'Lookup Categories',    moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Category master for Lookup Values — add a category here first, then add its code/display-name rows under Lookup Values to introduce a new managed picklist.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 8 },
  // V96 — commodity-specific master data (Metals warrants/assay, LNG
  // boil-off, Power pnode/ancillary services, Agri moisture/crop-year,
  // multi-country intercompany/payment-calendar guardrails)
  { registryId: 233, tableName: 'metal_warrant', displayName: 'Metal Warrants', moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Securitized title document for a specific, discrete physical lot in an exchange-approved vault (LME/CME) — distinct from generic volumetric storage capacity.', allowCreate: true, allowEdit: true, allowDelete: false, allowExcelUpload: false, isEnabled: true, displayOrder: 20 },
  { registryId: 234, tableName: 'metal_assay_component_rule', displayName: 'Metal Assay Component Rules', moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Financial scaling rules applied to concentrate actualizations to calculate premiums/penalties from lab assays (payable/penalty/impurity elements vs. a base content %).', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 21 },
  { registryId: 235, tableName: 'lng_boil_off_rule', displayName: 'LNG Boil-Off Rules', moduleGroup: 'Freight & Shipping', subGroup: 'Charter', description: 'Cryogenic transit/storage vaporization loss curves, scoped to a vessel and/or storage facility, used by the risk and actualization engines to model standard LNG inventory degradation.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 20 },
  { registryId: 236, tableName: 'power_pnode', displayName: 'Power Pricing Nodes', moduleGroup: 'Power & Energy', subGroup: 'Grid', description: 'Low-level LMP settlement granularity — physical grid injection/withdrawal nodes (ISO/RTO standard) under a balancing authority, optionally mapped to a transmission zone.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 10 },
  { registryId: 237, tableName: 'power_ancillary_service_type', displayName: 'Power Ancillary Service Types', moduleGroup: 'Power & Energy', subGroup: 'Markets', description: 'Grid-reliability products traded alongside standard MWh power blocks — spinning reserve, regulation up/down, voltage support — per balancing authority.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 11 },
  { registryId: 238, tableName: 'agri_moisture_discount_scale', displayName: 'Agri Moisture Discount Scales', moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Weighbridge actualization scale — automatic financial weight shrinkage and pricing discount based on grain moisture content, banded off a commodity grade standard.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 22 },
  { registryId: 239, tableName: 'agri_crop_year_lifecycle', displayName: 'Agri Crop Year Lifecycle', moduleGroup: 'Products & Markets', subGroup: 'Classification', description: 'Hard time boundaries for old-crop vs. new-crop futures and physical cash market spreads, per commodity and country.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 23 },
  { registryId: 240, tableName: 'intercompany_transfer_rule', displayName: 'Intercompany Transfer Rules', moduleGroup: 'Counterparties & Agreements', subGroup: 'Terms', description: 'Automates the matching back-to-back internal transfer deal and its transfer-pricing markup whenever the central desk passes position/risk to a country business unit.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 2 },
  { registryId: 241, tableName: 'payment_calendar_assignment', displayName: 'Payment Calendar Assignments', moduleGroup: 'Calendar & Periods', subGroup: 'Calendars', description: 'Junction matrix mapping multi-currency cash obligations to the right holiday-calendar pair, preventing settlement date miscalculations across payment term, currency, and location.', allowCreate: true, allowEdit: true, allowDelete: true, allowExcelUpload: false, isEnabled: true, displayOrder: 5 },
  // V17 parent lookup tables — generated from the simple list above
  ...PARENT_LOOKUP_TABLES.map((t, i) => ({
    registryId:       10 + i,
    tableName:        t.name,
    displayName:      t.label,
    moduleGroup:      t.group,
    subGroup:         t.subGroup,
    description:      t.description,
    allowCreate:      true,
    allowEdit:        true,
    allowDelete:      false,
    allowExcelUpload: false,
    isEnabled:        true,
    displayOrder:     t.order,
  })),
];

export const metadataSeed: Record<string, TableMetadata> = {
  ...SPECIAL_TABLE_METADATA,
  // V17 parent lookup tables — factory generates identical column shape for all 13
  ...Object.fromEntries(PARENT_LOOKUP_TABLES.map((t) => [t.name, makeLookupMeta(t.name, t.label, t.pk)])),
};

export const rowSeed: Record<string, ReferenceDataRow[]> = {
  currency: [
    { currencyId: 1, currencyCode: 'USD', currencyName: 'US Dollar',      symbol: '$', decimalPlaces: 2, isActive: true },
    { currencyId: 2, currencyCode: 'GBP', currencyName: 'British Pound',  symbol: '£', decimalPlaces: 2, isActive: true },
    { currencyId: 3, currencyCode: 'EUR', currencyName: 'Euro',           symbol: '€', decimalPlaces: 2, isActive: true },
  ],
  commodity: [
    { commodityId: 1, commodityCode: 'OIL',    commodityName: 'Oil & Petroleum',     description: 'Crude oil, refined products, NGL, condensate and petrochemicals. Covers all liquid hydrocarbons from wellhead to end-product.', isActive: true },
    { commodityId: 2, commodityCode: 'POWER',  commodityName: 'Power & Electricity', description: 'Electricity generation, transmission, and supply. Includes baseload, peak, renewable, and nuclear power.',                    isActive: true },
    { commodityId: 3, commodityCode: 'GAS',    commodityName: 'Natural Gas',         description: 'Natural gas including pipeline gas, LNG cargoes, LPG, and NGL extraction.',                                                  isActive: true },
    { commodityId: 4, commodityCode: 'AGRI',   commodityName: 'Agricultural',        description: 'Agricultural commodities — grains, oilseeds, softs, livestock and dairy products.',                                          isActive: true },
    { commodityId: 5, commodityCode: 'METALS', commodityName: 'Metals & Mining',     description: 'Base metals (copper, aluminium, zinc, lead, nickel, tin), precious metals (gold, silver, platinum), and ferrous metals.',     isActive: true },
  ],
  // commodityId: 1=OIL, 2=POWER, 3=GAS, 4=AGRI, 5=METALS (see commodity rowSeed above)
  commodity_family: [
    { commodityFamilyId: 1, commodityId: 1, familyCode: 'CRUDE_OIL',        familyName: 'Crude Oil',             familyType: 'CRUDE',         description: 'Unrefined crude — Brent, WTI, Urals, Dubai and other physical/financial crude benchmarks.',        isActive: true },
    { commodityFamilyId: 2, commodityId: 1, familyCode: 'REFINED_PRODUCTS', familyName: 'Refined Products',      familyType: 'REFINED',       description: 'Refined petroleum products — gasoline, diesel/gasoil, jet fuel, fuel oil.',                        isActive: true },
    { commodityFamilyId: 3, commodityId: 1, familyCode: 'PETROCHEMICAL',    familyName: 'Petrochemicals',        familyType: 'PETROCHEMICAL', description: 'Naphtha and other petrochemical feedstocks.',                                                      isActive: true },
    { commodityFamilyId: 4, commodityId: 3, familyCode: 'NATURAL_GAS',      familyName: 'Natural Gas',           familyType: 'PIPELINE_GAS',  description: 'Pipeline-delivered natural gas — TTF, NBP, Henry Hub and similar hub products.',                   isActive: true },
    { commodityFamilyId: 5, commodityId: 3, familyCode: 'LNG',              familyName: 'Liquefied Natural Gas', familyType: 'LNG',           description: 'Liquefied natural gas cargoes — JKM and other LNG benchmarks.',                                    isActive: true },
    { commodityFamilyId: 6, commodityId: 5, familyCode: 'BASE_METALS',      familyName: 'Base Metals',           familyType: 'BASE_METAL',    description: 'Non-ferrous industrial metals — copper, aluminium, zinc, lead, nickel, tin.',                     isActive: true },
    { commodityFamilyId: 7, commodityId: 5, familyCode: 'PRECIOUS_METALS',  familyName: 'Precious Metals',       familyType: 'PRECIOUS_METAL',description: 'Gold, silver, platinum, palladium.',                                                              isActive: true },
    { commodityFamilyId: 8, commodityId: 4, familyCode: 'GRAINS',           familyName: 'Grains',                familyType: 'GRAIN',         description: 'Corn, wheat, soybeans and other grain/oilseed products.',                                          isActive: true },
    { commodityFamilyId: 9, commodityId: 2, familyCode: 'POWER',            familyName: 'Power Generation',      familyType: 'ELECTRICITY',   description: 'Wholesale electricity — baseload, peak, and off-peak power products.',                            isActive: true },
  ],
  // lookupId: 1=POSITION, 2=VAR, 3=SETTLEMENT (see lookup_value rowSeed below)
  reporting_group: [
    { reportingGroupId: 1,  classificationTypeId: 1, groupName: 'Light Distillates',       description: 'Diesel, gasoline, jet fuel — position reports grouped by refined product slate.', isActive: true },
    { reportingGroupId: 2,  classificationTypeId: 1, groupName: 'Crude Oil',               description: 'Crude and crude futures position reporting bucket.',            isActive: true },
    { reportingGroupId: 3,  classificationTypeId: 1, groupName: 'Natural Gas',             description: 'Pipeline gas and LNG position reporting bucket.',               isActive: true },
    { reportingGroupId: 4,  classificationTypeId: 1, groupName: 'Power',                   description: 'Wholesale electricity position reporting bucket.',              isActive: true },
    { reportingGroupId: 5,  classificationTypeId: 1, groupName: 'Metals',                  description: 'Base and precious metals position reporting bucket.',           isActive: true },
    { reportingGroupId: 6,  classificationTypeId: 1, groupName: 'Agricultural',            description: 'Grains and softs position reporting bucket.',                   isActive: true },
    { reportingGroupId: 7,  classificationTypeId: 2, groupName: 'Energy Risk Class',       description: 'VaR risk class covering oil, gas, and power products.',         isActive: true },
    { reportingGroupId: 8,  classificationTypeId: 2, groupName: 'Metals Risk Class',       description: 'VaR risk class covering base and precious metals.',             isActive: true },
    { reportingGroupId: 9,  classificationTypeId: 2, groupName: 'Agricultural Risk Class', description: 'VaR risk class covering grains and softs.',                     isActive: true },
    { reportingGroupId: 10, classificationTypeId: 3, groupName: 'GL — Energy',             description: 'Settlement/invoicing GL posting group for oil, gas, and power products.', isActive: true },
    { reportingGroupId: 11, classificationTypeId: 3, groupName: 'GL — Metals',             description: 'Settlement/invoicing GL posting group for metals products.',    isActive: true },
    { reportingGroupId: 12, classificationTypeId: 3, groupName: 'GL — Agricultural',       description: 'Settlement/invoicing GL posting group for agricultural products.', isActive: true },
  ],
  // V85 — categoryId: 1=REPORTING_CLASSIFICATION_TYPE, 2=operator_type,
  // 3=instrument_type, 4=storage_agreement_type, 5=transport_agreement_type,
  // 6=price_adjustment_type, 7=demurrage_basis, 8=gl_account_type,
  // 9=rin_transaction_type, 10=rin_obligation_status (see lookup_category
  // rowSeed below).
  lookup_value: [
    { lookupId: 1, categoryId: 1, code: 'POSITION',   displayName: 'Position Reporting', sortOrder: 1, isActive: true },
    { lookupId: 2, categoryId: 1, code: 'VAR',        displayName: 'VaR / Risk',          sortOrder: 2, isActive: true },
    { lookupId: 3, categoryId: 1, code: 'SETTLEMENT', displayName: 'Settlement / GL',     sortOrder: 3, isActive: true },
    // V77 — transport_operator.operator_type, converted from CHECK to lookup_value FK
    { lookupId: 4,  categoryId: 2, code: 'SHIPPING_LINE', displayName: 'Shipping Line',      sortOrder: 1, isActive: true },
    { lookupId: 5,  categoryId: 2, code: 'SHIP_MANAGER',  displayName: 'Ship Manager',       sortOrder: 2, isActive: true },
    { lookupId: 6,  categoryId: 2, code: 'HAULIER',       displayName: 'Haulier',            sortOrder: 3, isActive: true },
    { lookupId: 7,  categoryId: 2, code: 'RAIL_OPERATOR', displayName: 'Rail Operator',      sortOrder: 4, isActive: true },
    { lookupId: 8,  categoryId: 2, code: 'PIPELINE_TSO',  displayName: 'Pipeline TSO',       sortOrder: 5, isActive: true },
    { lookupId: 9,  categoryId: 2, code: 'TERMINAL_OP',   displayName: 'Terminal Operator',  sortOrder: 6, isActive: true },
    { lookupId: 10, categoryId: 2, code: 'MULTI_MODAL',   displayName: 'Multi-Modal',        sortOrder: 7, isActive: true },
    { lookupId: 11, categoryId: 2, code: 'OTHER',         displayName: 'Other',              sortOrder: 8, isActive: true },
    // V81 — 5 columns (V44/V46) + 2 RIN columns (V38) finished their
    // lookup_value conversion; rows were already seeded in real SQL, just
    // never actually referenced by the consuming column until V81/this pass.
    // Previously the frontend mock modelled these 6 (+gas_day_type, already
    // correctly wired) as fake standalone PARENT_LOOKUP_TABLES entries with
    // no real table behind them — removed those, rows moved here instead.
    { lookupId: 12, categoryId: 3, code: 'PHYSICAL',             displayName: 'Physical Delivery',             sortOrder: 1,  isActive: true },
    { lookupId: 13, categoryId: 3, code: 'CERTIFICATE_TRANSFER', displayName: 'Certificate Transfer (Spot)',   sortOrder: 2,  isActive: true },
    { lookupId: 14, categoryId: 3, code: 'FORWARD',              displayName: 'Forward (OTC)',                 sortOrder: 3,  isActive: true },
    { lookupId: 15, categoryId: 3, code: 'FUTURES',              displayName: 'Futures (Exchange)',            sortOrder: 4,  isActive: true },
    { lookupId: 16, categoryId: 3, code: 'SWAP_FIXED_FLOAT',     displayName: 'Swap — Fixed / Float',          sortOrder: 5,  isActive: true },
    { lookupId: 17, categoryId: 3, code: 'SWAP_FLOAT_FLOAT',     displayName: 'Swap — Float / Float (Basis)',  sortOrder: 6,  isActive: true },
    { lookupId: 18, categoryId: 3, code: 'OPTION_LISTED',        displayName: 'Option — Listed (Exchange)',    sortOrder: 7,  isActive: true },
    { lookupId: 19, categoryId: 3, code: 'OPTION_OTC_AMERICAN',  displayName: 'Option — OTC American',        sortOrder: 8,  isActive: true },
    { lookupId: 20, categoryId: 3, code: 'OPTION_OTC_ASIAN',     displayName: 'Option — OTC Asian (APO)',     sortOrder: 9,  isActive: true },
    { lookupId: 21, categoryId: 3, code: 'OPTION_OTC_EUROPEAN',  displayName: 'Option — OTC European',        sortOrder: 10, isActive: true },
    { lookupId: 22, categoryId: 3, code: 'STORAGE_AGREEMENT',    displayName: 'Storage Agreement',            sortOrder: 11, isActive: true },
    { lookupId: 23, categoryId: 3, code: 'TRANSPORT_AGREEMENT',  displayName: 'Transport Agreement',          sortOrder: 12, isActive: true },
    { lookupId: 24, categoryId: 4, code: 'TANK_LEASE',    displayName: 'Tank Lease',                sortOrder: 1, isActive: true },
    { lookupId: 25, categoryId: 4, code: 'THROUGHPUT',    displayName: 'Throughput Agreement',      sortOrder: 2, isActive: true },
    { lookupId: 26, categoryId: 4, code: 'TERMINALLING',  displayName: 'Terminalling Agreement',    sortOrder: 3, isActive: true },
    { lookupId: 27, categoryId: 4, code: 'WORKING_GAS',   displayName: 'Working Gas Storage',       sortOrder: 4, isActive: true },
    { lookupId: 28, categoryId: 4, code: 'CUSHION_GAS',   displayName: 'Cushion Gas',                sortOrder: 5, isActive: true },
    { lookupId: 29, categoryId: 4, code: 'LNG_SLOT',      displayName: 'LNG Tank Slot',              sortOrder: 6, isActive: true },
    { lookupId: 30, categoryId: 4, code: 'REGASIFICATION',displayName: 'Regasification Slot',       sortOrder: 7, isActive: true },
    { lookupId: 31, categoryId: 5, code: 'VOYAGE_CHARTER',         displayName: 'Voyage Charter',              sortOrder: 1,  isActive: true },
    { lookupId: 32, categoryId: 5, code: 'TIME_CHARTER',           displayName: 'Time Charter',                sortOrder: 2,  isActive: true },
    { lookupId: 33, categoryId: 5, code: 'BAREBOAT_CHARTER',       displayName: 'Bareboat Charter',            sortOrder: 3,  isActive: true },
    { lookupId: 34, categoryId: 5, code: 'COA',                    displayName: 'Contract of Affreightment',   sortOrder: 4,  isActive: true },
    { lookupId: 35, categoryId: 5, code: 'PIPELINE_FIRM',          displayName: 'Pipeline Firm Capacity',      sortOrder: 5,  isActive: true },
    { lookupId: 36, categoryId: 5, code: 'PIPELINE_INTERRUPTIBLE', displayName: 'Pipeline Interruptible',      sortOrder: 6,  isActive: true },
    { lookupId: 37, categoryId: 5, code: 'TRUCK_SPOT',             displayName: 'Truck Spot',                  sortOrder: 7,  isActive: true },
    { lookupId: 38, categoryId: 5, code: 'RAIL_SPOT',              displayName: 'Rail Spot',                   sortOrder: 8,  isActive: true },
    { lookupId: 39, categoryId: 5, code: 'BARGE_SPOT',             displayName: 'Barge Spot',                  sortOrder: 9,  isActive: true },
    { lookupId: 40, categoryId: 5, code: 'LNG_SLOT_CHARTER',       displayName: 'LNG Slot Charter',            sortOrder: 10, isActive: true },
    { lookupId: 41, categoryId: 6, code: 'API_GRAVITY',      displayName: 'API Gravity Differential',       sortOrder: 1,  isActive: true },
    { lookupId: 42, categoryId: 6, code: 'DENSITY',          displayName: 'Density Correction',             sortOrder: 2,  isActive: true },
    { lookupId: 43, categoryId: 6, code: 'HEAT_CONTENT',     displayName: 'Heat Content / Calorific Value', sortOrder: 3,  isActive: true },
    { lookupId: 44, categoryId: 6, code: 'SULFUR',           displayName: 'Sulfur Premium / Discount',      sortOrder: 4,  isActive: true },
    { lookupId: 45, categoryId: 6, code: 'PROTEIN',          displayName: 'Protein Content Adjustment',     sortOrder: 5,  isActive: true },
    { lookupId: 46, categoryId: 6, code: 'MOISTURE',         displayName: 'Moisture Deduction',             sortOrder: 6,  isActive: true },
    { lookupId: 47, categoryId: 6, code: 'TEST_WEIGHT',      displayName: 'Test Weight Adjustment',         sortOrder: 7,  isActive: true },
    { lookupId: 48, categoryId: 6, code: 'ASSAY',            displayName: 'Assay / Payable Metal',          sortOrder: 8,  isActive: true },
    { lookupId: 49, categoryId: 6, code: 'TREATMENT_CHARGE', displayName: 'Treatment Charge (TC)',          sortOrder: 9,  isActive: true },
    { lookupId: 50, categoryId: 6, code: 'REFINING_CHARGE',  displayName: 'Refining Charge (RC)',           sortOrder: 10, isActive: true },
    { lookupId: 51, categoryId: 6, code: 'QUALITY_PREMIUM',  displayName: 'Quality Premium',                sortOrder: 11, isActive: true },
    { lookupId: 52, categoryId: 6, code: 'QUALITY_DISCOUNT', displayName: 'Quality Discount',               sortOrder: 12, isActive: true },
    { lookupId: 53, categoryId: 6, code: 'TAX',              displayName: 'Tax',                            sortOrder: 13, isActive: true },
    { lookupId: 54, categoryId: 6, code: 'MARKUP',           displayName: 'Commercial Markup',              sortOrder: 14, isActive: true },
    { lookupId: 55, categoryId: 6, code: 'FX_DIFFERENTIAL',  displayName: 'FX Differential',                sortOrder: 15, isActive: true },
    { lookupId: 56, categoryId: 7, code: 'REVERSIBLE',     displayName: 'Reversible (combined pool)',          sortOrder: 1, isActive: true },
    { lookupId: 57, categoryId: 7, code: 'NON_REVERSIBLE', displayName: 'Non-Reversible (per-port allowance)', sortOrder: 2, isActive: true },
    { lookupId: 58, categoryId: 7, code: 'AVERAGED',       displayName: 'Averaged',                            sortOrder: 3, isActive: true },
    // gl_account_type — already seeded in real SQL (V37), never a missing table
    { lookupId: 59, categoryId: 8, code: 'REVENUE',   displayName: 'Revenue',   sortOrder: 1, isActive: true },
    { lookupId: 60, categoryId: 8, code: 'COST',      displayName: 'Cost',      sortOrder: 2, isActive: true },
    { lookupId: 61, categoryId: 8, code: 'ASSET',     displayName: 'Asset',     sortOrder: 3, isActive: true },
    { lookupId: 62, categoryId: 8, code: 'LIABILITY', displayName: 'Liability', sortOrder: 4, isActive: true },
    { lookupId: 63, categoryId: 8, code: 'EQUITY',    displayName: 'Equity',    sortOrder: 5, isActive: true },
    { lookupId: 64, categoryId: 8, code: 'PNL',       displayName: 'P&L',       sortOrder: 6, isActive: true },
    // rin_transaction_type / rin_obligation_status — already seeded in real SQL (V38)
    { lookupId: 65, categoryId: 9, code: 'GENERATE',      displayName: 'Generate',          sortOrder: 1, isActive: true },
    { lookupId: 66, categoryId: 9, code: 'SEPARATE',      displayName: 'Separate',          sortOrder: 2, isActive: true },
    { lookupId: 67, categoryId: 9, code: 'TRANSFER_BUY',  displayName: 'Transfer — Buy',    sortOrder: 3, isActive: true },
    { lookupId: 68, categoryId: 9, code: 'TRANSFER_SELL', displayName: 'Transfer — Sell',   sortOrder: 4, isActive: true },
    { lookupId: 69, categoryId: 9, code: 'RETIRE',        displayName: 'Retire (Surrender)',sortOrder: 5, isActive: true },
    { lookupId: 70, categoryId: 10, code: 'OPEN',                  displayName: 'Open',                 sortOrder: 1, isActive: true },
    { lookupId: 71, categoryId: 10, code: 'PARTIALLY_SATISFIED',   displayName: 'Partially Satisfied',  sortOrder: 2, isActive: true },
    { lookupId: 72, categoryId: 10, code: 'SATISFIED',             displayName: 'Satisfied',            sortOrder: 3, isActive: true },
    { lookupId: 73, categoryId: 10, code: 'OVERDUE',               displayName: 'Overdue',              sortOrder: 4, isActive: true },
  ],
  lookup_category: [
    { categoryId: 1,  categoryCode: 'REPORTING_CLASSIFICATION_TYPE', categoryName: 'Reporting Classification Type', description: 'Independent per-report classification axes for Reporting Groups — Position, VaR, Settlement/GL.',        sortOrder: 1,  isActive: true },
    { categoryId: 2,  categoryCode: 'OPERATOR_TYPE',                 categoryName: 'Operator Type',                 description: 'Transport operator roles — shipping line, ship manager, haulier, rail/pipeline/terminal operator.',                 sortOrder: 2,  isActive: true },
    { categoryId: 3,  categoryCode: 'INSTRUMENT_TYPE',                categoryName: 'Instrument Type',               description: 'Trade instrument classification — physical, forward, futures, swap, option, storage/transport agreement.',                sortOrder: 3,  isActive: true },
    { categoryId: 4,  categoryCode: 'STORAGE_AGREEMENT_TYPE',         categoryName: 'Storage Agreement Type',        description: 'Storage deal sub-types — tank lease, throughput, terminalling, working/cushion gas, LNG slot.',                          sortOrder: 4,  isActive: true },
    { categoryId: 5,  categoryCode: 'TRANSPORT_AGREEMENT_TYPE',       categoryName: 'Transport Agreement Type',      description: 'Transport deal sub-types — voyage/time/bareboat charter, COA, pipeline capacity, truck/rail/barge spot.',              sortOrder: 5,  isActive: true },
    { categoryId: 6,  categoryCode: 'PRICE_ADJUSTMENT_TYPE',          categoryName: 'Price Adjustment Type',         description: 'Order-level price adjustments — quality differentials, treatment/refining charges, tax, markup, FX.',                    sortOrder: 6,  isActive: true },
    { categoryId: 7,  categoryCode: 'DEMURRAGE_BASIS',                 categoryName: 'Demurrage Basis',               description: 'How demurrage/dispatch is calculated across multiple load/discharge ports — reversible, non-reversible, averaged.',           sortOrder: 7,  isActive: true },
    { categoryId: 8,  categoryCode: 'GL_ACCOUNT_TYPE',                 categoryName: 'GL Account Type',               description: 'General ledger account classification — revenue, cost, asset, liability, equity, P&L.',                                sortOrder: 8,  isActive: true },
    { categoryId: 9,  categoryCode: 'RIN_TRANSACTION_TYPE',            categoryName: 'RIN Transaction Type',          description: 'RFS RIN lifecycle transaction types — generate, separate, transfer, retire.',                                           sortOrder: 9,  isActive: true },
    { categoryId: 10, categoryCode: 'RIN_OBLIGATION_STATUS',           categoryName: 'RIN Obligation Status',         description: 'RVO compliance obligation status — open, partially satisfied, satisfied, overdue.',                                    sortOrder: 10, isActive: true },
  ],
  credit_rating: [
    { creditRatingId: 1, agency: 'S&P', rating: 'AAA', numericScore: 1, riskCategory: 'INVESTMENT_GRADE', isActive: true },
    { creditRatingId: 2, agency: 'S&P', rating: 'AA',  numericScore: 2, riskCategory: 'INVESTMENT_GRADE', isActive: true },
    { creditRatingId: 3, agency: 'S&P', rating: 'BBB', numericScore: 4, riskCategory: 'INVESTMENT_GRADE', isActive: true },
  ],
  incoterm: [
    { incotermId: 1, code: 'FOB', name: 'Free On Board',              transportMode: 'SEA_INLAND_WATERWAY', versionYear: 2020, isActive: true },
    { incotermId: 2, code: 'CIF', name: 'Cost, Insurance & Freight',  transportMode: 'SEA_INLAND_WATERWAY', versionYear: 2020, isActive: true },
    { incotermId: 3, code: 'DDP', name: 'Delivered Duty Paid',        transportMode: 'ANY',                 versionYear: 2020, isActive: true },
  ],
  charter_party_type: [
    { charterPartyTypeId: 1, typeCode: 'VOYAGE',    typeName: 'Voyage Charter',             rateBasis: 'PER_TONNE',  durationBasis: 'SINGLE_VOYAGE',   standardFormReference: 'ASBATANKVOY / GENCON / LNGVOY (BIMCO)', description: 'Single voyage, freight per tonne or lumpsum, owner bears voyage costs and risk.',                                              isActive: true },
    { charterPartyTypeId: 2, typeCode: 'TC',        typeName: 'Time Charter',               rateBasis: 'PER_DAY',    durationBasis: 'TIME_PERIOD',     standardFormReference: 'SHELLTIME4 / NYPE',                     description: 'Vessel hired for a fixed period; charterer directs voyages and pays bunkers/port costs; owner paid daily hire.',                isActive: true },
    { charterPartyTypeId: 3, typeCode: 'BAREBOAT',  typeName: 'Bareboat / Demise Charter',  rateBasis: 'PER_DAY',    durationBasis: 'BAREBOAT_PERIOD', standardFormReference: 'BARECON',                               description: 'Charterer takes full operational control including crewing; owner provides vessel only.',                                      isActive: true },
    { charterPartyTypeId: 4, typeCode: 'COA',       typeName: 'Contract of Affreightment',  rateBasis: 'PER_TONNE',  durationBasis: 'CONTRACT_PERIOD', standardFormReference: null,                                    description: 'Commitment to carry multiple cargoes of agreed total quantity over a period, owner nominates vessels per shipment.',            isActive: true },
    { charterPartyTypeId: 5, typeCode: 'WS_VOYAGE', typeName: 'Voyage Charter — Worldscale', rateBasis: 'WORLDSCALE', durationBasis: 'SINGLE_VOYAGE',  standardFormReference: 'ASBATANKVOY',                           description: 'Voyage charter where freight is quoted as a % of the published Worldscale flat rate for the route.',                            isActive: true },
  ],
  fx_period: [
    { fxPeriodId: 1,  periodCode: 'SPOT',  periodName: 'Spot Rate',       periodType: 'SPOT',           daysOffset: 0,   isActive: true },
    { fxPeriodId: 2,  periodCode: '1M',    periodName: '1 Month Forward', periodType: 'STANDARD_TENOR', daysOffset: 30,  isActive: true },
    { fxPeriodId: 3,  periodCode: '2M',    periodName: '2 Month Forward', periodType: 'STANDARD_TENOR', daysOffset: 60,  isActive: true },
    { fxPeriodId: 4,  periodCode: '3M',    periodName: '3 Month Forward', periodType: 'STANDARD_TENOR', daysOffset: 90,  isActive: true },
    { fxPeriodId: 5,  periodCode: '6M',    periodName: '6 Month Forward', periodType: 'STANDARD_TENOR', daysOffset: 180, isActive: true },
    { fxPeriodId: 6,  periodCode: '9M',    periodName: '9 Month Forward', periodType: 'STANDARD_TENOR', daysOffset: 270, isActive: true },
    { fxPeriodId: 7,  periodCode: '1Y',    periodName: '1 Year Forward',  periodType: 'STANDARD_TENOR', daysOffset: 365, isActive: true },
    { fxPeriodId: 8,  periodCode: '2Y',    periodName: '2 Year Forward',  periodType: 'STANDARD_TENOR', daysOffset: 730, isActive: true },
    { fxPeriodId: 9,  periodCode: 'DAY_1', periodName: 'Day 1 Forward',   periodType: 'DAILY_FORWARD',  daysOffset: 1,   isActive: true },
    { fxPeriodId: 10, periodCode: 'DAY_2', periodName: 'Day 2 Forward',   periodType: 'DAILY_FORWARD',  daysOffset: 2,   isActive: true },
    { fxPeriodId: 11, periodCode: 'DAY_3', periodName: 'Day 3 Forward',   periodType: 'DAILY_FORWARD',  daysOffset: 3,   isActive: true },
  ],
  // currencyId 1 = USD (see currency rowSeed below). uomId 101/102 are
  // placeholders for the new PDAY/WS_PT UoMs added in V54 — there is no `uom`
  // mock table yet (a pre-existing gap: the frontend has no unit_of_measure
  // mock at all), so these numbers aren't cross-referenced against anything;
  // they only need to be non-null to satisfy chk_fri_pricing_rules's intent.
  freight_rate_index: [
    { freightRateIndexId: 1, indexCode: 'BDTI',         indexName: 'Baltic Dirty Tanker Index',                  indexType: 'BALTIC',   vesselType: null,           routeDescription: null,                    commodityType: 1, currencyId: 1, uomId: 102, publicationSource: 'Baltic Exchange',      publicationFrequency: 'DAILY',  description: 'Composite index tracking crude/dirty product tanker freight rates across major routes.',            isActive: true },
    { freightRateIndexId: 2, indexCode: 'BCTI',         indexName: 'Baltic Clean Tanker Index',                  indexType: 'BALTIC',   vesselType: null,           routeDescription: null,                    commodityType: 1, currencyId: 1, uomId: 102, publicationSource: 'Baltic Exchange',      publicationFrequency: 'DAILY',  description: 'Composite index tracking clean petroleum product tanker freight rates.',                              isActive: true },
    { freightRateIndexId: 3, indexCode: 'BDI',          indexName: 'Baltic Dry Index',                           indexType: 'BALTIC',   vesselType: 'BULK_CARRIER', routeDescription: null,                    commodityType: null,  currencyId: 1, uomId: 101, publicationSource: 'Baltic Exchange',      publicationFrequency: 'DAILY',  description: 'Composite dry bulk freight index (Capesize/Panamax/Supramax/Handysize) — prices any dry-bulk cargo (ore, coal, grain), not agriculture-specific.', isActive: true },
    { freightRateIndexId: 4, indexCode: 'BPI',          indexName: 'Baltic Panamax Index',                       indexType: 'BALTIC',   vesselType: 'PANAMAX',      routeDescription: null,                    commodityType: null,  currencyId: 1, uomId: 101, publicationSource: 'Baltic Exchange',      publicationFrequency: 'DAILY',  description: 'Panamax dry bulk freight index.',                                                                     isActive: true },
    { freightRateIndexId: 5, indexCode: 'BSI',          indexName: 'Baltic Supramax Index',                      indexType: 'BALTIC',   vesselType: 'OTHER',        routeDescription: null,                    commodityType: null,  currencyId: 1, uomId: 101, publicationSource: 'Baltic Exchange',      publicationFrequency: 'DAILY',  description: 'Supramax dry bulk freight index.',                                                                    isActive: true },
    { freightRateIndexId: 6, indexCode: 'BHSI',         indexName: 'Baltic Handysize Index',                     indexType: 'BALTIC',   vesselType: 'HANDYSIZE',    routeDescription: null,                    commodityType: null,  currencyId: 1, uomId: 101, publicationSource: 'Baltic Exchange',      publicationFrequency: 'DAILY',  description: 'Handysize dry bulk freight index.',                                                                   isActive: true },
    { freightRateIndexId: 7, indexCode: 'WS_FLAT_TD3C', indexName: 'Worldscale Flat Rate — TD3C (AG-China VLCC)', indexType: 'WORLDSCALE', vesselType: 'VLCC',       routeDescription: 'Arabian Gulf to China',  commodityType: 1, currencyId: null, uomId: null, publicationSource: 'Worldscale Association', publicationFrequency: 'ANNUAL', description: 'Annually published Worldscale 100 (WS100) flat rate in USD/tonne for the AG-China VLCC benchmark route.', isActive: true },
    { freightRateIndexId: 8, indexCode: 'SPARK30S',     indexName: 'Spark30S — LNG Freight Assessment (Atlantic)', indexType: 'ASSESSED', vesselType: 'LNG_CARRIER', routeDescription: 'US Gulf-Continent / Atlantic LNG routes', commodityType: 4, currencyId: 1, uomId: 101, publicationSource: 'Spark Commodities', publicationFrequency: 'DAILY', description: 'Daily-assessed LNG spot freight rate in USD/day for a 174,000cbm 2-stroke LNG carrier — the LNG market\'s equivalent of a Baltic index.', isActive: true },
  ],
  laytime_term_template: [
    { laytimeTermId: 1, termCode: 'SHINC',     termName: 'Sundays/Holidays Included',             exclusionBasis: 'SHINC',     isReversible: false, norWiponAllowed: false, norWibonAllowed: false, norWifponAllowed: false, norWcconAllowed: false, noticeOfReadinessTurnTimeMins: 360, commodityType: null,  description: 'All days count against laytime regardless of Sundays or holidays.',                                                            isActive: true },
    { laytimeTermId: 2, termCode: 'SHEX',      termName: 'Sundays/Holidays Excluded',             exclusionBasis: 'SHEX',      isReversible: false, norWiponAllowed: true,  norWibonAllowed: true,  norWifponAllowed: true,  norWcconAllowed: true,  noticeOfReadinessTurnTimeMins: 360, commodityType: null,  description: 'Sundays and holidays do not count against laytime.',                                                                            isActive: true },
    { laytimeTermId: 3, termCode: 'SHEXEIU',   termName: 'SHEX Even If Used',                     exclusionBasis: 'SHEXEIU',   isReversible: false, norWiponAllowed: true,  norWibonAllowed: true,  norWifponAllowed: true,  norWcconAllowed: true,  noticeOfReadinessTurnTimeMins: 360, commodityType: null,  description: 'Sundays/holidays excluded from laytime even if cargo work actually takes place.',                                               isActive: true },
    { laytimeTermId: 4, termCode: 'SHEXUU',    termName: 'SHEX Unless Used',                      exclusionBasis: 'SHEXUU',    isReversible: false, norWiponAllowed: true,  norWibonAllowed: true,  norWifponAllowed: true,  norWcconAllowed: true,  noticeOfReadinessTurnTimeMins: 360, commodityType: null,  description: 'Sundays/holidays excluded from laytime unless cargo work actually takes place, in which case time used counts.',                isActive: true },
    { laytimeTermId: 5, termCode: 'WWD',       termName: 'Weather Working Days',                  exclusionBasis: 'WWD',       isReversible: false, norWiponAllowed: false, norWibonAllowed: false, norWifponAllowed: false, norWcconAllowed: false, noticeOfReadinessTurnTimeMins: 360, commodityType: null,  description: 'Only days/parts of days when weather permits cargo work count against laytime.',                                               isActive: true },
    { laytimeTermId: 6, termCode: 'WWDSHEXUU', termName: 'Weather Working Days, SHEX Unless Used', exclusionBasis: 'WWDSHEXUU', isReversible: false, norWiponAllowed: true,  norWibonAllowed: true,  norWifponAllowed: true,  norWcconAllowed: true,  noticeOfReadinessTurnTimeMins: 360, commodityType: null,  description: 'Combination: weather working days, with Sundays/holidays excluded unless used.',                                                isActive: true },
    { laytimeTermId: 7, termCode: 'WWD_REV',   termName: 'Weather Working Days — Reversible',     exclusionBasis: 'WWD',       isReversible: true,  norWiponAllowed: true,  norWibonAllowed: true,  norWifponAllowed: true,  norWcconAllowed: true,  noticeOfReadinessTurnTimeMins: 360, commodityType: null,  description: 'Weather working days with load and discharge laytime allowances pooled (reversible).',                                          isActive: true },
    { laytimeTermId: 8, termCode: 'LNG_SHINC', termName: 'LNG Standard — SHINC, Non-Reversible',  exclusionBasis: 'SHINC',     isReversible: false, norWiponAllowed: true,  norWibonAllowed: true,  norWifponAllowed: true,  norWcconAllowed: true,  noticeOfReadinessTurnTimeMins: 360, commodityType: 4, description: 'Standard LNG carrier laytime convention: continuous SHINC counting (LNG terminals operate 24/7) with the full NOR bundle. Laytime/demurrage must additionally account for boil-off gas during port stays.', isActive: true },
  ],
  demurrage_dispatch_rate: [
    { demurrageRateId: 1, vesselType: 'VLCC',         charterPartyTypeId: 1, demurrageRatePerDay: 45000, dispatchRatePerDay: 22500, currencyId: 1, commodityType: 1,    claimTimeBarDays: 90, despatchBasis: 'ALL_TIME_SAVED', effectiveFrom: '2026-01-01', effectiveTo: null, notes: 'Indicative default — confirm against fixture recap before use.', isActive: true },
    { demurrageRateId: 2, vesselType: 'SUEZMAX',      charterPartyTypeId: 1, demurrageRatePerDay: 32000, dispatchRatePerDay: 16000, currencyId: 1, commodityType: 1,    claimTimeBarDays: 90, despatchBasis: 'ALL_TIME_SAVED', effectiveFrom: '2026-01-01', effectiveTo: null, notes: 'Indicative default — confirm against fixture recap before use.', isActive: true },
    { demurrageRateId: 3, vesselType: 'AFRAMAX',      charterPartyTypeId: 1, demurrageRatePerDay: 25000, dispatchRatePerDay: 12500, currencyId: 1, commodityType: 1,    claimTimeBarDays: 90, despatchBasis: 'ALL_TIME_SAVED', effectiveFrom: '2026-01-01', effectiveTo: null, notes: 'Indicative default — confirm against fixture recap before use.', isActive: true },
    { demurrageRateId: 4, vesselType: 'PANAMAX',      charterPartyTypeId: 1, demurrageRatePerDay: 18000, dispatchRatePerDay: 9000,  currencyId: 1, commodityType: 1,    claimTimeBarDays: 90, despatchBasis: 'ALL_TIME_SAVED', effectiveFrom: '2026-01-01', effectiveTo: null, notes: 'Indicative default — confirm against fixture recap before use.', isActive: true },
    { demurrageRateId: 5, vesselType: 'MR_TANKER',    charterPartyTypeId: 1, demurrageRatePerDay: 12000, dispatchRatePerDay: 6000,  currencyId: 1, commodityType: 1,    claimTimeBarDays: 90, despatchBasis: 'ALL_TIME_SAVED', effectiveFrom: '2026-01-01', effectiveTo: null, notes: 'Indicative default — confirm against fixture recap before use.', isActive: true },
    { demurrageRateId: 6, vesselType: 'LNG_CARRIER',  charterPartyTypeId: 2, demurrageRatePerDay: 100000, dispatchRatePerDay: 50000, currencyId: 1, commodityType: 4,   claimTimeBarDays: 90, despatchBasis: 'ALL_TIME_SAVED', effectiveFrom: '2026-01-01', effectiveTo: null, notes: 'Indicative default — confirm against fixture recap before use.', isActive: true },
    { demurrageRateId: 7, vesselType: 'BULK_CARRIER', charterPartyTypeId: 1, demurrageRatePerDay: 18000, dispatchRatePerDay: 9000,  currencyId: 1, commodityType: 6, claimTimeBarDays: 90, despatchBasis: 'ALL_TIME_SAVED', effectiveFrom: '2026-01-01', effectiveTo: null, notes: 'Indicative default — confirm against fixture recap before use.', isActive: true },
  ],
  laytime_exception_type: [
    { exceptionTypeId: 1,  exceptionCode: 'WEATHER',                exceptionName: 'Adverse Weather',                  defaultCountsAgainstLaytime: false, isWeatherRelated: true,  description: 'Cargo work suspended due to weather (rain, high seas, wind) — excepted under Weather Working Days (WWD) templates.',                                    isActive: true },
    { exceptionTypeId: 2,  exceptionCode: 'STRIKE',                 exceptionName: 'Strike / Labour Action',           defaultCountsAgainstLaytime: false, isWeatherRelated: false, description: 'Cargo work stopped by a strike at the port, terminal, or aboard the vessel.',                                                                          isActive: true },
    { exceptionTypeId: 3,  exceptionCode: 'BREAKDOWN',               exceptionName: 'Equipment Breakdown',              defaultCountsAgainstLaytime: false, isWeatherRelated: false, description: 'Ship\'s gear, shore crane, pump, or loading arm breakdown halting cargo operations.',                                                                   isActive: true },
    { exceptionTypeId: 4,  exceptionCode: 'AWAITING_BERTH',           exceptionName: 'Awaiting Berth',                    defaultCountsAgainstLaytime: true,  isWeatherRelated: false, description: 'Vessel waiting for a berth to become available after NOR tender — counts against laytime unless the charter party is berth (not port) charter.',       isActive: true },
    { exceptionTypeId: 5,  exceptionCode: 'AWAITING_INSTRUCTIONS',     exceptionName: 'Awaiting Charterer Instructions',   defaultCountsAgainstLaytime: true,  isWeatherRelated: false, description: 'Vessel idle awaiting discharge/loading instructions from the charterer or receiver.',                                                                 isActive: true },
    { exceptionTypeId: 6,  exceptionCode: 'HOLIDAY',                   exceptionName: 'Sunday / Holiday',                   defaultCountsAgainstLaytime: false, isWeatherRelated: false, description: 'Sunday or officially recognised holiday — excepted under SHEX-family templates, counts under SHINC.',                                                isActive: true },
    { exceptionTypeId: 7,  exceptionCode: 'PORT_CONGESTION',            exceptionName: 'Port Congestion',                    defaultCountsAgainstLaytime: true,  isWeatherRelated: false, description: 'General port congestion delaying berthing or cargo operations, not attributable to either party.',                                                    isActive: true },
    { exceptionTypeId: 8,  exceptionCode: 'INSPECTION_DELAY',            exceptionName: 'Inspection / Survey Delay',           defaultCountsAgainstLaytime: false, isWeatherRelated: false, description: 'Delay for customs, quality, quantity, or regulatory inspection/survey before cargo work can proceed.',                                              isActive: true },
    { exceptionTypeId: 9,  exceptionCode: 'BOG_MANAGEMENT',               exceptionName: 'Boil-Off Gas Management',              defaultCountsAgainstLaytime: false, isWeatherRelated: false, description: 'LNG-specific: time spent managing boil-off gas beyond the guaranteed rate, cooldown, or heel adjustment at the load/discharge port.',                 isActive: true },
    { exceptionTypeId: 10, exceptionCode: 'FORCE_MAJEURE',                exceptionName: 'Force Majeure',                        defaultCountsAgainstLaytime: false, isWeatherRelated: false, description: 'War, blockade, pandemic-related port closure, or other force majeure event outside either party\'s control.',                                        isActive: true },
    { exceptionTypeId: 11, exceptionCode: 'OTHER',                        exceptionName: 'Other',                                defaultCountsAgainstLaytime: true,  isWeatherRelated: false, description: 'Other exception reason — see notes on the specific laytime/demurrage record.',                                                                       isActive: true },
  ],
  load_shape_template: [
    { loadShapeId: 1, shapeCode: 'BASELOAD',   shapeName: 'Baseload (7x24)',             shapeType: 'BASELOAD', startHour: 0,    endHour: 24,   intervalMinutes: 60, isComposite: false, isActive: true },
    { loadShapeId: 2, shapeCode: 'PEAK_US',    shapeName: 'US Peak (5x16)',              shapeType: 'PEAK',     startHour: 7,    endHour: 23,   intervalMinutes: 60, isComposite: false, isActive: true },
    { loadShapeId: 3, shapeCode: 'OFFPEAK_US', shapeName: 'US Off-Peak',                 shapeType: 'OFFPEAK',  startHour: 23,   endHour: 7,    intervalMinutes: 60, isComposite: false, isActive: true },
    { loadShapeId: 4, shapeCode: 'SOLAR_PV',   shapeName: 'Solar PV Generation Shape',   shapeType: 'CUSTOM',   startHour: null, endHour: null, intervalMinutes: 60, isComposite: false, isActive: true },
    { loadShapeId: 5, shapeCode: 'EV_NIGHT',   shapeName: 'EV Overnight Charging Shape', shapeType: 'CUSTOM',   startHour: null, endHour: null, intervalMinutes: 60, isComposite: false, isActive: true },
    { loadShapeId: 6, shapeCode: 'ATC_US',     shapeName: 'US Around-the-Clock',         shapeType: 'CUSTOM',   startHour: null, endHour: null, intervalMinutes: 60, isComposite: true,  isActive: true },
  ],
  load_shape_interval: [
    { shapeIntervalId: 1, loadShapeId: 4, dayType: 'ALL', intervalNo: 9,  intervalFactor: 0.7 },
    { shapeIntervalId: 2, loadShapeId: 4, dayType: 'ALL', intervalNo: 12, intervalFactor: 1.0 },
    { shapeIntervalId: 3, loadShapeId: 4, dayType: 'ALL', intervalNo: 16, intervalFactor: 0.4 },
    { shapeIntervalId: 4, loadShapeId: 5, dayType: 'ALL', intervalNo: 2,  intervalFactor: 1.0 },
    { shapeIntervalId: 5, loadShapeId: 5, dayType: 'ALL', intervalNo: 12, intervalFactor: 0.15 },
    { shapeIntervalId: 6, loadShapeId: 5, dayType: 'ALL', intervalNo: 22, intervalFactor: 0.75 },
  ],
  load_shape_component: [
    { shapeComponentId: 1, parentLoadShapeId: 6, childLoadShapeId: 2, weightFactor: 1, monthFrom: null, monthTo: null, sequenceNo: 1 },
    { shapeComponentId: 2, parentLoadShapeId: 6, childLoadShapeId: 3, weightFactor: 1, monthFrom: null, monthTo: null, sequenceNo: 2 },
  ],
  energy_footprint: [
    { energyFootprintId: 1, footprintCode: 'SOLAR_CA_01', footprintName: 'California Distributed Solar Portfolio', footprintType: 'SOLAR_PORTFOLIO',     flowDirection: 'GENERATION', balancingAuthorityId: 3, defaultZoneId: null, totalCapacityMw: 120, defaultLoadShapeId: 4, isAggregatedDispatch: true,  isActive: true },
    { energyFootprintId: 2, footprintCode: 'EVNET_GB_01', footprintName: 'GB Motorway Fast-Charging Network',      footprintType: 'EV_CHARGING_NETWORK', flowDirection: 'LOAD',       balancingAuthorityId: 6, defaultZoneId: null, totalCapacityMw: 45,  defaultLoadShapeId: 5, isAggregatedDispatch: false, isActive: true },
  ],
  energy_footprint_site: [
    { footprintSiteId: 1, energyFootprintId: 1, siteCode: 'SC-FRESNO-1',  siteName: 'Fresno Ground-Mount Array',   siteType: 'SOLAR_ARRAY',     zoneId: null, capacityMw: 60, storageCapacityMwh: null, chargerCount: null, maxChargerKw: null, connectorStandard: null,  technology: 'TRACKER_PV',  isActive: true },
    { footprintSiteId: 2, energyFootprintId: 1, siteCode: 'SC-KERN-1',    siteName: 'Kern County Bifacial Array',  siteType: 'SOLAR_ARRAY',     zoneId: null, capacityMw: 45, storageCapacityMwh: null, chargerCount: null, maxChargerKw: null, connectorStandard: null,  technology: 'BIFACIAL_PV', isActive: true },
    { footprintSiteId: 3, energyFootprintId: 2, siteCode: 'EV-M1-JCT15',  siteName: 'M1 Junction 15 Charging Hub', siteType: 'EV_CHARGING_HUB', zoneId: null, capacityMw: 12, storageCapacityMwh: null, chargerCount: 32,   maxChargerKw: 350,  connectorStandard: 'CCS', technology: 'DC_FAST',     isActive: true },
    { footprintSiteId: 4, energyFootprintId: 2, siteCode: 'EV-LDN-DEPOT', siteName: 'London Bus Depot',            siteType: 'EV_DEPOT',        zoneId: null, capacityMw: 23, storageCapacityMwh: null, chargerCount: 80,   maxChargerKw: 150,  connectorStandard: 'TYPE2', technology: 'DC_FAST',   isActive: true },
  ],
  balancing_authority: [
    { balancingAuthorityId: 1, baCode: 'PJM',    baName: 'PJM Interconnection',                          countryId: 2, marketType: 'RTO', isActive: true },
    { balancingAuthorityId: 2, baCode: 'ERCOT',  baName: 'Electric Reliability Council of Texas',        countryId: 2, marketType: 'ISO', isActive: true },
    { balancingAuthorityId: 3, baCode: 'CAISO',  baName: 'California ISO',                               countryId: 2, marketType: 'ISO', isActive: true },
    { balancingAuthorityId: 4, baCode: 'MISO',   baName: 'Midcontinent ISO',                             countryId: 2, marketType: 'RTO', isActive: true },
    { balancingAuthorityId: 5, baCode: 'NYISO',  baName: 'New York ISO',                                 countryId: 2, marketType: 'ISO', isActive: true },
    { balancingAuthorityId: 6, baCode: 'NGESO',  baName: 'National Grid Electricity System Operator',    countryId: 1, marketType: 'TSO', isActive: true },
    { balancingAuthorityId: 7, baCode: 'TENNET', baName: 'TenneT TSO',                                   countryId: 3, marketType: 'TSO', isActive: true },
  ],
  transmission_zone: [
    { zoneId: 1, balancingAuthorityId: 1, zoneCode: 'PJM_WEST',    zoneName: 'PJM West Hub',    zoneType: 'HUB',       isActive: true },
    { zoneId: 2, balancingAuthorityId: 1, zoneCode: 'PJM_AECO',    zoneName: 'AECO Zone',       zoneType: 'LOAD_ZONE', isActive: true },
    { zoneId: 3, balancingAuthorityId: 2, zoneCode: 'ERCOT_NORTH', zoneName: 'ERCOT North Hub', zoneType: 'HUB',       isActive: true },
    { zoneId: 4, balancingAuthorityId: 2, zoneCode: 'ERCOT_HOUSTON', zoneName: 'ERCOT Houston Hub', zoneType: 'HUB',   isActive: true },
    { zoneId: 5, balancingAuthorityId: 6, zoneCode: 'GSP_A',      zoneName: 'GSP Group _A',    zoneType: 'GSP_GROUP', isActive: true },
    { zoneId: 6, balancingAuthorityId: 6, zoneCode: 'GSP_B',      zoneName: 'GSP Group _B',    zoneType: 'GSP_GROUP', isActive: true },
  ],
  // V65 — Power registry orphans
  interconnector: [
    { interconnectorId: 1, interconnectorCode: 'PJM-MISO-01', interconnectorName: 'PJM–MISO Interface', fromZoneId: 1, toZoneId: 2, capacityMw: 3500, directionType: 'BIDIRECTIONAL', operator: 'PJM/MISO Joint Operating Agreement', isActive: true },
    { interconnectorId: 2, interconnectorCode: 'ERCOT-DC-TIE', interconnectorName: 'ERCOT North–Houston DC Tie', fromZoneId: 3, toZoneId: 4, capacityMw: 600, directionType: 'BIDIRECTIONAL', operator: 'ERCOT', isActive: true },
    { interconnectorId: 3, interconnectorCode: 'IFA2', interconnectorName: 'IFA2 (GB–France)', fromZoneId: 5, toZoneId: 6, capacityMw: 1000, directionType: 'BIDIRECTIONAL', operator: 'National Grid / RTE', isActive: true },
  ],
  generation_asset: [
    { generationAssetId: 1, assetCode: 'PJM-DRESDEN-NUC', assetName: 'Dresden Nuclear Station', balancingAuthorityId: 1, zoneId: 1, fuelType: 'NUCLEAR', technology: 'PWR_REACTOR', nameplateCapacityMw: 1800, commissioningDate: '1970-04-01', decommissioningDate: null, isActive: true },
    { generationAssetId: 2, assetCode: 'ERCOT-PANHANDLE-WIND', assetName: 'Texas Panhandle Wind Farm', balancingAuthorityId: 2, zoneId: 3, fuelType: 'WIND', technology: 'ONSHORE_WIND', nameplateCapacityMw: 500, commissioningDate: '2018-09-01', decommissioningDate: null, isActive: true },
    { generationAssetId: 3, assetCode: 'CAISO-MOJAVE-SOLAR', assetName: 'Mojave Desert Solar Array', balancingAuthorityId: 3, zoneId: null, fuelType: 'SOLAR', technology: 'PV', nameplateCapacityMw: 280, commissioningDate: '2015-06-01', decommissioningDate: null, isActive: true },
    { generationAssetId: 4, assetCode: 'NGESO-DRAX-BIOMASS', assetName: 'Drax Power Station (Biomass Units)', balancingAuthorityId: 6, zoneId: 5, fuelType: 'BIOMASS', technology: 'CCGT', nameplateCapacityMw: 2600, commissioningDate: '1986-01-01', decommissioningDate: null, isActive: true },
  ],
  power_product_detail: [
    { productId: 8, defaultLoadShapeId: 1, voltageLevel: 'HIGH', settlementPointType: 'HUB', defaultBalancingAuthorityId: 6, defaultZoneId: 5, isAncillaryService: false, notes: 'EEX German Power Baseload — settles at the GSP Group _A hub.' },
  ],
  transmission_right_type: [
    { rightTypeId: 1, typeCode: 'FTR', typeName: 'Financial Transmission Right', homeBalancingAuthorityId: 1, settlementBasis: 'DA_LMP_DIFFERENCE', allocationMethod: 'AUCTION', description: 'PJM/MISO terminology. Hedges day-ahead LMP spread between a source and sink point.', isActive: true },
    { rightTypeId: 2, typeCode: 'CRR', typeName: 'Congestion Revenue Right',      homeBalancingAuthorityId: 3, settlementBasis: 'DA_LMP_DIFFERENCE', allocationMethod: 'AUCTION', description: 'CAISO/ERCOT terminology for the same economic instrument as an FTR.', isActive: true },
    { rightTypeId: 3, typeCode: 'TCC', typeName: 'Transmission Congestion Contract', homeBalancingAuthorityId: 5, settlementBasis: 'DA_LMP_DIFFERENCE', allocationMethod: 'AUCTION', description: 'NYISO terminology for the same economic instrument as an FTR.', isActive: true },
  ],
  // Lightweight product mirror for FK label resolution — see the metadataSeed comment above.
  product: [
    { productId: 1,  productCode: 'BRENT-CRUDE',   productName: 'Brent Crude Oil' },
    { productId: 2,  productCode: 'WTI-CRUDE',     productName: 'West Texas Intermediate' },
    { productId: 3,  productCode: 'BRENT-FUTURES', productName: 'Brent Crude Futures' },
    { productId: 4,  productCode: 'TTF-GAS',       productName: 'TTF Natural Gas' },
    { productId: 5,  productCode: 'NBP-GAS',       productName: 'NBP Natural Gas' },
    { productId: 6,  productCode: 'LME-COPPER',    productName: 'LME Grade A Copper' },
    { productId: 7,  productCode: 'LME-ALUMINIUM', productName: 'LME Primary Aluminium' },
    { productId: 8,  productCode: 'EEX-DE-POWER',  productName: 'EEX German Power Baseload' },
    { productId: 9,  productCode: 'ICE-BRENT-OPT', productName: 'ICE Brent Crude Options' },
    { productId: 10, productCode: 'HEATING-OIL',   productName: 'Gas Oil / Heating Oil' },
    { productId: 11, productCode: 'JKM-LNG',       productName: 'JKM LNG Japan/Korea' },
    { productId: 12, productCode: 'CBOT-CORN',     productName: 'CBOT Corn Futures' },
    { productId: 13, productCode: 'ULSD-10PPM',    productName: 'Ultra-Low Sulphur Diesel 10ppm' },
    { productId: 14, productCode: 'ETHANOL',       productName: 'Fuel Ethanol (Denatured, Industrial Grade)' },
    { productId: 15, productCode: 'GAS97-BLEND',   productName: 'Gasoline 97 E3 (ULSD/Ethanol Blend)' },
    { productId: 16, productCode: 'WHEAT-EU',      productName: 'Euronext Milling Wheat (EU)' },
  ],
  // Lightweight storage_facility mirror — real facilityId 4 = GATE-LNG-RTM (the
  // only LNG_TANK-type row in the dedicated Storage Facilities store).
  storage_facility: [
    { facilityId: 1, facilityCode: 'CUSHING-T1',     facilityName: 'Cushing Tank Farm T-1' },
    { facilityId: 2, facilityCode: 'HUMBLY-GROVE',   facilityName: 'Humbly Grove Gas Storage' },
    { facilityId: 3, facilityCode: 'BERGERMEER-NL',  facilityName: 'Bergermeer Gas Storage' },
    { facilityId: 4, facilityCode: 'GATE-LNG-RTM',   facilityName: 'Gate LNG Terminal Rotterdam' },
    { facilityId: 5, facilityCode: 'LME-METRO-DT',   facilityName: 'Metro Detroit LME Approved Warehouse' },
    { facilityId: 6, facilityCode: 'SULLOM-STORAGE', facilityName: 'Sullom Voe Crude Storage Tanks' },
  ],
  lng_terminal_detail: [
    { facilityId: 4, terminalType: 'IMPORT_REGAS', regasCapacityMmscmd: 28.0, liquefactionCapacityMtpa: null, storageCapacityCbm: 540000, numStorageTanks: 3, numBerths: 2, minCargoSizeCbm: 90000, maxCargoSizeCbm: 217000, notes: 'Gate Terminal Rotterdam — one of the largest LNG import terminals in NW Europe, expandable send-out capacity.' },
  ],
  commodity_grade_standard: [
    { gradeStandardId: 1, productId: 12, issuingBody: 'USDA', gradeCode: 'US_NO_2_YELLOW_CORN', gradeName: 'US No. 2 Yellow Corn', isParGrade: true,  priceAdjustmentPerUom: 0.00,  adjustmentCurrencyId: 1, adjustmentCurrencyCode: 'USD', adjustmentUomId: 6, adjustmentUomCode: 'BUSHEL', description: 'CBOT contract par grade — max 5% damaged kernels, 3% foreign material, 15.5% moisture, test weight 54 lb/bu minimum.', isActive: true },
    { gradeStandardId: 2, productId: 12, issuingBody: 'USDA', gradeCode: 'US_NO_3_YELLOW_CORN', gradeName: 'US No. 3 Yellow Corn', isParGrade: false, priceAdjustmentPerUom: -0.04, adjustmentCurrencyId: 1, adjustmentCurrencyCode: 'USD', adjustmentUomId: 6, adjustmentUomCode: 'BUSHEL', description: 'Deliverable at a fixed discount to par — max 7% damaged kernels, test weight 52 lb/bu minimum.', isActive: true },
    { gradeStandardId: 3, productId: 12, issuingBody: 'USDA', gradeCode: 'US_NO_1_YELLOW_CORN', gradeName: 'US No. 1 Yellow Corn', isParGrade: false, priceAdjustmentPerUom: 0.02,  adjustmentCurrencyId: 1, adjustmentCurrencyCode: 'USD', adjustmentUomId: 6, adjustmentUomCode: 'BUSHEL', description: 'Deliverable at a premium to par — max 3% damaged kernels, test weight 56 lb/bu minimum.', isActive: true },
  ],
  metal_brand: [
    { metalBrandId: 1, commodityFamilyId: 6, brandCode: 'CODELCO-CU', brandName: 'Codelco Grade A Cathode', producerName: 'Corporación Nacional del Cobre de Chile', metalForm: 'CATHODE_FULL_PLATE', countryOfOriginId: 19, approvalDate: '1990-01-01', delistingDate: null, isActive: true },
    { metalBrandId: 2, commodityFamilyId: 6, brandCode: 'KGHM-CU',    brandName: 'KGHM Grade A Cathode',     producerName: 'KGHM Polska Miedz S.A.',                     metalForm: 'CATHODE',            countryOfOriginId: 20, approvalDate: '1995-06-01', delistingDate: null, isActive: true },
    { metalBrandId: 3, commodityFamilyId: 6, brandCode: 'ASARCO-CU',  brandName: 'Asarco Grade A Cathode',   producerName: 'ASARCO LLC',                                  metalForm: 'CATHODE',            countryOfOriginId: 2,  approvalDate: '1988-03-01', delistingDate: null, isActive: true },
  ],
  // Lightweight counterparty mirror — real ids from counterpartyData.ts
  counterparty: [
    { counterpartyId: 1, cpCode: 'SHELLTR',  legalName: 'Shell Trading International Ltd' },
    { counterpartyId: 2, cpCode: 'GLENCORE', legalName: 'Glencore International AG' },
    { counterpartyId: 3, cpCode: 'SHELLPLC', legalName: 'Shell plc' },
  ],
  insurance_provider: [
    { providerId: 1, providerCode: 'LLOYDS-SYN', providerName: "Lloyd's of London (Syndicate 2623)", providerType: 'UNDERWRITER', countryId: 1, creditRatingId: 1, counterpartyId: null, isActive: true, notes: 'Marine cargo and P&I risks — subscribes via broker slip.' },
    { providerId: 2, providerCode: 'NORTH-PANDI', providerName: 'North of England P&I Association', providerType: 'PI_CLUB', countryId: 1, creditRatingId: 2, counterpartyId: null, isActive: true, notes: 'Protection & Indemnity cover for chartered/owned tonnage.' },
    { providerId: 3, providerCode: 'AIG-MARINE', providerName: 'AIG Marine Insurance', providerType: 'INSURER', countryId: 2, creditRatingId: 2, counterpartyId: null, isActive: true, notes: 'Cargo and political risk insurer.' },
    { providerId: 4, providerCode: 'EULER-HERMES', providerName: 'Euler Hermes (Allianz Trade)', providerType: 'INSURER', countryId: 16, creditRatingId: 2, counterpartyId: null, isActive: true, notes: 'Trade credit insurance provider.' },
  ],
  interest_rate_index: [
    { rateIndexId: 1, indexCode: 'SOFR',       indexName: 'Secured Overnight Financing Rate',    currencyId: 1, tenor: 'OVERNIGHT', dayCountConvention: 'ACT_360', compounding: 'OVERNIGHT_COMPOUNDED', publicationSource: 'NY Fed',    isRfrr: true,  isActive: true, description: 'US risk-free rate — replaced USD LIBOR.' },
    { rateIndexId: 2, indexCode: 'SOFR_3M',    indexName: 'SOFR Term 3 Month',                   currencyId: 1, tenor: '3M',        dayCountConvention: 'ACT_360', compounding: 'SIMPLE',                publicationSource: 'CME Group', isRfrr: true,  isActive: true, description: 'Forward-looking term SOFR, 3-month tenor.' },
    { rateIndexId: 3, indexCode: 'EURIBOR_3M', indexName: 'Euro Interbank Offered Rate 3 Month', currencyId: 3, tenor: '3M',        dayCountConvention: 'ACT_360', compounding: 'SIMPLE',                publicationSource: 'EMMI',      isRfrr: false, isActive: true, description: 'Eurozone interbank offered rate, 3-month tenor.' },
    { rateIndexId: 4, indexCode: 'SONIA',      indexName: 'Sterling Overnight Index Average',    currencyId: 2, tenor: 'OVERNIGHT', dayCountConvention: 'ACT_365', compounding: 'OVERNIGHT_COMPOUNDED', publicationSource: 'Bank of England', isRfrr: true, isActive: true, description: 'GBP risk-free rate — replaced GBP LIBOR.' },
  ],
  regulatory_report_type: [
    { reportTypeId: 1, reportCode: 'EMIR_TRADE',    reportName: 'EMIR Trade Report',                  regulation: 'EMIR',    jurisdictionId: 16, submissionTarget: 'Trade Repository', reportingDeadline: 'T+1 business day', reportFormat: 'XML', isMandatory: true, isActive: true, description: 'European Market Infrastructure Regulation trade-level report.' },
    { reportTypeId: 2, reportCode: 'REMIT_TABLE1',  reportName: 'REMIT Table 1 — Standard Contract',  regulation: 'REMIT',   jurisdictionId: 16, submissionTarget: 'ACER ARIS',        reportingDeadline: 'T+1 business day', reportFormat: 'XML', isMandatory: true, isActive: true, description: 'Standard wholesale energy contract report under REMIT.' },
    { reportTypeId: 3, reportCode: 'UK_EMIR_TRADE', reportName: 'UK EMIR Trade Report',               regulation: 'UK_EMIR', jurisdictionId: 1,  submissionTarget: 'UK Trade Repository', reportingDeadline: 'T+1 business day', reportFormat: 'XML', isMandatory: true, isActive: true, description: 'UK post-Brexit EMIR-equivalent trade report.' },
    { reportTypeId: 4, reportCode: 'CFTC_SWAP',     reportName: 'CFTC Swap Data Report',              regulation: 'CFTC',    jurisdictionId: 2,  submissionTarget: 'DTCC SDR',          reportingDeadline: 'T+1 business day', reportFormat: 'XML', isMandatory: true, isActive: true, description: 'US CFTC swap data reporting to a registered swap data repository.' },
  ],
  transport_operator: [
    { operatorId: 1, operatorCode: 'MAERSK-TANKERS', operatorName: 'Maersk Tankers',        operatorType: 4, motTypeId: 1, countryId: 23, counterpartyId: null, isActive: true, notes: 'Product/chemical tanker owner-operator.' },
    { operatorId: 2, operatorCode: 'NORTHWARD-RAIL',  operatorName: 'Northward Rail Freight', operatorType: 7, motTypeId: 4, countryId: 2, counterpartyId: null, isActive: true, notes: 'Unit-train bulk rail operator for grain and refined products.' },
    { operatorId: 3, operatorCode: 'RHINE-BARGE',     operatorName: 'Rhine Barge Logistics',  operatorType: 6, motTypeId: 5, countryId: 3, counterpartyId: null, isActive: true, notes: 'Inland waterway barge operator, ARA region.' },
  ],
  collateral_type: [
    { collateralTypeId: 1, typeCode: 'CASH_USD', typeName: 'Cash USD',                    assetClass: 'CASH',             standardHaircutPct: 0.0,  isActive: true, description: 'USD cash collateral.' },
    { collateralTypeId: 2, typeCode: 'CASH_EUR', typeName: 'Cash EUR',                    assetClass: 'CASH',             standardHaircutPct: 0.0,  isActive: true, description: 'EUR cash collateral.' },
    { collateralTypeId: 3, typeCode: 'GOV_US',   typeName: 'US Treasury Bonds',           assetClass: 'GOVERNMENT_BOND',  standardHaircutPct: 2.0,  isActive: true, description: 'US Government securities.' },
    { collateralTypeId: 4, typeCode: 'GOV_UK',   typeName: 'UK Gilts',                    assetClass: 'GOVERNMENT_BOND',  standardHaircutPct: 2.0,  isActive: true, description: 'UK Government securities.' },
    { collateralTypeId: 5, typeCode: 'CORP_IG',  typeName: 'Investment Grade Corp Bonds', assetClass: 'CORPORATE_BOND',   standardHaircutPct: 10.0, isActive: true, description: 'BBB- or above rated corporate bonds.' },
    { collateralTypeId: 6, typeCode: 'LC',       typeName: 'Letter of Credit',            assetClass: 'LETTER_OF_CREDIT', standardHaircutPct: 0.0,  isActive: true, description: 'Bank-issued letter of credit.' },
    { collateralTypeId: 7, typeCode: 'BG',       typeName: 'Bank Guarantee',              assetClass: 'BANK_GUARANTEE',   standardHaircutPct: 0.0,  isActive: true, description: 'Bank-issued guarantee.' },
  ],
  event_category: [
    { categoryId: 1, categoryCode: 'TRADE',       categoryName: 'Trade Lifecycle',      description: 'Events related to trade creation and lifecycle',       isActive: true },
    { categoryId: 2, categoryCode: 'DELIVERY',    categoryName: 'Delivery & Logistics', description: 'Physical delivery and logistics events',                isActive: true },
    { categoryId: 3, categoryCode: 'SETTLEMENT',  categoryName: 'Settlement & Payment', description: 'Settlement, invoicing, and payment events',             isActive: true },
    { categoryId: 4, categoryCode: 'RISK',        categoryName: 'Risk Management',      description: 'Risk limit, VaR, and exposure events',                   isActive: true },
    { categoryId: 5, categoryCode: 'CREDIT',      categoryName: 'Credit & Collateral',  description: 'Credit limit, margin call, and collateral events',      isActive: true },
    { categoryId: 6, categoryCode: 'MARKET_DATA', categoryName: 'Market Data',          description: 'Curve loading, fixing, and data quality events',        isActive: true },
    { categoryId: 7, categoryCode: 'REGULATORY',  categoryName: 'Regulatory',           description: 'Regulatory reporting and compliance events',            isActive: true },
  ],
  event_type: [
    { eventTypeId: 1, categoryId: 1, eventCode: 'TRADE_CREATED',   eventName: 'Trade Created',                   entityType: 'TRADE',  severity: 'INFO',    requiresAction: false, requiresApproval: false, triggersNotification: true,  slaMinutes: null, isReportable: true,  isActive: true, description: null },
    { eventTypeId: 2, categoryId: 1, eventCode: 'TRADE_AMENDED',   eventName: 'Trade Amended',                   entityType: 'TRADE',  severity: 'INFO',    requiresAction: false, requiresApproval: true,  triggersNotification: true,  slaMinutes: null, isReportable: true,  isActive: true, description: null },
    { eventTypeId: 3, categoryId: 1, eventCode: 'TRADE_CANCELLED', eventName: 'Trade Cancelled',                 entityType: 'TRADE',  severity: 'WARNING', requiresAction: false, requiresApproval: true,  triggersNotification: true,  slaMinutes: null, isReportable: true,  isActive: true, description: null },
    { eventTypeId: 4, categoryId: 1, eventCode: 'TRADE_CONFIRMED', eventName: 'Trade Confirmed by Counterparty', entityType: 'TRADE',  severity: 'INFO',    requiresAction: false, requiresApproval: false, triggersNotification: true,  slaMinutes: null, isReportable: false, isActive: true, description: null },
    { eventTypeId: 5, categoryId: 5, eventCode: 'MARGIN_CALL_ISSUED', eventName: 'Margin Call Issued',           entityType: 'MARGIN', severity: 'ALERT',   requiresAction: true,  requiresApproval: false, triggersNotification: true,  slaMinutes: 1440, isReportable: false, isActive: true, description: 'Raised when exposure crosses the CSA threshold.' },
    { eventTypeId: 6, categoryId: 4, eventCode: 'CREDIT_LIMIT_BREACH', eventName: 'Credit Limit Breach',         entityType: 'CREDIT', severity: 'BREACH',  requiresAction: true,  requiresApproval: false, triggersNotification: true,  slaMinutes: 60,   isReportable: false, isActive: true, description: 'Utilisation exceeds the credit limit\'s critical threshold.' },
  ],
  external_system: [
    { externalSystemId: 1, systemCode: 'BLOOMBERG', systemName: 'Bloomberg Terminal',    systemType: 'MARKET_DATA', vendorName: 'Bloomberg L.P.',    connectionType: 'API',      baseUrl: null, ownerTeam: 'Market Data', isActive: true, notes: 'Real-time and historical price feed.' },
    { externalSystemId: 2, systemCode: 'SAP_ERP',   systemName: 'SAP ERP',               systemType: 'ERP',        vendorName: 'SAP SE',            connectionType: 'API',      baseUrl: null, ownerTeam: 'Finance',     isActive: true, notes: 'GL posting and invoicing integration.' },
    { externalSystemId: 3, systemCode: 'DTCC_GTR',  systemName: 'DTCC Global Trade Repository', systemType: 'REGULATORY', vendorName: 'DTCC',       connectionType: 'SFTP',     baseUrl: null, ownerTeam: 'Compliance',  isActive: true, notes: 'EMIR/Dodd-Frank trade repository submission.' },
  ],
  credit_term: [
    { creditTermId: 1,  termCode: 'NET_30',           termName: 'Net 30 Days',                creditPeriodDays: 30, collateralType: 'NONE',             marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Open unsecured credit, due 30 days from invoice.', isActive: true },
    { creditTermId: 2,  termCode: 'ISDA_CSA_STD',     termName: 'ISDA/CSA Standard Margined', creditPeriodDays: 2,  collateralType: 'CASH',             marginCallThreshold: 250000,  marginCallCurrencyId: 1, nettingEligible: true,  requiresIsda: true,  description: 'Daily-margined facility under an ISDA Master Agreement + CSA.', isActive: true },
    { creditTermId: 3,  termCode: 'LC_BACKED',        termName: 'Letter of Credit Backed',    creditPeriodDays: 0,  collateralType: 'LETTER_OF_CREDIT', marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Fully secured by a standby or documentary LC — no open credit exposure.', isActive: true },
    { creditTermId: 4,  termCode: 'PARENT_GUAR',      termName: 'Parent Guarantee Backed',    creditPeriodDays: 30, collateralType: 'PARENT_GUARANTEE', marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Credit period extended on the strength of a parent company guarantee.', isActive: true },
    { creditTermId: 5,  termCode: 'NET_7',            termName: 'Net 7 Days',                 creditPeriodDays: 7,  collateralType: 'NONE',             marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Open unsecured credit, due 7 days from invoice.', isActive: true },
    { creditTermId: 6,  termCode: 'NET_14',           termName: 'Net 14 Days',                creditPeriodDays: 14, collateralType: 'NONE',             marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Open unsecured credit, due 14 days from invoice.', isActive: true },
    { creditTermId: 7,  termCode: 'NET_45',           termName: 'Net 45 Days',                creditPeriodDays: 45, collateralType: 'NONE',             marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Open unsecured credit, due 45 days from invoice.', isActive: true },
    { creditTermId: 8,  termCode: 'NET_60',           termName: 'Net 60 Days',                creditPeriodDays: 60, collateralType: 'NONE',             marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Open unsecured credit, due 60 days from invoice.', isActive: true },
    { creditTermId: 9,  termCode: 'NET_90',           termName: 'Net 90 Days',                creditPeriodDays: 90, collateralType: 'NONE',             marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Open unsecured credit, due 90 days from invoice.', isActive: true },
    { creditTermId: 10, termCode: 'PREPAY',           termName: 'Prepaid — No Credit',        creditPeriodDays: 0,  collateralType: 'CASH',             marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Full payment required before delivery/execution — no open credit exposure.', isActive: true },
    { creditTermId: 11, termCode: 'CASH_ON_DELIVERY', termName: 'Cash on Delivery',           creditPeriodDays: 0,  collateralType: 'CASH',             marginCallThreshold: null,    marginCallCurrencyId: 1, nettingEligible: false, requiresIsda: false, description: 'Payment due concurrent with delivery — no open credit exposure.', isActive: true },
  ],
  holiday_calendar: [
    { calendarId: 1, calendarCode: 'UK_BANK',    calendarName: 'UK Bank Holidays' },
    { calendarId: 2, calendarCode: 'US_FEDERAL', calendarName: 'US Federal Holidays' },
    { calendarId: 3, calendarCode: 'NYMEX_WTI',  calendarName: 'NYMEX WTI Futures Calendar' },
    { calendarId: 4, calendarCode: 'LME_METALS', calendarName: 'LME Metals Calendar' },
    { calendarId: 5, calendarCode: 'ECB_TARGET', calendarName: 'ECB TARGET2 Payment System Holidays' },
    { calendarId: 6, calendarCode: 'ICE_BRENT',  calendarName: 'ICE Brent Futures Calendar' },
  ],
  fx_rate: [
    { fxRateId: 1, fromCurrencyId: 3, toCurrencyId: 1, rate: 1.0850, rateDate: '2026-07-04', rateType: 'EOD', source: 'ECB' },
    { fxRateId: 2, fromCurrencyId: 2, toCurrencyId: 1, rate: 1.2650, rateDate: '2026-07-04', rateType: 'EOD', source: 'BLOOMBERG' },
  ],
  settlement_calendar: [
    { scId: 1, productId: 1, calendarId: 2, priority: 1, isActive: true },
    { scId: 2, productId: 4, calendarId: 5, priority: 1, isActive: true },
  ],
  trade_repository: [
    { repositoryId: 1, repositoryCode: 'DTCC-GTR', repositoryName: 'DTCC Global Trade Repository', regulation: 'EMIR', jurisdiction: 'EU', operatorCpId: null, submissionUrl: null, submissionFormat: 'XML', isActive: true, notes: null },
    { repositoryId: 2, repositoryCode: 'REGIS-TR', repositoryName: 'REGIS-TR', regulation: 'EMIR', jurisdiction: 'EU', operatorCpId: null, submissionUrl: null, submissionFormat: 'XML', isActive: true, notes: null },
    { repositoryId: 3, repositoryCode: 'ICE-TVEL', repositoryName: 'ICE Trade Vault Europe', regulation: 'UK_EMIR', jurisdiction: 'GB', operatorCpId: null, submissionUrl: null, submissionFormat: 'REST', isActive: true, notes: null },
  ],
  // Lightweight vessel mirror — real vesselId 1 = NORDIC LUNA (etrmHandlers.ts).
  vessel: [
    { vesselId: 1, imoNumber: 'IMO 9741060', vesselName: 'NORDIC LUNA' },
  ],
  // Lightweight unit_of_measure mirror — ids match the real V1 seed order.
  unit_of_measure: [
    { uomId: 1,  uomCode: 'BBL',     uomName: 'Barrel' },
    { uomId: 2,  uomCode: 'KBD',     uomName: 'Thousand Barrels/Day' },
    { uomId: 3,  uomCode: 'MT',      uomName: 'Metric Tonne' },
    { uomId: 4,  uomCode: 'MWH',     uomName: 'Megawatt Hour' },
    { uomId: 5,  uomCode: 'GWH',     uomName: 'Gigawatt Hour' },
    { uomId: 6,  uomCode: 'MW',      uomName: 'Megawatt' },
    { uomId: 7,  uomCode: 'MMBTU',   uomName: 'Million BTU' },
    { uomId: 8,  uomCode: 'THERM',   uomName: 'Therm' },
    { uomId: 9,  uomCode: 'MCM',     uomName: 'Thousand Cubic Metres' },
    { uomId: 10, uomCode: 'BUSHEL',  uomName: 'Bushel' },
    { uomId: 11, uomCode: 'MT_AGR',  uomName: 'Metric Tonne (Agri)' },
    { uomId: 12, uomCode: 'MT_MET',  uomName: 'Metric Tonne (Metal)' },
    { uomId: 13, uomCode: 'KG',      uomName: 'Kilogram' },
    { uomId: 14, uomCode: 'TROY_OZ', uomName: 'Troy Ounce' },
  ],
  // Lightweight legal_entity mirror — real ids from legalEntitiesRef (etrmHandlers.ts).
  legal_entity: [
    { legalEntityId: 1, entityCode: 'SETRM-LTD', name: 'NonameETRM Trading Ltd' },
    { legalEntityId: 2, entityCode: 'SETRM-NL',  name: 'NonameETRM BV Netherlands' },
    { legalEntityId: 3, entityCode: 'SETRM-SG',  name: 'NonameETRM Pte Ltd Singapore' },
  ],
  // Lightweight payment_term mirror — real ids from etrmHandlers.ts (paymentTermId 1 = NET_30).
  payment_term: [
    { paymentTermId: 1,  termCode: 'NET_30',        termName: 'Net 30 Calendar Days' },
    { paymentTermId: 10, termCode: 'NOR_PLUS_7_BIZ', termName: 'NOR Tendered +7 Business Days' },
  ],
  // Lightweight location mirror — real ids from etrmHandlers.ts (locationId 1 = SULLOM-VOE).
  location: [
    { locationId: 1, locationCode: 'SULLOM-VOE', locationName: 'Sullom Voe Terminal' },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // V96 — commodity-specific master data. FK ids below reuse the real rows
  // already seeded elsewhere in this file (facilityId 5 = LME-METRO-DT the
  // LME warehouse, productId 6 = LME-COPPER, metalBrandId 1 = CODELCO-CU,
  // currencyId 1 = USD, countryId 2 = US, commodityId 4 = AGRI, etc.).
  // ═══════════════════════════════════════════════════════════════════════
  metal_warrant: [
    { warrantId: 1, warrantNumber: 'LME-WR-2026-00417', facilityId: 5, productId: 6, metalBrandId: 1, metalShapeId: 2, slotVaultLocation: 'Bay 12, Row C, Lot 04', netWeightMt: 25.0, warrantDate: '2026-06-01', rentPaidThroughDate: '2026-07-31', isPledgedCollateral: false, holderCounterpartyId: 2, isActive: true, notes: 'Codelco full-plate cathode, 25MT lot.' },
    { warrantId: 2, warrantNumber: 'LME-WR-2026-00418', facilityId: 5, productId: 6, metalBrandId: 1, metalShapeId: 2, slotVaultLocation: 'Bay 12, Row C, Lot 05', netWeightMt: 25.0, warrantDate: '2026-06-01', rentPaidThroughDate: '2026-06-30', isPledgedCollateral: true,  holderCounterpartyId: 2, isActive: true, notes: 'Pledged as collateral under GLENCORE margin facility.' },
  ],
  metal_assay_component_rule: [
    { ruleId: 1, productId: 6, elementCode: 'CU', elementType: 'PAYABLE', baseContentPct: 24.00,  rejectionThresholdPct: 22.00, penaltyPerPpmOverBase: null,  penaltyCurrencyId: 1, penaltyUomId: 12, isActive: true, notes: 'Copper concentrate — payable metal, standard treatment/refining charge terms apply below this.' },
    { ruleId: 2, productId: 6, elementCode: 'AS', elementType: 'PENALTY', baseContentPct: 0.20,  rejectionThresholdPct: 0.50, penaltyPerPpmOverBase: 2.50, penaltyCurrencyId: 1, penaltyUomId: 12, isActive: true, notes: 'Arsenic penalty — USD 2.50/dmt for every 100ppm (0.01%) above the 0.20% base, standard smelter contract term.' },
  ],
  lng_boil_off_rule: [
    { ruleId: 1, ruleCode: 'GATE-LNG-STORAGE', ruleName: 'Gate Terminal Storage Boil-Off', vesselId: null, facilityId: 4, dailyBoilOffRatePct: 0.05, isForcingBoilOffAllowed: false, effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, notes: 'In-tank storage boil-off at Gate LNG Terminal Rotterdam.' },
    { ruleId: 2, ruleCode: 'DEFAULT-TRANSIT',    ruleName: 'Default Laden Transit Boil-Off', vesselId: null, facilityId: null, dailyBoilOffRatePct: 0.15, isForcingBoilOffAllowed: true,  effectiveFrom: '2026-01-01', effectiveTo: null, isActive: true, notes: 'Generic laden-voyage default used when no vessel-specific guaranteed rate applies.' },
  ],
  power_pnode: [
    { pnodeId: 1, pnodeMarketName: 'PJM_WEST_HUB_NODE', balancingAuthorityId: 1, transmissionZoneId: 1, nodeType: 'HUB', isActive: true, notes: null },
    { pnodeId: 2, pnodeMarketName: 'PJM_AECO_BUS_5021', balancingAuthorityId: 1, transmissionZoneId: 2, nodeType: 'BUS', isActive: true, notes: null },
  ],
  power_ancillary_service_type: [
    { serviceTypeId: 1, serviceCode: 'SPINNING_RESERVE', serviceName: 'Synchronized Reserve', balancingAuthorityId: 1, description: 'Online generation capable of responding within 10 minutes to a system contingency.', isActive: true },
    { serviceTypeId: 2, serviceCode: 'REG_UP',           serviceName: 'Regulation Up',          balancingAuthorityId: 1, description: 'AGC-dispatched capacity that increases output to follow system frequency.', isActive: true },
    { serviceTypeId: 3, serviceCode: 'RRS',                serviceName: 'Responsive Reserve Service', balancingAuthorityId: 2, description: 'Fast-responding reserve (10 minutes) for large frequency deviations.', isActive: true },
  ],
  agri_moisture_discount_scale: [
    { scaleId: 1, gradeStandardId: 1, moisturePctMin: 15.5, moisturePctMax: 17.0, priceDiscountPerUom: -0.02, discountCurrencyId: 1, discountUomId: 10, weightShrinkageFactorPct: 1.5, isActive: true, notes: 'Standard shrink schedule above the 15.5% par moisture basis.' },
    { scaleId: 2, gradeStandardId: 1, moisturePctMin: 17.0, moisturePctMax: 20.0, priceDiscountPerUom: -0.05, discountCurrencyId: 1, discountUomId: 10, weightShrinkageFactorPct: 3.0, isActive: true, notes: 'Steeper discount band for wetter grain.' },
  ],
  agri_crop_year_lifecycle: [
    { lifecycleId: 1, commodityId: 4, countryId: 2, cropYearLabel: '2025/2026', harvestStartDate: '2025-09-01', harvestEndDate: '2025-11-15', regulatoryCutoffDate: '2025-12-01', isActive: true, notes: 'Old-crop marketing year — US corn.' },
    { lifecycleId: 2, commodityId: 4, countryId: 2, cropYearLabel: '2026/2027', harvestStartDate: '2026-09-01', harvestEndDate: '2026-11-15', regulatoryCutoffDate: '2026-12-01', isActive: true, notes: 'New-crop marketing year — US corn.' },
  ],
  intercompany_transfer_rule: [
    { ruleId: 1, sourceLegalEntityId: 1, destinationLegalEntityId: 2, transferPricingMarkupType: 'PERCENT', markupValue: 1.5, markupCurrencyId: null, automaticBookingEnabled: true, isActive: true, notes: 'UK desk to Netherlands BU — 1.5% transfer pricing markup, auto-booked back-to-back.' },
    { ruleId: 2, sourceLegalEntityId: 1, destinationLegalEntityId: 3, transferPricingMarkupType: 'FLAT',    markupValue: 0.25, markupCurrencyId: 1, automaticBookingEnabled: false, isActive: true, notes: 'UK desk to Singapore BU — flat USD 0.25/unit markup, manual booking review required.' },
  ],
  payment_calendar_assignment: [
    { assignmentId: 1, paymentTermId: 1,  currencyId: 1, locationId: null, primaryHolidayCalendarId: 2, secondaryHolidayCalendarId: null, isActive: true, notes: 'USD default — US Federal calendar only.' },
    { assignmentId: 2, paymentTermId: 1,  currencyId: 1, locationId: 1,    primaryHolidayCalendarId: 2, secondaryHolidayCalendarId: 1,    isActive: true, notes: 'USD payment against a UK delivery location — cross-reference US Federal with UK Bank holidays.' },
  ],
  // V17 parent lookup tables — rows come from the simple list above
  ...Object.fromEntries(PARENT_LOOKUP_TABLES.map((t) => [t.name, t.rows])),
};
