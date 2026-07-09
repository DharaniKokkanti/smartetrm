export type AccessLevel = 'EDIT' | 'VIEW' | 'HIDDEN';

export type FieldPermissionMap = Record<string, AccessLevel>;

export interface FieldMeta {
  fieldKey: string;
  fieldLabel: string;
  fieldGroup: string | null;
  isRequiredField: boolean;
  sortOrder: number;
}

export interface EffectiveFieldPermissionsResponse {
  screenCode: string;
  permissions: FieldPermissionMap;
  lockedFields: Record<string, string>;   // fieldKey → lock reason (Layer 1 only)
  fieldRegistry: FieldMeta[];
}

export interface FieldRuleDto {
  fieldId: number;
  fieldKey: string;
  fieldLabel: string;
  fieldGroup: string | null;
  isRequiredField: boolean;
  sortOrder: number;
  fieldPermission: AccessLevel;
}

export interface ProfileDetailResponse {
  profileId: number;
  profileCode: string;
  profileName: string;
  description: string | null;
  screenCode: string;
  rules: FieldRuleDto[];
}

export interface FieldPermissionProfile {
  profileId: number;
  profileCode: string;
  profileName: string;
  description: string | null;
  screenCode: string;
  isActive: boolean;
}

/** Object state passed as query params to scope Layer 1 evaluation. */
export interface ObjectLockParams {
  tradeStatus?: string;
  hasInvoice?: boolean;
  hasCost?: boolean;
  hasShipment?: boolean;
  // V78: trade.trade_type is now a numeric FK id in the domain model, but
  // this Layer 1 lock-rule matcher was never wired to branch on its value
  // (just forwarded as a query param) — widened rather than assuming
  // behavior that was never actually implemented.
  tradeType?: string | number;
}
