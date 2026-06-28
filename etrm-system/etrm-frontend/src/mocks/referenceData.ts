import type { RegistryEntry, TableMetadata, ReferenceDataRow, ColumnDataKind } from '@models/referenceData';

// ─── Column helper — cuts boilerplate in the complex-table metadata below ─────
function col(
  name: string, label: string, kind: ColumnDataKind,
  nullable: boolean, isPrimaryKey: boolean, maxLength: number | null,
  enumValues: string[] | null = null, foreignKeyTable: string | null = null,
) {
  return { name, label, kind, isPrimaryKey, nullable, maxLength, enumValues, foreignKeyTable };
}

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
    name: 'deal_type', label: 'Deal Types', pk: 'dealTypeId', group: 'Trade', order: 1,
    subGroup: 'Trade Types', description: 'Classifies trades by the nature of the obligation — physical delivery, financial settlement, options, or freight charters. Used on every trade ticket to drive workflow rules and position logic.',
    rows: [
      { dealTypeId: 1, typeCode: 'PHYSICAL',  typeName: 'Physical',  description: 'Physical commodity delivery trade',            sortOrder: 1, isActive: true },
      { dealTypeId: 2, typeCode: 'FINANCIAL', typeName: 'Financial', description: 'Financial / paper trade with no physical leg', sortOrder: 2, isActive: true },
      { dealTypeId: 3, typeCode: 'OPTION',    typeName: 'Option',    description: 'Options contract — call or put',               sortOrder: 3, isActive: true },
      { dealTypeId: 4, typeCode: 'FREIGHT',   typeName: 'Freight',   description: 'Vessel charter or freight contract',           sortOrder: 4, isActive: true },
    ],
  },
  {
    name: 'payment_method', label: 'Payment Methods', pk: 'paymentMethodId', group: 'Commercial', order: 1,
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
    name: 'counterparty_type', label: 'Counterparty Types', pk: 'counterpartyTypeId', group: 'Counterparty', order: 1,
    subGroup: 'Classification', description: 'Classifies trading counterparties by role — producer, consumer, trader, bank, broker, or exchange. Affects credit exposure rules, KYC requirements, and settlement workflows.',
    rows: [
      { counterpartyTypeId: 1, typeCode: 'PRODUCER',     typeName: 'Producer',     sortOrder: 1, isActive: true },
      { counterpartyTypeId: 2, typeCode: 'CONSUMER',     typeName: 'Consumer',     sortOrder: 2, isActive: true },
      { counterpartyTypeId: 3, typeCode: 'TRADER',       typeName: 'Trader',       sortOrder: 3, isActive: true },
      { counterpartyTypeId: 4, typeCode: 'BANK',         typeName: 'Bank',         sortOrder: 4, isActive: true },
      { counterpartyTypeId: 5, typeCode: 'BROKER',       typeName: 'Broker',       sortOrder: 5, isActive: true },
      { counterpartyTypeId: 6, typeCode: 'EXCHANGE',     typeName: 'Exchange',     sortOrder: 6, isActive: true },
      { counterpartyTypeId: 7, typeCode: 'INTERCOMPANY', typeName: 'Intercompany', sortOrder: 7, isActive: true },
      { counterpartyTypeId: 8, typeCode: 'UTILITY',      typeName: 'Utility',      sortOrder: 8, isActive: true },
      { counterpartyTypeId: 9, typeCode: 'OTHER',        typeName: 'Other',        sortOrder: 9, isActive: true },
    ],
  },
  {
    name: 'kyc_status', label: 'KYC Statuses', pk: 'kycStatusId', group: 'Counterparty', order: 2,
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
    name: 'contact_role', label: 'Contact Roles', pk: 'contactRoleId', group: 'Organisation', order: 1,
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
    name: 'address_type', label: 'Address Types', pk: 'addressTypeId', group: 'Reference', order: 6,
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
    name: 'bank_account_type', label: 'Bank Account Types', pk: 'bankAccountTypeId', group: 'Reference', order: 7,
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
    name: 'book_type', label: 'Book Types', pk: 'bookTypeId', group: 'Organisation', order: 2,
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
    name: 'legal_entity_type', label: 'Legal Entity Types', pk: 'legalEntityTypeId', group: 'Organisation', order: 3,
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
    name: 'settlement_type', label: 'Settlement Types', pk: 'settlementTypeId', group: 'Products', order: 1,
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
    name: 'storage_facility_type', label: 'Storage Facility Types', pk: 'storageFacilityTypeId', group: 'Logistics', order: 1,
    subGroup: 'Facilities', description: 'Classifies physical storage facilities — tanks, warehouses, LNG terminals, grain silos, refineries, underground caverns, and vaults. Used on logistics legs and inventory positions.',
    rows: [
      { storageFacilityTypeId: 1, typeCode: 'TANK',         typeName: 'Tank',         description: 'Above-ground or floating roof crude / product tank',    sortOrder: 1, isActive: true },
      { storageFacilityTypeId: 2, typeCode: 'WAREHOUSE',    typeName: 'Warehouse',    description: 'Dry bulk or packaged goods warehouse',                  sortOrder: 2, isActive: true },
      { storageFacilityTypeId: 3, typeCode: 'LNG_TERMINAL', typeName: 'LNG Terminal', description: 'Liquefied natural gas storage and regasification',      sortOrder: 3, isActive: true },
      { storageFacilityTypeId: 4, typeCode: 'GRAIN_SILO',   typeName: 'Grain Silo',   description: 'Agricultural grain storage silo or elevator',           sortOrder: 4, isActive: true },
      { storageFacilityTypeId: 5, typeCode: 'REFINERY',     typeName: 'Refinery',     description: 'Crude oil refinery with intermediate storage',          sortOrder: 5, isActive: true },
      { storageFacilityTypeId: 6, typeCode: 'CAVERN',       typeName: 'Cavern',       description: 'Underground salt cavern for gas or crude storage',      sortOrder: 6, isActive: true },
      { storageFacilityTypeId: 7, typeCode: 'VAULT',        typeName: 'Vault',        description: 'Secure vault for metals (LME-approved, precious)',      sortOrder: 7, isActive: true },
      { storageFacilityTypeId: 8, typeCode: 'OTHER',        typeName: 'Other',        description: 'Facility type not covered by standard classifications', sortOrder: 8, isActive: true },
    ],
  },
  {
    name: 'netting_agreement_type', label: 'Netting Agreement Types', pk: 'nettingAgreementTypeId', group: 'Commercial', order: 2,
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
    name: 'tax_type', label: 'Tax Types', pk: 'taxTypeId', group: 'Reference', order: 8,
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
    name: 'mot_type', label: 'Modes of Transport', pk: 'motTypeId', group: 'Logistics', order: 2,
    subGroup: 'Transport', description: 'Physical transport modes used to move commodity from origin to destination — sea vessel, pipeline, road tanker, rail car, barge, or air freight. Drives logistics leg type, Incoterm compatibility, and inspection rules.',
    rows: [
      { motTypeId: 1, typeCode: 'SEA',      typeName: 'Sea',      description: 'Ocean vessel — tanker, bulker, or LNG carrier',              sortOrder: 1, isActive: true },
      { motTypeId: 2, typeCode: 'PIPELINE', typeName: 'Pipeline', description: 'Gas or liquid via pipeline infrastructure',                  sortOrder: 2, isActive: true },
      { motTypeId: 3, typeCode: 'ROAD',     typeName: 'Road',     description: 'Road tanker or bulk truck transport',                        sortOrder: 3, isActive: true },
      { motTypeId: 4, typeCode: 'RAIL',     typeName: 'Rail',     description: 'Railway tank car or bulk rail wagon',                        sortOrder: 4, isActive: true },
      { motTypeId: 5, typeCode: 'BARGE',    typeName: 'Barge',    description: 'River or inland waterway barge transport',                   sortOrder: 5, isActive: true },
      { motTypeId: 6, typeCode: 'AIR',      typeName: 'Air',      description: 'Air freight — metals, specialty chemicals, time-sensitive',  sortOrder: 6, isActive: true },
    ],
  },
  {
    name: 'location_type', label: 'Location Types', pk: 'locationTypeId', group: 'Logistics', order: 3,
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
    name: 'pricing_type', label: 'Pricing Types', pk: 'pricingTypeId', group: 'Reference', order: 9,
    subGroup: 'Pricing', description: 'Determines how the trade price is calculated — fixed at trade date, floating benchmark index, formula-based, differential spread, or Asian average over a pricing period.',
    rows: [
      { pricingTypeId: 1, typeCode: 'FIXED',        typeName: 'Fixed',        description: 'Firm price agreed at trade date, no market linkage',            sortOrder: 1, isActive: true },
      { pricingTypeId: 2, typeCode: 'FLOATING',     typeName: 'Floating',     description: 'Price determined by a published benchmark index',               sortOrder: 2, isActive: true },
      { pricingTypeId: 3, typeCode: 'FORMULA',      typeName: 'Formula',      description: 'Price derived from a formula applied to one or more indices',   sortOrder: 3, isActive: true },
      { pricingTypeId: 4, typeCode: 'DIFFERENTIAL', typeName: 'Differential', description: 'Index price plus or minus a fixed spread',                     sortOrder: 4, isActive: true },
      { pricingTypeId: 5, typeCode: 'AVERAGE',      typeName: 'Average',      description: 'Asian average of index over a defined pricing period',          sortOrder: 5, isActive: true },
    ],
  },
  {
    name: 'inspection_type', label: 'Inspection Types', pk: 'inspectionTypeId', group: 'Logistics', order: 4,
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
    name: 'transport_document_type', label: 'Transport Document Types', pk: 'transportDocumentTypeId', group: 'Commercial', order: 3,
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
  {
    name: 'transmission_right_type', label: 'Transmission Right Types', pk: 'transmissionRightTypeId', group: 'Power', order: 4,
    subGroup: 'Grid', description: 'Types of transmission rights that grant or hedge capacity on electricity grids — Financial (FTR), Physical (PTR), and Auction (ATR) rights. Required for cross-border and inter-zone power positions.',
    rows: [
      { transmissionRightTypeId: 1, typeCode: 'FTR', typeName: 'FTR (Financial)', description: 'Financial transmission right — hedges against congestion costs without physical flow', sortOrder: 1, isActive: true },
      { transmissionRightTypeId: 2, typeCode: 'PTR', typeName: 'PTR (Physical)',  description: 'Physical transmission right — grants actual cross-border or inter-zone capacity',    sortOrder: 2, isActive: true },
      { transmissionRightTypeId: 3, typeCode: 'ATR', typeName: 'ATR (Auction)',   description: 'Auction transmission right — explicit capacity acquired via coordinated auction',    sortOrder: 3, isActive: true },
    ],
  },
  // ── Payment Term calculation lookups ──────────────────────────────────────
  {
    name: 'base_date_event_type', label: 'Base Date Event Types', pk: 'baseDateEventTypeId', group: 'Commercial', order: 4,
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
    name: 'business_day_convention_type', label: 'Business Day Conventions', pk: 'bdcTypeId', group: 'Commercial', order: 5,
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
  {
    name: 'crude_grade_type', label: 'Crude Oil Grades', pk: 'crudeGradeId', group: 'Trade', order: 5,
    subGroup: 'Oil Details', description: 'Named crude oil grades and blends tradeable under dated benchmark pricing. Determines applicable quality spec, pricing differential, and delivery point. Managed by the Oil Operations team.',
    rows: [
      { crudeGradeId:  1, typeCode: 'BRENT',       typeName: 'Brent Blend',             region: 'North Sea',    benchmarkIndex: 'DTBRT', sortOrder: 10, isActive: true },
      { crudeGradeId:  2, typeCode: 'FORTIES',      typeName: 'Forties Blend',           region: 'North Sea',    benchmarkIndex: 'DTBRT', sortOrder: 20, isActive: true },
      { crudeGradeId:  3, typeCode: 'OSEBERG',      typeName: 'Oseberg Blend',           region: 'North Sea',    benchmarkIndex: 'DTBRT', sortOrder: 30, isActive: true },
      { crudeGradeId:  4, typeCode: 'EKOFISK',      typeName: 'Ekofisk Blend',           region: 'North Sea',    benchmarkIndex: 'DTBRT', sortOrder: 40, isActive: true },
      { crudeGradeId:  5, typeCode: 'TROLL',        typeName: 'Troll Crude',             region: 'North Sea',    benchmarkIndex: 'DTBRT', sortOrder: 50, isActive: true },
      { crudeGradeId:  6, typeCode: 'WTI',          typeName: 'West Texas Intermediate', region: 'Americas',     benchmarkIndex: 'WTI-NYMEX', sortOrder: 60, isActive: true },
      { crudeGradeId:  7, typeCode: 'URALS',        typeName: 'Urals Blend',             region: 'CIS',          benchmarkIndex: 'DTBRT', sortOrder: 70, isActive: true },
      { crudeGradeId:  8, typeCode: 'DUBAI',        typeName: 'Dubai Crude',             region: 'Middle East',  benchmarkIndex: 'DUBAI-OMAN', sortOrder: 80, isActive: true },
      { crudeGradeId:  9, typeCode: 'OMAN',         typeName: 'Oman Crude',              region: 'Middle East',  benchmarkIndex: 'DUBAI-OMAN', sortOrder: 90, isActive: true },
      { crudeGradeId: 10, typeCode: 'ESPO',         typeName: 'ESPO Blend (Skovorodino)', region: 'CIS/Asia',   benchmarkIndex: 'ESPO', sortOrder: 100, isActive: true },
      { crudeGradeId: 11, typeCode: 'BONNY_LIGHT',  typeName: 'Bonny Light',             region: 'West Africa',  benchmarkIndex: 'DTBRT', sortOrder: 110, isActive: true },
      { crudeGradeId: 12, typeCode: 'BASRA_LIGHT',  typeName: 'Basra Light',             region: 'Middle East',  benchmarkIndex: 'DTBRT', sortOrder: 120, isActive: true },
      { crudeGradeId: 13, typeCode: 'ARAB_HEAVY',   typeName: 'Arab Heavy',              region: 'Middle East',  benchmarkIndex: 'DTBRT', sortOrder: 130, isActive: true },
      { crudeGradeId: 14, typeCode: 'IRAN_HEAVY',   typeName: 'Iranian Heavy',           region: 'Middle East',  benchmarkIndex: 'DTBRT', sortOrder: 140, isActive: true },
    ],
  },
  {
    name: 'metal_shape', label: 'Metal Physical Forms', pk: 'metalShapeId', group: 'Trade', order: 6,
    subGroup: 'Metals Details', description: 'Physical form in which a metal is traded and delivered. LME contracts specify acceptable shapes per metal — e.g. copper as cathode, aluminium as ingot or billet. Affects storage, transport, and melting characteristics.',
    rows: [
      { metalShapeId: 1, typeCode: 'CATHODE',   typeName: 'Cathode',         applicableMetals: 'Copper, Zinc', sortOrder: 10, isActive: true },
      { metalShapeId: 2, typeCode: 'INGOT',     typeName: 'Ingot',           applicableMetals: 'Aluminium, Lead, Zinc, Tin', sortOrder: 20, isActive: true },
      { metalShapeId: 3, typeCode: 'BILLET',    typeName: 'Billet',          applicableMetals: 'Aluminium, Copper', sortOrder: 30, isActive: true },
      { metalShapeId: 4, typeCode: 'COIL',      typeName: 'Coil',            applicableMetals: 'Aluminium, Steel', sortOrder: 40, isActive: true },
      { metalShapeId: 5, typeCode: 'ROD',       typeName: 'Wire Rod',        applicableMetals: 'Copper, Aluminium', sortOrder: 50, isActive: true },
      { metalShapeId: 6, typeCode: 'SLAB',      typeName: 'Slab',            applicableMetals: 'Aluminium, Steel', sortOrder: 60, isActive: true },
      { metalShapeId: 7, typeCode: 'WIRE',      typeName: 'Wire Bar',        applicableMetals: 'Copper', sortOrder: 70, isActive: true },
      { metalShapeId: 8, typeCode: 'POWDER',    typeName: 'Powder',          applicableMetals: 'Precious metals, Nickel', sortOrder: 80, isActive: true },
      { metalShapeId: 9, typeCode: 'T_BAR',     typeName: 'T-Bar',           applicableMetals: 'Aluminium, Tin', sortOrder: 90, isActive: true },
    ],
  },
  {
    name: 'gas_day_type', label: 'Gas Day Types', pk: 'gasDayTypeId', group: 'Trade', order: 7,
    subGroup: 'Gas Details', description: 'Defines the start and end time of the gas delivery day at a specific hub. NBP (UK) uses 06:00–06:00 UTC. Continental European hubs (TTF, NCG, GPL) use 06:00–06:00 CET. Some pipelines use midnight-to-midnight.',
    rows: [
      { gasDayTypeId: 1, typeCode: 'STANDARD',   typeName: 'Standard (06:00–06:00)',  description: 'Gas day runs 06:00 to 06:00 local hub time. Standard for UK NBP, TTF, NCG, and most European hubs.', sortOrder: 10, isActive: true },
      { gasDayTypeId: 2, typeCode: 'MIDNIGHT',   typeName: 'Midnight (00:00–00:00)',  description: 'Gas day runs midnight to midnight. Used for some pipeline balancing points and US gas markets.', sortOrder: 20, isActive: true },
      { gasDayTypeId: 3, typeCode: 'EXTENDED',   typeName: 'Extended (custom hours)', description: 'Non-standard gas day boundary agreed in the transport or supply contract. See contract for hours.', sortOrder: 30, isActive: true },
    ],
  },
  {
    name: 'nomination_type', label: 'Gas Nomination Types', pk: 'nominationTypeId', group: 'Trade', order: 8,
    subGroup: 'Gas Details', description: 'Defines the firm vs. interruptible nature of a gas nomination — i.e. whether the shipper/supplier is guaranteed to deliver the nominated quantity or may curtail with notice.',
    rows: [
      { nominationTypeId: 1, typeCode: 'FIRM',          typeName: 'Firm',          description: 'Shipper guarantees delivery of the full nominated quantity. Higher price; used for regulated supply obligations and industrial customers.', sortOrder: 10, isActive: true },
      { nominationTypeId: 2, typeCode: 'INTERRUPTIBLE', typeName: 'Interruptible', description: 'Supplier may curtail delivery with contractual notice (typically 24–48h). Lower tariff; suitable for flexible industrial users with backup fuel capability.', sortOrder: 20, isActive: true },
      { nominationTypeId: 3, typeCode: 'RENOMINATABLE', typeName: 'Renominatable', description: 'Firm delivery but buyer may re-nominate quantity within agreed windows during the gas day. Flexible gas for balancing.', sortOrder: 30, isActive: true },
    ],
  },
  {
    name: 'lng_price_basis', label: 'LNG Price Linkages', pk: 'lngPriceBasisId', group: 'Trade', order: 9,
    subGroup: 'LNG Details', description: 'Benchmark index to which an LNG cargo price is linked. Asian LNG is typically JCC-linked. US export LNG is HH-linked. European destination cargoes use TTF or NBP. Some transactions are hybrid (JCC slope + HH floor).',
    rows: [
      { lngPriceBasisId: 1, typeCode: 'JCC',    typeName: 'JCC (Japan Crude Cocktail)',      description: 'Average price of crude oils imported to Japan (Ministry of Finance monthly). Dominant basis for long-term Asian LNG contracts. Typically expressed as a slope (e.g. 13.9% × JCC).', sortOrder: 10, isActive: true },
      { lngPriceBasisId: 2, typeCode: 'HH',     typeName: 'HH (Henry Hub)',                  description: 'NYMEX Henry Hub natural gas price. Standard linkage for US LNG export contracts (Sabine Pass, Freeport, Corpus Christi). Expressed as HH + liquefaction fee.', sortOrder: 20, isActive: true },
      { lngPriceBasisId: 3, typeCode: 'TTF',    typeName: 'TTF (Title Transfer Facility)',    description: 'ICE TTF front-month or average. Increasingly common for European destination LNG and spot Atlantic basin cargoes.', sortOrder: 30, isActive: true },
      { lngPriceBasisId: 4, typeCode: 'NBP',    typeName: 'NBP (National Balancing Point)',   description: 'UK National Balancing Point. Used for UK-delivery LNG and some European contracts. Often priced as day-ahead or monthly average.', sortOrder: 40, isActive: true },
      { lngPriceBasisId: 5, typeCode: 'DES_SPOT', typeName: 'DES Spot (Market Price)',        description: 'Spot LNG price at the delivery terminal — negotiated on a per-cargo basis reflecting global supply-demand at time of trade. No fixed index linkage.', sortOrder: 50, isActive: true },
      { lngPriceBasisId: 6, typeCode: 'HYBRID', typeName: 'Hybrid (JCC slope + HH floor)',   description: 'Blended pricing formula combining a JCC slope with a Henry Hub floor or cap. Used in some APAC long-term contracts to hedge against oil/gas price divergence.', sortOrder: 60, isActive: true },
    ],
  },
  {
    name: 'power_load_type', label: 'Power Load Types', pk: 'powerLoadTypeId', group: 'Trade', order: 10,
    subGroup: 'Power Details', description: 'Defines the delivery hour profile for a power trade. Baseload covers all hours 24/7. Peak and off-peak split by agreed hour boundaries. Custom profiles reference a load_shape_template. Critical for position and scheduling calculations.',
    rows: [
      { powerLoadTypeId: 1, typeCode: 'BASELOAD',  typeName: 'Baseload (7×24)',   description: 'Continuous delivery 24 hours/day, 7 days/week for the full contract period. Simplest profile; used for large industrial supply and wholesale bulk contracts.', sortOrder: 10, isActive: true },
      { powerLoadTypeId: 2, typeCode: 'PEAK',      typeName: 'Peak Hours',        description: 'Delivery only during defined peak hours — typically Mon–Fri 07:00–23:00 or 08:00–20:00 depending on the market. Higher per-MWh price than baseload.', sortOrder: 20, isActive: true },
      { powerLoadTypeId: 3, typeCode: 'OFF_PEAK',  typeName: 'Off-Peak Hours',    description: 'Delivery during non-peak hours: nights, weekends, and public holidays. Lower price; purchased by pumped hydro and battery operators for arbitrage.', sortOrder: 30, isActive: true },
      { powerLoadTypeId: 4, typeCode: 'SHAPED',    typeName: 'Shaped / Custom',   description: 'User-defined hourly delivery profile from a load_shape_template. Used for wind/solar shape hedges or industrial demand curves that don\'t match standard profiles.', sortOrder: 40, isActive: true },
    ],
  },
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
  commodity: {
    tableName: 'commodity', displayName: 'Commodities', primaryKeyColumn: 'commodityId', isTemporal: false,
    columns: [
      col('commodityId',      'ID',           'number',  false, true,  null),
      col('commodityCode',    'Code',         'string',  false, false, 20),
      col('commodityName',    'Name',         'string',  false, false, 100),
      col('commodityType',    'Type',         'enum',    false, false, null, ['OIL', 'POWER', 'GAS', 'AGRICULTURAL', 'METALS', 'OTHER']),
      col('commoditySubtype', 'Subtype',      'enum',    true,  false, null, [
        'CRUDE', 'REFINED', 'NGL', 'CONDENSATE', 'PETROCHEMICAL',
        'PIPELINE_GAS', 'LNG', 'LPG', 'NGL_GAS', 'BIOGAS',
        'ELECTRICITY', 'RENEWABLE', 'NUCLEAR',
        'GRAINS', 'OILSEEDS', 'SOFTS', 'LIVESTOCK', 'DAIRY',
        'BASE_METAL', 'PRECIOUS_METAL', 'FERROUS', 'MINOR_METAL', 'OTHER',
      ]),
      col('defaultUomId',     'Default UoM',  'number',  true,  false, null),
      col('defaultCurrencyId','Default CCY',  'number',  true,  false, null),
      col('description',      'Description',  'string',  true,  false, 500),
      col('isActive',         'Active',       'boolean', false, false, null),
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
      col('charterPartyTypeId', 'ID',             'number',  false, true,  null),
      col('typeCode',           'Type Code',      'string',  false, false, 20),
      col('typeName',           'Type Name',      'string',  false, false, 100),
      col('rateBasis',          'Rate Basis',     'enum',    false, false, null, ['PER_DAY', 'PER_TONNE', 'LUMPSUM', 'PER_CBM', 'WORLDSCALE']),
      col('durationBasis',      'Duration Basis', 'enum',    false, false, null, ['SINGLE_VOYAGE', 'TIME_PERIOD', 'BAREBOAT_PERIOD', 'CONTRACT_PERIOD']),
      col('isActive',           'Active',         'boolean', false, false, null),
    ],
  },
  load_shape_template: {
    tableName: 'load_shape_template', displayName: 'Load Shape Templates', primaryKeyColumn: 'loadShapeId', isTemporal: false,
    columns: [
      col('loadShapeId', 'ID',         'number',  false, true,  null),
      col('shapeCode',   'Shape Code', 'string',  false, false, 30),
      col('shapeName',   'Shape Name', 'string',  false, false, 150),
      col('shapeType',   'Shape Type', 'enum',    false, false, null, ['BASELOAD', 'PEAK', 'OFFPEAK', 'CUSTOM']),
      col('startHour',   'Start Hour', 'number',  true,  false, null),
      col('endHour',     'End Hour',   'number',  true,  false, null),
      col('isActive',    'Active',     'boolean', false, false, null),
    ],
  },
  balancing_authority: {
    tableName: 'balancing_authority', displayName: 'Balancing Authorities', primaryKeyColumn: 'balancingAuthorityId', isTemporal: false,
    columns: [
      col('balancingAuthorityId', 'ID',          'number',  false, true,  null),
      col('baCode',               'BA Code',     'string',  false, false, 20),
      col('baName',               'Name',        'string',  false, false, 200),
      col('countryCode',          'Country',     'string',  false, false, 2),
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
};

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Mirrors master_data_table_registry. Only a subset of the ~120 eventual Tier 2
 * tables are seeded here — enough to prove the generic mechanism works across
 * every column shape. Adding the rest is one entry in PARENT_LOOKUP_TABLES,
 * not new code (per the Master Data Entry Technical Design doc).
 */
export const registrySeed: RegistryEntry[] = [
  { registryId: 1, tableName: 'currency',            displayName: 'Currencies',           moduleGroup: 'Reference', subGroup: 'Global Codes',      description: 'ISO 4217 currency codes used across all monetary fields. The 3-letter alphabetic code (e.g. USD, EUR, GBP) is enforced. Reference: iso.org/iso-4217-currency-codes.html', allowCreate: true,  allowEdit: true,  allowDelete: false, allowExcelUpload: true,  isEnabled: true, displayOrder: 1 },
  { registryId: 2, tableName: 'commodity',           displayName: 'Commodities',          moduleGroup: 'Reference', subGroup: 'Classification',    description: 'Top-level commodity classification — Oil, Gas, Power, Agricultural, Metals, and Other. Drives product group assignment, applicable trade types, and pricing curve linkage.',                                allowCreate: true,  allowEdit: true,  allowDelete: false, allowExcelUpload: false, isEnabled: true, displayOrder: 2 },
  { registryId: 3, tableName: 'credit_rating',       displayName: 'Credit Ratings',       moduleGroup: 'Reference', subGroup: 'Classification',    description: 'S&P, Moody\'s, and Fitch credit rating scales with numeric equivalents. Used to derive credit exposure limits and margin requirements for each counterparty.',                                                   allowCreate: true,  allowEdit: true,  allowDelete: true,  allowExcelUpload: false, isEnabled: true, displayOrder: 3 },
  { registryId: 4, tableName: 'incoterm',            displayName: 'Incoterms',            moduleGroup: 'Reference', subGroup: 'Global Codes',      description: 'ICC Incoterms® 2020 rules that define the point at which risk and cost transfer from seller to buyer. Reference: iccwbo.org/resources-for-business/incoterms-rules',                            allowCreate: true,  allowEdit: true,  allowDelete: false, allowExcelUpload: false, isEnabled: true, displayOrder: 4 },
  { registryId: 5, tableName: 'charter_party_type',  displayName: 'Charter Party Types',  moduleGroup: 'Freight',   subGroup: 'Charter',           description: 'Types of vessel charter arrangements — Voyage Charter (fixed route, per tonne) or Time Charter (per day, operator controls routing). Determines freight cost calculation and demurrage liability.',     allowCreate: true,  allowEdit: true,  allowDelete: true,  allowExcelUpload: false, isEnabled: true, displayOrder: 1 },
  { registryId: 6, tableName: 'load_shape_template', displayName: 'Load Shape Templates', moduleGroup: 'Power',     subGroup: 'Markets',           description: 'Standard electricity delivery profiles — Baseload (7×24), Peak (5×16 or 6×16), Off-peak, and user-defined shapes. Templates constrain the hours delivered under a power supply contract.',               allowCreate: true,  allowEdit: true,  allowDelete: true,  allowExcelUpload: false, isEnabled: true, displayOrder: 1 },
  { registryId: 7, tableName: 'balancing_authority', displayName: 'Balancing Authorities',moduleGroup: 'Power',     subGroup: 'Markets',           description: 'Grid operators (ISOs/RTOs and utilities) responsible for maintaining real-time balance between supply and demand within their control area — PJM, ERCOT, CAISO, and others.',                        allowCreate: true,  allowEdit: true,  allowDelete: false, allowExcelUpload: false, isEnabled: true, displayOrder: 2 },
  { registryId: 8, tableName: 'transmission_zone',   displayName: 'Transmission Zones',   moduleGroup: 'Power',     subGroup: 'Grid',              description: 'Pricing and scheduling zones within a balancing authority area — hubs, load zones, and LMP nodes. Each zone has its own congestion and loss components for locational marginal pricing.',            allowCreate: true,  allowEdit: true,  allowDelete: true,  allowExcelUpload: false, isEnabled: true, displayOrder: 3 },
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
    { commodityId: 1, commodityCode: 'OIL',    commodityName: 'Oil & Petroleum',     commodityType: 'OIL',          commoditySubtype: 'CRUDE',        defaultUomId: 1, defaultCurrencyId: 1, description: 'Crude oil, refined products, NGL, condensate and petrochemicals. Covers all liquid hydrocarbons from wellhead to end-product.', isActive: true },
    { commodityId: 2, commodityCode: 'POWER',  commodityName: 'Power & Electricity', commodityType: 'POWER',        commoditySubtype: 'ELECTRICITY',  defaultUomId: 5, defaultCurrencyId: 2, description: 'Electricity generation, transmission, and supply. Includes baseload, peak, renewable, and nuclear power.',                    isActive: true },
    { commodityId: 3, commodityCode: 'GAS',    commodityName: 'Natural Gas',         commodityType: 'GAS',          commoditySubtype: 'PIPELINE_GAS', defaultUomId: 5, defaultCurrencyId: 2, description: 'Natural gas including pipeline gas, LNG cargoes, LPG, and NGL extraction.',                                                  isActive: true },
    { commodityId: 4, commodityCode: 'AGRI',   commodityName: 'Agricultural',        commodityType: 'AGRICULTURAL', commoditySubtype: 'GRAINS',       defaultUomId: 4, defaultCurrencyId: 1, description: 'Agricultural commodities — grains, oilseeds, softs, livestock and dairy products.',                                          isActive: true },
    { commodityId: 5, commodityCode: 'METALS', commodityName: 'Metals & Mining',     commodityType: 'METALS',       commoditySubtype: 'BASE_METAL',   defaultUomId: 4, defaultCurrencyId: 1, description: 'Base metals (copper, aluminium, zinc, lead, nickel, tin), precious metals (gold, silver, platinum), and ferrous metals.',     isActive: true },
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
    { charterPartyTypeId: 1, typeCode: 'VOYAGE', typeName: 'Voyage Charter', rateBasis: 'PER_TONNE', durationBasis: 'SINGLE_VOYAGE', isActive: true },
    { charterPartyTypeId: 2, typeCode: 'TC',     typeName: 'Time Charter',   rateBasis: 'PER_DAY',   durationBasis: 'TIME_PERIOD',   isActive: true },
  ],
  load_shape_template: [
    { loadShapeId: 1, shapeCode: 'BASELOAD', shapeName: 'Baseload (7x24)', shapeType: 'BASELOAD', startHour: 0,  endHour: 24, isActive: true },
    { loadShapeId: 2, shapeCode: 'PEAK_US',  shapeName: 'US Peak (5x16)',  shapeType: 'PEAK',     startHour: 7,  endHour: 23, isActive: true },
  ],
  balancing_authority: [
    { balancingAuthorityId: 1, baCode: 'PJM',   baName: 'PJM Interconnection',                  countryCode: 'US', marketType: 'RTO', isActive: true },
    { balancingAuthorityId: 2, baCode: 'ERCOT', baName: 'Electric Reliability Council of Texas', countryCode: 'US', marketType: 'ISO', isActive: true },
  ],
  transmission_zone: [
    { zoneId: 1, balancingAuthorityId: 1, zoneCode: 'PJM_WEST',    zoneName: 'PJM West Hub',    zoneType: 'HUB', isActive: true },
    { zoneId: 2, balancingAuthorityId: 2, zoneCode: 'ERCOT_NORTH', zoneName: 'ERCOT North Hub', zoneType: 'HUB', isActive: true },
  ],
  // V17 parent lookup tables — rows come from the simple list above
  ...Object.fromEntries(PARENT_LOOKUP_TABLES.map((t) => [t.name, t.rows])),
};
