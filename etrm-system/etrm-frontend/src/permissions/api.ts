import { apiClient } from '@services/api';
import type {
  EffectiveFieldPermissionsResponse,
  FieldPermissionProfile,
  ObjectLockParams,
  ProfileDetailResponse,
} from './types';

export async function fetchEffectiveFieldPermissions(
  screenCode: string,
  lockParams?: ObjectLockParams,
): Promise<EffectiveFieldPermissionsResponse> {
  const params: Record<string, string | number | boolean> = { screen: screenCode };
  if (lockParams?.tradeStatus)           params.tradeStatus  = lockParams.tradeStatus;
  if (lockParams?.hasInvoice  != null)   params.hasInvoice   = lockParams.hasInvoice;
  if (lockParams?.hasCost     != null)   params.hasCost      = lockParams.hasCost;
  if (lockParams?.hasShipment != null)   params.hasShipment  = lockParams.hasShipment;
  if (lockParams?.tradeType)             params.tradeType    = lockParams.tradeType;
  const { data } = await apiClient.get<EffectiveFieldPermissionsResponse>(
    '/permissions/effective-fields', { params });
  return data;
}

export async function fetchProfiles(screenCode: string): Promise<FieldPermissionProfile[]> {
  const { data } = await apiClient.get<FieldPermissionProfile[]>(
    '/permissions/profiles', { params: { screen: screenCode } });
  return data;
}

export async function fetchProfileDetail(
  profileId: number,
  screenCode: string,
): Promise<ProfileDetailResponse> {
  const { data } = await apiClient.get<ProfileDetailResponse>(
    `/permissions/profiles/${profileId}`, { params: { screen: screenCode } });
  return data;
}

export async function updateProfileRules(
  profileId: number,
  rules: { fieldId: number; fieldPermission: string }[],
): Promise<ProfileDetailResponse> {
  const { data } = await apiClient.put<ProfileDetailResponse>(
    `/permissions/profiles/${profileId}/rules`, rules);
  return data;
}

export async function createProfile(
  profile: Omit<FieldPermissionProfile, 'profileId' | 'isActive'>,
): Promise<FieldPermissionProfile> {
  const { data } = await apiClient.post<FieldPermissionProfile>('/permissions/profiles', profile);
  return data;
}
