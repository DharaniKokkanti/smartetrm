import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';
import { AppShell } from '@components/layout/AppShell';
import { DashboardPage } from '@pages/DashboardPage';
import { NotFoundPage } from '@pages/NotFoundPage';
import { LoginPage } from '@features/auth/LoginPage';
import { RequireAuth } from '@features/auth/RequireAuth';

const Tier1Placeholder = lazy(() =>
  import('@features/tier1/Tier1Placeholder').then((m) => ({ default: m.Tier1Placeholder })),
);
const Tier2HomePage = lazy(() =>
  import('@features/tier2/Tier2HomePage').then((m) => ({ default: m.Tier2HomePage })),
);
const LegalEntityListPage = lazy(() =>
  import('@features/tier1/legal-entity/LegalEntityListPage').then((m) => ({
    default: m.LegalEntityListPage,
  })),
);
const CounterpartyListPage = lazy(() =>
  import('@features/tier1/counterparty/CounterpartyListPage').then((m) => ({
    default: m.CounterpartyListPage,
  })),
);
const CounterpartyFormPage = lazy(() =>
  import('@features/tier1/counterparty/CounterpartyFormPage').then((m) => ({
    default: m.CounterpartyFormPage,
  })),
);

function RouteFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spin size="large" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — RequireAuth redirects to /login if not authenticated */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/tier1"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Tier1Placeholder />
            </Suspense>
          }
        />
        <Route
          path="/tier1/legal-entity"
          element={
            <Suspense fallback={<RouteFallback />}>
              <LegalEntityListPage />
            </Suspense>
          }
        />
        <Route
          path="/tier1/counterparty"
          element={
            <Suspense fallback={<RouteFallback />}>
              <CounterpartyListPage />
            </Suspense>
          }
        />
        <Route
          path="/tier1/counterparty/:id"
          element={
            <Suspense fallback={<RouteFallback />}>
              <CounterpartyFormPage />
            </Suspense>
          }
        />
        <Route
          path="/tier2"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Tier2HomePage />
            </Suspense>
          }
        />
        <Route
          path="/tier2/:tableName"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Tier2HomePage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
