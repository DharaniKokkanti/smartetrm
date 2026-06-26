import { setupWorker } from 'msw/browser';
import { authHandlers } from './authHandlers';
import { legalEntityHandlers } from './handlers';
import { counterpartyHandlers } from './counterpartyHandlers';
import { guaranteeHandlers } from './guaranteeHandlers';
import { referenceDataHandlers } from './referenceDataHandlers';

export const worker = setupWorker(
  ...authHandlers,
  ...legalEntityHandlers,
  ...counterpartyHandlers,
  ...guaranteeHandlers,
  ...referenceDataHandlers,
);
