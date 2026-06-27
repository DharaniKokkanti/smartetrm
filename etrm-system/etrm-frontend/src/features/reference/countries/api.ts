import { apiClient } from '@services/api';
import type { Country, CountryInput } from './types';
export const countriesApi = {
  list: () => apiClient.get<Country[]>('/countries').then((r) => r.data),
  create: (input: CountryInput) => apiClient.post<Country>('/countries', input).then((r) => r.data),
  update: (code: string, input: Partial<CountryInput>) => apiClient.put<Country>(`/countries/${code}`, input).then((r) => r.data),
  deactivate: (code: string) => apiClient.patch(`/countries/${code}/deactivate`, {}),
};
