import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
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

// Trade
const TradeBlotter = lazy1(() => import('@features/trade/TradeBlotter'), 'TradeBlotter');

// Master Data Hub
const MasterDataHub = lazy1(() => import('@features/master-data/MasterDataHub'), 'MasterDataHub');

// Admin
const SystemUsersPage = lazy1(() => import('@features/admin/system-users/SystemUsersPage'), 'SystemUsersPage');
const RolesPage = lazy1(() => import('@features/admin/roles/RolesPage'), 'RolesPage');

// Contracts
const PaymentTermsPage = lazy1(() => import('@features/contracts/payment-terms/PaymentTermsPage'), 'PaymentTermsPage');
const PaymentMethodsPage = lazy1(() => import('@features/contracts/payment-methods/PaymentMethodsPage'), 'PaymentMethodsPage');
const GtcsPage = lazy1(() => import('@features/contracts/gtcs/GtcsPage'), 'GtcsPage');

// Logistics (new)
const TrucksPage = lazy1(() => import('@features/logistics/trucks/TrucksPage'), 'TrucksPage');
const StoragePage = lazy1(() => import('@features/logistics/storage/StoragePage'), 'StoragePage');

// Reference
const CurrenciesPage = lazy1(() => import('@features/reference/currencies/CurrenciesPage'), 'CurrenciesPage');
const UomPage = lazy1(() => import('@features/reference/uom/UomPage'), 'UomPage');
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

        {/* Trade */}
        <Route path="/trade/blotter" element={<S><TradeBlotter /></S>} />

        {/* Master Data Hub */}
        <Route path="/master-data" element={<S><MasterDataHub /></S>} />

        {/* Admin */}
        <Route path="/admin/users" element={<S><SystemUsersPage /></S>} />
        <Route path="/admin/roles" element={<S><RolesPage /></S>} />

        {/* Contracts */}
        <Route path="/contracts/payment-terms" element={<S><PaymentTermsPage /></S>} />
        <Route path="/contracts/payment-methods" element={<S><PaymentMethodsPage /></S>} />
        <Route path="/contracts/gtcs" element={<S><GtcsPage /></S>} />

        {/* Logistics (new) */}
        <Route path="/logistics/trucks" element={<S><TrucksPage /></S>} />
        <Route path="/logistics/storage" element={<S><StoragePage /></S>} />

        {/* Reference */}
        <Route path="/reference/currencies" element={<S><CurrenciesPage /></S>} />
        <Route path="/reference/uom" element={<S><UomPage /></S>} />
        <Route path="/reference/countries" element={<S><CountriesPage /></S>} />
        <Route path="/reference/incoterms" element={<S><IncotermsPage /></S>} />
        <Route path="/static-data" element={<S><Tier2HomePage /></S>} />
        <Route path="/static-data/:tableName" element={<S><Tier2HomePage /></S>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
