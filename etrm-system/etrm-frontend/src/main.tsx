import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import '@theme/ag-grid-setup';
import { AppProviders } from '@app/AppProviders';
import { AppRouter } from '@app/AppRouter';

async function bootstrap() {
  // Mock backend — active by default in dev (VITE_USE_MOCKS, see
  // .env.development) until the real Spring Boot API exists. Flip the env
  // var to false once pointing at a live backend; nothing else needs to
  // change, since this only intercepts network requests, it doesn't
  // replace services/api.ts.
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('@/mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
    });
  } else if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    // MSW's service worker is registered at the browser/origin level, not
    // tied to this Vite session — once started, it silently keeps
    // intercepting every /api/v1/* request (answering with fake mock data)
    // across reloads and even dev-server restarts, until explicitly
    // unregistered. Self-heal here so flipping VITE_USE_MOCKS to false is
    // enough on its own, without a manual DevTools step every time.
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </StrictMode>,
  );
}

bootstrap();
