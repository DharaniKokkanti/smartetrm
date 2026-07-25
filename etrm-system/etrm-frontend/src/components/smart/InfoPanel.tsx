import type { CSSProperties, ReactNode } from 'react';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { color, spacing, radius } from '@theme/tokens';

type InfoPanelVariant = 'neutral' | 'info' | 'success';

// Tint/border derived from the real palette (hex + alpha suffix) rather than
// new arbitrary hexes — found during a GUI consistency audit that this same
// "description/hint panel" shape had been hand-rolled 7+ times across the
// app, each with its own slightly different background/border/padding
// (Tier2HomePage, ProductsPage ×5, UomConversionPage, OwnershipPanel,
// ContactsSection/AddressesSection), none of them reading from tokens.ts.
const VARIANT: Record<InfoPanelVariant, { bg: string; border: string; iconColor: string; icon: ReactNode }> = {
  neutral: { bg: color.bg,              border: color.border,        iconColor: color.textSecondary, icon: <InfoCircleOutlined /> },
  info:    { bg: `${color.secondary}14`, border: `${color.secondary}55`, iconColor: color.secondary,  icon: <InfoCircleOutlined /> },
  success: { bg: `${color.success}14`,   border: `${color.success}55`,   iconColor: color.success,    icon: <CheckCircleOutlined /> },
};

interface InfoPanelProps {
  variant?: InfoPanelVariant;
  /** Set false to drop the leading icon entirely. */
  icon?: boolean;
  /** Tighter padding for panels nested inside an already-dense form. */
  compact?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}

/** Shared "description / hint / callout" banner — the one panel shape every
 *  screen in the app should reach for instead of hand-rolling its own
 *  background+border+padding combination. */
export function InfoPanel({ variant = 'neutral', icon = true, compact = false, style, children }: InfoPanelProps) {
  const v = VARIANT[variant];
  return (
    <div style={{
      display: 'flex',
      gap: spacing.sm,
      alignItems: 'flex-start',
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: radius.md,
      padding: compact ? '8px 12px' : `${spacing.sm}px ${spacing.lg}px`,
      marginBottom: spacing.md,
      ...style,
    }}>
      {icon && (
        <span style={{ color: v.iconColor, fontSize: 13, marginTop: 2, flexShrink: 0 }}>
          {v.icon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: color.textPrimary, lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}
