import type { BalmoProduct, BalmoProductInput } from './types';

const BASE = '/api/balmo-products';

export const balmoProductsApi = {
  list: (): Promise<BalmoProduct[]> =>
    fetch(BASE).then((r) => r.json() as Promise<BalmoProduct[]>),

  create: (input: BalmoProductInput): Promise<BalmoProduct> =>
    fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then((r) => r.json() as Promise<BalmoProduct>),

  update: (id: number, input: BalmoProductInput): Promise<BalmoProduct> =>
    fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then((r) => r.json() as Promise<BalmoProduct>),
};
