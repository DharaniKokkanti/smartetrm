import { theme as antdThemeApi, type ThemeConfig } from 'antd';
import { paletteFor, font, radius, type ThemeMode } from './tokens';

/**
 * Builds the ConfigProvider theme for a given mode, derived entirely from
 * tokens.ts. Components should never hardcode a hex value — pull from
 * tokens.ts (raw) or this function's output instead, so the palette only
 * ever needs to change in one place, light or dark.
 */
export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  const color = paletteFor(mode);
  return {
    algorithm: mode === 'dark' ? antdThemeApi.darkAlgorithm : antdThemeApi.defaultAlgorithm,
    token: {
      colorPrimary: color.primary,
      colorLink: color.secondary,
      colorSuccess: color.success,
      colorWarning: color.warning,
      colorError: color.error,
      colorBgBase: color.bg,
      colorBgContainer: color.bgElevated,
      colorBorder: color.border,
      colorBorderSecondary: color.border,
      colorText: color.textPrimary,
      colorTextSecondary: color.textSecondary,
      colorTextDisabled: color.textDisabled,
      fontFamily: font.body,
      fontSize: 14,
      borderRadius: radius.md,
      borderRadiusSM: radius.sm,
      borderRadiusLG: radius.lg,
      wireframe: false,
    },
    components: {
      Layout: {
        headerBg: color.primary,
        siderBg: color.bgElevated,
        bodyBg: color.bg,
        headerHeight: 56,
      },
      Menu: {
        itemSelectedBg: mode === 'dark' ? '#2A2750' : '#EEEDFE',
        itemSelectedColor: color.primary,
        itemHoverBg: mode === 'dark' ? '#26262B' : '#F2F1EC',
        itemHeight: 36,
      },
      Table: {
        headerBg: mode === 'dark' ? '#1C1C20' : '#FAFAF7',
        headerColor: color.textSecondary,
        rowHoverBg: mode === 'dark' ? '#1C1C20' : '#FAFAF7',
        borderColor: color.border,
        fontSize: 13,
      },
      Card: {
        borderRadiusLG: radius.lg,
        headerFontSize: 15,
      },
      Button: {
        controlHeight: 32,
        fontWeight: 500,
      },
      Form: {
        labelFontSize: 13,
        verticalLabelPadding: '0 0 4px',
      },
      Tag: {
        borderRadiusSM: radius.sm,
      },
    },
  };
}
