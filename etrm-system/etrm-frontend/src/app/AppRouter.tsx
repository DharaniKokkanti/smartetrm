import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppShell } from '@components/layout/AppShell';
import { DashboardPage } from '@pages/DashboardPage';
import { NotFoundPage } from '@pages/NotFoundPage';
import { LoginPage } from '@features/auth/LoginPage';
import { RequireAuth } from '@features/auth/RequireAuth';

function lazy1<T extends Record<string, React.ComponentType>>(
  factory: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(() => factory().then((m) => ({ default: m[exportName] as React.ComponentType })));
}

// Legacy tier pages
const Tier1Placeholder = lazy1(() => import('@features/tier1/Tier1Placeholder'), 'Tier1Placeholder');
const Tier2HomePage = lazy1(() => import('@features/tier2/Tier2HomePage'), 'Tier2HomePage');
const LegalEntityListPage = lazy1(() => import('@features/tier1/legal-entity/LegalEntityListPage'), 'LegalEntityListPage');
const CounterpartyListPage = lazy1(() => import('@features/tier1/counterparty/CounterpartyListPage'), 'CounterpartyListPage');
const CounterpartyFormPage = lazy1(() => import('@features/tier1/counterparty/CounterpartyFormPage'), 'CounterpartyFormPage');

// Organization
const DesksPage = lazy1(() => import('@features/organization/desks/DesksPage'), 'DesksPage');
const BooksPage = lazy1(() => import('@features/organization/books/BooksPage'), 'BooksPage');
const TradersPage = lazy1(() => import('@features/organization/traders/TradersPage'), 'TradersPage');
const BrokersPage = lazy1(() => import('@features/organization/brokers/BrokersPage'), 'BrokersPage');

// Markets
const MarketsPage = lazy1(() => import('@features/markets/markets/MarketsPage'), 'MarketsPage');
const ProductsPage = lazy1(() => import('@features/markets/products/ProductsPage'), 'ProductsPage');
const PriceIndicesPage = lazy1(() => import('@features/markets/price-indices/PriceIndicesPage'), 'PriceIndicesPage');
const ExchangesPage = lazy1(() => import('@features/markets/exchanges/ExchangesPage'), 'ExchangesPage');

// Logistics
const LocationsPage = lazy1(() => import('@features/logistics/locations/LocationsPage'), 'LocationsPage');
const VesselsPage = lazy1(() => import('@features/logistics/vessels/VesselsPage'), 'VesselsPage');
const PipelinesPage = lazy1(() => import('@features/logistics/pipelines/PipelinesPage'), 'PipelinesPage');

// Calendar
const HolidayCalendarsPage = lazy1(() => import('@features/calendar/holiday-calendars/HolidayCalendarsPage'), 'HolidayCalendarsPage');
const PeriodsPage = lazy1(() => import('@features/calendar/periods/PeriodsPage'), 'PeriodsPage');

// Pricing
const PricingRulesPage = lazy1(() => import('@features/pricing/pricing-rules/PricingRulesPage'), 'PricingRulesPage');
const PriceSourcesPage = lazy1(() => import('@features/pricing/price-sources/PriceSourcesPage'), 'PriceSourcesPage');
const SettlementPricesPage = lazy1(() => import('@features/pricing/settlement-prices/SettlementPricesPage'), 'SettlementPricesPage');
const TasDashboardPage = lazy1(() => import('@features/pricing/tas/TasDashboardPage'), 'TasDashboardPage');
const BalmoProductsPage = lazy1(() => import('@features/pricing/balmo-products/BalmoProductsPage'), 'BalmoProductsPage');
const BalmoDashboardPage = lazy1(() => import('@features/pricing/balmo/BalmoDashboardPage'), 'BalmoDashboardPage');

// BOLMO
const BolmoAgreementsPage = lazy1(() => import('@features/bolmo/BolmoAgreementsPage'), 'BolmoAgreementsPage');

// Trade
const TradeBlotter = lazy1(() => import('@features/trade/TradeBlotter'), 'TradeBlotter');
const PositionPage = lazy1(() => import('@features/trade/positions/PositionPage'), 'PositionPage');

// Master Data Hub
const MasterDataHub = lazy1(() => import('@features/master-data/MasterDataHub'), 'MasterDataHub');

// Admin
const SystemUsersPage = lazy1(() => import('@features/admin/system-users/SystemUsersPage'), 'SystemUsersPage');
const RolesPage = lazy1(() => import('@features/admin/roles/RolesPage'), 'RolesPage');
const FieldPermissionsPage = lazy1(() => import('@features/admin/field-permissions/FieldPermissionsPage'), 'FieldPermissionsPage');

