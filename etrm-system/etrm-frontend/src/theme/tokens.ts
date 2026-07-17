/**
 * ETRM design tokens — single source of truth.
 *
 * These carry forward the visual identity already established in the
 * project's schema reference documents (navy/blue primary, teal for Tier 2
 * reference data, violet for Tier 1 core entities) so the docs and the app
 * read as one product, not two.
 *
 * Why these specific choices:
 * - Warm-neutral grays instead of pure cool gray: this is a screen people
 *   stare at for long stretches doing repetitive data entry. A slightly
 *   warm base (vs. clinical pure white/gray) reduces glare fatigue without
 *   looking unprofessional.
 * - IBM Plex Sans / Plex Mono instead of the default Inter+system-mono
 *   pairing: Plex was designed for technical/engineering contexts (IBM's
 *   own tooling), has genuine tabular lining figures for grid alignment,
 *   and reads distinctly from the generic SaaS-dashboard look most
 *   AI-assisted builds converge on. Two families only — this is dense
 *   utility software, not a marketing site; restraint is the point.
 * - Module color rail: each functional module (Tier 1 entity group, Tier 2
 *   module_group) gets one accent color, used as a thin left-edge rail on
 *   cards/nav items. This is the one "signature" device in the system —
 *   color encodes *which module you're in*, which matters when navigating
 *   135 tables, rather than decorating for its own sake.
 */

export const color = {
  // Primary — navy, matches the schema reference doc headers
  primary: '#1F3864',
  primaryHover: '#284A82',
  primaryActive: '#162847',

  // Secondary — steel blue, links/focus/info
  secondary: '#2E75B6',

  // Module accents (the "color rail")
  moduleTier1: '#534AB7', // violet — core entity screens
  moduleTier2: '#0F6E56', // teal — generic reference data
  moduleFreight: '#0F6E56',
  modulePower: '#B7791F',
  moduleTrade: '#1F3864',
  modulePosition: '#2E75B6',
  moduleOrganization: '#534AB7', // violet — internal org (desks, books, traders)
  moduleMarkets: '#1E6A9E',      // ocean blue — markets, products, indices
  moduleLogistics: '#2E6B5C',    // forest — vessels, pipelines, locations
  moduleCalendar: '#6B4F9E',     // plum — calendars, periods
  modulePricing: '#8B3A2F',      // rust — pricing rules, formulas
  moduleCredit: '#1B6B6B',       // teal/dark — credit instruments, collateral

  // Status
  success: '#1B7A5C',
  warning: '#B7791F',
  error: '#9F2351',
  errorBg: '#FBEAF0',
  errorBorder: '#D4537E',

  // Neutrals — warm-tinted, not pure gray
  bg: '#F7F6F3',
  bgElevated: '#FFFFFF',
  border: '#DEDCD3',
  borderStrong: '#B4B2A9',
  textPrimary: '#1C1C1A',
  textSecondary: '#5F5E5A',
  textDisabled: '#9B9A93',
} as const;

/**
 * Dark variant. Not just inverted lightness — module accent hues are
 * brightened slightly (e.g. moduleTier1 violet, modulePower amber) so they
 * stay legible against a dark background instead of going muddy, and the
 * background uses a warm-tinted near-black (not pure #000) for the same
 * reason the light bg isn't pure white: less eye strain on a screen people
 * stare at for long data-entry sessions.
 */
export const darkColor = {
  primary: '#4C7BC4',
  primaryHover: '#6691D2',
  primaryActive: '#3A65A8',

  secondary: '#5B9BD9',

  moduleTier1: '#8B7FE8',
  moduleTier2: '#2BA888',
  moduleFreight: '#2BA888',
  modulePower: '#D9A23B',
  moduleTrade: '#4C7BC4',
  modulePosition: '#5B9BD9',
  moduleOrganization: '#8B7FE8',
  moduleMarkets: '#4A9FD4',
  moduleLogistics: '#4BAF8C',
  moduleCalendar: '#9B7FD4',
  modulePricing: '#C4695A',
  moduleCredit: '#3ABABA',

  success: '#3FA37D',
  warning: '#D9A23B',
  error: '#D9608A',
  errorBg: '#3A2430',
  errorBorder: '#8C4259',

  bg: '#17171A',
  bgElevated: '#222226',
  border: '#34343A',
  borderStrong: '#46464E',
  textPrimary: '#EDEDED',
  textSecondary: '#A8A8AD',
  textDisabled: '#6B6B70',
} as const;

export type ThemeMode = 'light' | 'dark';

export function paletteFor(mode: ThemeMode) {
  return mode === 'dark' ? darkColor : color;
}

export const font = {
  body: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'IBM Plex Mono', 'Consolas', 'SFMono-Regular', monospace",
} as const;

export const typeScale = {
  xs: 12,
  sm: 13,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
} as const;

export const motion = {
  fast: '120ms ease',
  base: '200ms ease',
  slow: '320ms ease',
} as const;

/** Maps a module_group string (from master_data_table_registry) to its rail color. */
export function moduleColor(group: string, palette: typeof color = color): string {
  const key = group.toLowerCase();
  if (key.includes('freight') || key.includes('logistics') || key.includes('voyage') || key.includes('charter')) return palette.moduleLogistics;
  if (key.includes('power')) return palette.modulePower;
  if (key.includes('trade')) return palette.moduleTrade;
  if (key.includes('position')) return palette.modulePosition;
  if (key.includes('org') || key.includes('desk') || key.includes('book') || key.includes('trader')) return palette.moduleOrganization;
  if (key.includes('market') || key.includes('product') || key.includes('index') || key.includes('exchange')) return palette.moduleMarkets;
  if (key.includes('vessel') || key.includes('pipeline') || key.includes('location') || key.includes('storage') || key.includes('supply') || key.includes('distribution')) return palette.moduleLogistics;
  if (key.includes('calendar') || key.includes('period') || key.includes('holiday')) return palette.moduleCalendar;
  if (key.includes('pric') || key.includes('formula')) return palette.modulePricing;
  if (key.includes('credit') || key.includes('collateral') || key.includes('margin') || key.includes('lc') || key.includes('guarantee')) return palette.moduleCredit;
  return palette.moduleTier2;
}
