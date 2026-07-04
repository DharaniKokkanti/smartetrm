/**
 * Display metadata for draft-store keys (see `formDraft.ts`), used by
 * `MinimizedDraftsDock` to render a human-readable chip + the route to
 * navigate back to when resuming a minimized panel.
 *
 * Only keys that carry `open`/`editing` state (i.e. used with `useFormDraft`
 * or `useDraftState`) belong here — the `-v` suffixed keys used with
 * `useDraftValues` are child value-only stashes restored together with
 * their parent and don't need their own dock entry.
 */
export const DRAFT_META: Record<string, { route: string; label: string }> = {
  'trade':                        { route: '/trade/blotter',              label: 'Trade' },
  'trade-leg':                    { route: '/trade/blotter',              label: 'Trade Leg' },
  'trade-item':                   { route: '/trade/blotter',              label: 'Trade Item' },
  'org-brokers':                  { route: '/org/brokers',                label: 'Broker' },
  'org-traders':                  { route: '/org/traders',                label: 'Trader' },
  'org-desks':                    { route: '/org/desks',                  label: 'Desk' },
  'org-books':                    { route: '/org/books',                 label: 'Book' },
  'credit-limits':                { route: '/credit/limits',              label: 'Credit Limit' },
  'credit-margin':                { route: '/credit/margin-agreements',   label: 'Margin Agreement' },
  'credit-lcs':                   { route: '/credit/letters-of-credit',   label: 'Letter of Credit' },
  'calendar-periods':             { route: '/calendar/periods',           label: 'Period' },
  'calendar-holiday-calendars':   { route: '/calendar/holiday-calendars', label: 'Holiday Calendar' },
  'contracts-payment-terms':      { route: '/contracts/payment-terms',    label: 'Payment Term' },
  'contracts-bfa':                { route: '/contracts/broker-fee-agreements', label: 'Broker Fee Agreement' },
  'contracts-payment-methods':    { route: '/contracts/payment-methods',  label: 'Payment Method' },
  'admin-users':                  { route: '/admin/users',                label: 'System User' },
  'contracts-gtcs':               { route: '/contracts/gtcs',             label: 'GTC' },
  'env-schemes':                  { route: '/environmental/schemes',      label: 'Emission Scheme' },
  'env-products':                 { route: '/environmental/products',     label: 'Environmental Product' },
  'env-registries':               { route: '/environmental/registries',  label: 'Carbon Registry' },
  'tier1-legal-entity':           { route: '/tier1/legal-entity',         label: 'Legal Entity' },
  'env-obligations':              { route: '/environmental/obligations', label: 'Emission Obligation' },
  'markets-price-indices':        { route: '/markets/price-indices',      label: 'Price Index' },
  'markets-products':             { route: '/markets/products',           label: 'Product' },
  'bolmo-agreement':              { route: '/bolmo',                      label: 'BOLMO Agreement' },
  'bolmo-leg':                    { route: '/bolmo',                      label: 'BOLMO Leg' },
  'markets-exchanges':            { route: '/markets/exchanges',          label: 'Exchange' },
  'rins-transactions':            { route: '/rins/transactions',          label: 'RIN Transaction' },
  'markets-markets':              { route: '/markets/markets',            label: 'Market' },
  'rins-accounts':                { route: '/rins/accounts',              label: 'RIN Account' },
  'rins-fuel-categories':         { route: '/rins/fuel-categories',       label: 'Fuel Category' },
  'rins-obligations':             { route: '/rins/obligations',           label: 'RVO Obligation' },
  'finance-gl':                   { route: '/finance/gl-accounts',        label: 'GL Account' },
  'pricing-balmo-products':       { route: '/pricing/balmo-products',     label: 'BALMO Product' },
  'pricing-settlement-prices':    { route: '/pricing/settlement-prices',  label: 'Settlement Price' },
  'pricing-rules':                { route: '/pricing/pricing-rules',      label: 'Pricing Rule' },
  'logistics-storage':            { route: '/logistics/storage',          label: 'Storage Facility' },
  'pricing-price-sources':        { route: '/pricing/price-sources',      label: 'Price Source' },
  'logistics-vessels':            { route: '/logistics/vessels',          label: 'Vessel' },
  'logistics-trucks':             { route: '/logistics/trucks',           label: 'Truck' },
  'logistics-pipelines':          { route: '/logistics/pipelines',        label: 'Pipeline' },
  'logistics-locations':          { route: '/logistics/locations',        label: 'Location' },
  'ref-incoterms':                { route: '/reference/incoterms',        label: 'Incoterm' },
  'ref-uom-conversions':          { route: '/reference/uom-conversions',  label: 'UoM Conversion' },
  'ref-uom':                      { route: '/reference/uom',              label: 'UoM' },
  'ref-currencies':                { route: '/reference/currencies',      label: 'Currency' },
  'ref-countries':                { route: '/reference/countries',        label: 'Country' },
  'admin-roles':                  { route: '/admin/roles',                label: 'Role' },
  'guarantee':                    { route: '/tier1/legal-entity',         label: 'Parent Company Guarantee' },
};