// Credit & Risk
const MarginAgreementsPage = lazy1(() => import('@features/credit/margin-agreements/MarginAgreementsPage'), 'MarginAgreementsPage');
const CreditLimitsPage = lazy1(() => import('@features/credit/credit-limits/CreditLimitsPage'), 'CreditLimitsPage');
const LettersOfCreditPage = lazy1(() => import('@features/credit/letters-of-credit/LettersOfCreditPage'), 'LettersOfCreditPage');

const RinsHub = lazy1(() => import('@features/rins/RinsHub'), 'RinsHub');
const FuelCategoriesPage = lazy1(() => import('@features/rins/fuel-categories/FuelCategoriesPage'), 'FuelCategoriesPage');
const RinAccountsPage = lazy1(() => import('@features/rins/rin-accounts/RinAccountsPage'), 'RinAccountsPage');
const RinTransactionsPage = lazy1(() => import('@features/rins/rin-transactions/RinTransactionsPage'), 'RinTransactionsPage');
const RinInventoryPage = lazy1(() => import('@features/rins/rin-inventory/RinInventoryPage'), 'RinInventoryPage');
const RinObligationsPage = lazy1(() => import('@features/rins/rin-obligations/RinObligationsPage'), 'RinObligationsPage');

const EnvironmentalHub = lazy1(() => import('@features/environmental/EnvironmentalHub'), 'EnvironmentalHub');
const EmissionSchemesPage = lazy1(() => import('@features/environmental/emission-schemes/EmissionSchemesPage'), 'EmissionSchemesPage');
const EnvironmentalProductsPage = lazy1(() => import('@features/environmental/environmental-products/EnvironmentalProductsPage'), 'EnvironmentalProductsPage');
const CarbonRegistriesPage = lazy1(() => import('@features/environmental/carbon-registries/CarbonRegistriesPage'), 'CarbonRegistriesPage');
const EmissionObligationsPage = lazy1(() => import('@features/environmental/emission-obligations/EmissionObligationsPage'), 'EmissionObligationsPage');
const GlAccountsPage = lazy1(() => import('@features/finance/gl-accounts/GlAccountsPage'), 'GlAccountsPage');

// Contracts
const PaymentTermsPage = lazy1(() => import('@features/contracts/payment-terms/PaymentTermsPage'), 'PaymentTermsPage');
const PaymentMethodsPage = lazy1(() => import('@features/contracts/payment-methods/PaymentMethodsPage'), 'PaymentMethodsPage');
const GtcsPage = lazy1(() => import('@features/contracts/gtcs/GtcsPage'), 'GtcsPage');
const BrokerFeeAgreementsPage = lazy1(() => import('@features/contracts/broker-fee-agreements/BrokerFeeAgreementsPage'), 'BrokerFeeAgreementsPage');

// Logistics (new)
const TrucksPage = lazy1(() => import('@features/logistics/trucks/TrucksPage'), 'TrucksPage');
const StoragePage = lazy1(() => import('@features/logistics/storage/StoragePage'), 'StoragePage');

// Reference
const CurrenciesPage = lazy1(() => import('@features/reference/currencies/CurrenciesPage'), 'CurrenciesPage');
const UomPage = lazy1(() => import('@features/reference/uom/UomPage'), 'UomPage');
const UomConversionPage = lazy1(() => import('@features/reference/uom-conversions/UomConversionPage'), 'UomConversionPage');
const CountriesPage = lazy1(() => import('@features/reference/countries/CountriesPage'), 'CountriesPage');
const IncotermsPage = lazy1(() => import('@features/reference/incoterms/IncotermsPage'), 'IncotermsPage');

