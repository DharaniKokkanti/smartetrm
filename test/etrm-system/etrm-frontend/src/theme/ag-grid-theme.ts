import { themeQuartz, colorSchemeDark } from 'ag-grid-community';
import { paletteFor, font, type ThemeMode } from './tokens';

/**
 * AG Grid v33+ Theming API, mode-aware. Grids appear in both Tier 1 list
 * views and the Tier 2 generic reference-data table, so this is built once
 * here rather than per-screen. Dark mode composes the official
 * colorSchemeDark part as a base, then layers the app's own palette on top
 * via withParams — rather than hand-tuning every dark color independently,
 * which tends to drift out of sync with the rest of the app over time.
 *
 * Deliberately NOT using the legacy ag-theme-alpine CSS class approach —
 * that's the pre-v33 pattern and is on a deprecation path.
 */
export function buildAgGridTheme(mode: ThemeMode) {
  const color = paletteFor(mode);
  const base = mode === 'dark' ? themeQuartz.withPart(colorSchemeDark) : themeQuartz;

  return base.withParams({
    accentColor: color.primary,
    backgroundColor: color.bgElevated,
    foregroundColor: color.textPrimary,
    borderColor: color.border,
    headerBackgroundColor: mode === 'dark' ? '#1C1C20' : '#FAFAF7',
    headerTextColor: color.textSecondary,
    headerFontWeight: 600,
    oddRowBackgroundColor: mode === 'dark' ? '#1C1C20' : '#FBFBF9',
    rowHoverColor: mode === 'dark' ? '#26262B' : '#F2F1EC',
    selectedRowBackgroundColor: mode === 'dark' ? '#2A2750' : '#EEEDFE',
    fontFamily: font.body,
    // Numeric/ID columns set cellClass="cell-mono" at the column-def level to
    // pick up the monospace stack defined in index.css — tabular figures
    // matter more than grid-wide font choice for those columns specifically.
    fontSize: 13,
    headerHeight: 36,
    rowHeight: 34,
    spacing: 6,
    wrapperBorderRadius: 6,
  });
}
