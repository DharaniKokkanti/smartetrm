import { apiClient } from '@services/api';
import type { OptionIndexLink, OptionIndexLinkInput } from './types';

export const optionIndexLinksApi = {
  list: () => apiClient.get<OptionIndexLink[]>('/option-index-links').then((r) => r.data),
  create: (input: OptionIndexLinkInput) => apiClient.post<OptionIndexLink>('/option-index-links', input).then((r) => r.data),
  update: (id: number, input: OptionIndexLinkInput) => apiClient.put<OptionIndexLink>(`/option-index-links/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/option-index-links/${id}/deactivate`),
};