function RouteFallback() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/" element={<DashboardPage />} />

        {/* Organization */}
        <Route path="/org/desks" element={<S><DesksPage /></S>} />
        <Route path="/org/books" element={<S><BooksPage /></S>} />
        <Route path="/org/traders" element={<S><TradersPage /></S>} />
        <Route path="/org/brokers" element={<S><BrokersPage /></S>} />

        {/* Counterparties */}
        <Route path="/tier1/legal-entity" element={<S><LegalEntityListPage /></S>} />
        <Route path="/tier1/counterparty" element={<S><CounterpartyListPage /></S>} />
        <Route path="/tier1/counterparty/:id" element={<S><CounterpartyFormPage /></S>} />
        <Route path="/tier1" element={<S><Tier1Placeholder /></S>} />

        {/* Markets */}
        <Route path="/markets/markets" element={<S><MarketsPage /></S>} />
        <Route path="/markets/products" element={<S><ProductsPage /></S>} />
        <Route path="/markets/price-indices" element={<S><PriceIndicesPage /></S>} />
        <Route path="/markets/exchanges" element={<S><ExchangesPage /></S>} />

        {/* Logistics */}
        <Route path="/logistics/locations" element={<S><LocationsPage /></S>} />
        <Route path="/logistics/vessels" element={<S><VesselsPage /></S>} />
        <Route path="/logistics/pipelines" element={<S><PipelinesPage /></S>} />

        {/* Calendar */}
        <Route path="/calendar/holiday-calendars" element={<S><HolidayCalendarsPage /></S>} />
        <Route path="/calendar/periods" element={<S><PeriodsPage /></S>} />

        {/* Pricing */}
        <Route path="/pricing/pricing-rules" element={<S><PricingRulesPage /></S>} />
        <Route path="/pricing/price-sources" element={<S><PriceSourcesPage /></S>} />
        <Route path="/pricing/settlement-prices" element={<S><SettlementPricesPage /></S>} />
        <Route path="/pricing/tas" element={<S><TasDashboardPage /></S>} />
        <Route path="/pricing/balmo-products" element={<S><BalmoProductsPage /></S>} />
        <Route path="/pricing/balmo" element={<S><BalmoDashboardPage /></S>} />

        {/* BOLMO */}
        <Route path="/bolmo" element={<S><BolmoAgreementsPage /></S>} />

        {/* Trade */}
        <Route path="/trade/blotter" element={<S><TradeBlotter /></S>} />
        <Route path="/position" element={<S><PositionPage /></S>} />

        {/* Master Data Hub */}
        <Route path="/master-data" element={<S><MasterDataHub /></S>} />

        {/* Admin */}
        <Route path="/admin/users" element={<S><SystemUsersPage /></S>} />
        <Route path="/admin/roles" element={<S><RolesPage /></S>} />
        <Route path="/admin/field-permissions" element={<S><FieldPermissionsPage /></S>} />

        {/* Credit & Risk — no standalone hub; the Master Data Hub's "Credit &
            Collateral" group is the single entry point, individual pages are
            reached directly from the sidebar. */}
        <Route path="/credit" element={<Navigate to="/master-data" replace />} />
        <Route path="/credit/margin-agreements" element={<S><MarginAgreementsPage /></S>} />
        <Route path="/credit/limits" element={<S><CreditLimitsPage /></S>} />
        <Route path="/credit/letters-of-credit" element={<S><LettersOfCreditPage /></S>} />

        {/* RINs — Renewable Fuel Standard */}
        <Route path="/rins" element={<S><RinsHub /></S>} />
        <Route path="/rins/fuel-categories" element={<S><FuelCategoriesPage /></S>} />
        <Route path="/rins/accounts" element={<S><RinAccountsPage /></S>} />
        <Route path="/rins/transactions" element={<S><RinTransactionsPage /></S>} />
        <Route path="/rins/inventory" element={<S><RinInventoryPage /></S>} />
        <Route path="/rins/obligations" element={<S><RinObligationsPage /></S>} />

        {/* Carbon & Environmental */}
        <Route path="/environmental" element={<S><EnvironmentalHub /></S>} />
        <Route path="/environmental/schemes" element={<S><EmissionSchemesPage /></S>} />
        <Route path="/environmental/products" element={<S><EnvironmentalProductsPage /></S>} />
        <Route path="/environmental/registries" element={<S><CarbonRegistriesPage /></S>} />
        <Route path="/environmental/obligations" element={<S><EmissionObligationsPage /></S>} />

        {/* Finance */}
        <Route path="/finance/gl-accounts" element={<S><GlAccountsPage /></S>} />

        {/* Contracts */}
        <Route path="/contracts/payment-terms" element={<S><PaymentTermsPage /></S>} />
        <Route path="/contracts/payment-methods" element={<S><PaymentMethodsPage /></S>} />
        <Route path="/contracts/gtcs" element={<S><GtcsPage /></S>} />
        <Route path="/contracts/broker-fee-agreements" element={<S><BrokerFeeAgreementsPage /></S>} />

        {/* Logistics (new) */}
        <Route path="/logistics/trucks" element={<S><TrucksPage /></S>} />
        <Route path="/logistics/storage" element={<S><StoragePage /></S>} />

        {/* Reference */}
        <Route path="/reference/currencies" element={<S><CurrenciesPage /></S>} />
        <Route path="/reference/uom" element={<S><UomPage /></S>} />
        <Route path="/reference/uom-conversions" element={<S><UomConversionPage /></S>} />
        <Route path="/reference/countries" element={<S><CountriesPage /></S>} />
        <Route path="/reference/incoterms" element={<S><IncotermsPage /></S>} />
        <Route path="/static-data" element={<S><Tier2HomePage /></S>} />
        <Route path="/static-data/:tableName" element={<S><Tier2HomePage /></S>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
