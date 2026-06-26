import { type ReactNode, useEffect, useMemo } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { buildAntdTheme } from '@theme/antd-theme';
import { useThemeStore } from '@store/themeStore';

/**
 * Single React Query client for the whole app. Defaults are tuned for
 * master data specifically: it changes rarely relative to trade/position
 * data, so a longer staleTime avoids refetching reference lookups (currency,
 * commodity, incoterm, etc.) on every navigation. Screens dealing with
 * fast-moving data (positions, live prices) should override staleTime
 * per-query, not change this default.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const antdTheme = useMemo(() => buildAntdTheme(mode), [mode]);

  // Plain-CSS variables (index.css) switch off this attribute, for the few
  // things that live outside antd's theming (e.g. the API log's JSON code
  // block background) — keeps a single source of truth for "is it dark"
  // rather than threading mode through every component that needs a raw CSS value.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ConfigProvider theme={antdTheme}>
      {/* antd's App component wires up contextual message/notification/modal
          so they inherit the theme — using static message/Modal APIs
          directly (e.g. `message.success(...)` at module scope) skips
          theming, so prefer the hooks from AntApp.useApp() in components. */}
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
