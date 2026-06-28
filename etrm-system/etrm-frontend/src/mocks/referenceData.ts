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
      col('commodityId',   'ID',    'number',  false, true,  null),
      col('commodityCode', 'Code',  'string',  false, false, 20),
      col('commodityName', 'Name',  'string',  false, false, 100),
      col('commodityType', 'Type',  'enum',    false, false, null, ['OIL', 'POWER', 'GAS', 'AGRICULTURAL', 'METALS', 'OTHER']),
      col('isActive',      'Active','boolean', false, false, null),
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
    { commodityId: 1, commodityCode: 'OIL',   commodityName: 'Oil',   commodityType: 'OIL',   isActive: true },
    { commodityId: 2, commodityCode: 'POWER',  commodityName: 'Power', commodityType: 'POWER', isActive: true },
    { commodityId: 3, commodityCode: 'GAS',    commodityName: 'Gas',   commodityType: 'GAS',   isActive: true },
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
