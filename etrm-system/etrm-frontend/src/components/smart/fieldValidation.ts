import type { Rule } from 'antd/es/form';

/**
 * Shared input-validation building blocks for every form field in the app —
 * used by both the generic Tier 2 reference-data screen
 * (`features/tier2/ReferenceDataTable.tsx`, metadata-driven, one component
 * covering ~100+ tables) and every bespoke feature page's hand-written
 * `Form.Item`. One set of rules, so a text field on the Products page and a
 * text field on a Tier 2 lookup table reject exactly the same things — a
 * new page should import from here, not write its own regex.
 *
 * This is the UX layer only. The real gate is server-side: mirrored in
 * `ReferenceDataCrudService.java`'s `validateValue()` for Tier 2, and should
 * be mirrored the same way in any bespoke page's own controller/DTO
 * validation — never trust that a value reaching the API already passed
 * these rules, since a client can always call the API directly.
 */

// A leading -/=/+/@ turns a text value into an executable formula the
// moment it's opened in Excel/Sheets — a real risk here since most
// reference tables and several feature pages support CSV/Excel
// import/export. `< > \`` are blocked anywhere in the value, not just
// leading, since they're how stored text turns into markup/code if ever
// rendered unescaped or interpolated somewhere down the line. Everything
// else — apostrophes, ampersands, accented characters, currency symbols,
// ordinary punctuation — stays allowed; counterparty/product names and
// free-text notes legitimately use them.
export const UNSAFE_LEADING_CHARS = /^[-=+@]/;
export const UNSAFE_ANYWHERE_CHARS = /[<>`]/;
export const INTEGER_STRING = /^-?\d+$/;

/** Drop into any `Form.Item`'s `rules` array for a free-text or code
 *  field — `<Form.Item name="x" rules={[safeTextRule()]}>`. */
export function safeTextRule(): Rule {
  return {
    validator: (_rule, value: string | undefined | null) => {
      if (!value) return Promise.resolve();
      if (UNSAFE_LEADING_CHARS.test(value)) {
        return Promise.reject(new Error(
          "Can't start with - = + or @ (blocked — these turn into a spreadsheet formula if this value is ever opened in Excel).",
        ));
      }
      if (UNSAFE_ANYWHERE_CHARS.test(value)) {
        return Promise.reject(new Error('The characters < > ` are not allowed.'));
      }
      return Promise.resolve();
    },
  };
}

/** Drop into any `Form.Item`'s `rules` array for a whole-number field —
 *  belt-and-braces for a raw `<Input>` used as a numeric field, or any
 *  `<InputNumber>` that isn't using `integerInputNumberProps` below (e.g.
 *  because it also needs custom `parser`/`formatter`). Prefer
 *  `integerInputNumberProps` when the field is a plain `<InputNumber>` —
 *  it prevents the fractional keystroke instead of rejecting after the
 *  fact. */
export function integerRule(): Rule {
  return {
    validator: (_rule, value: number | string | undefined | null) => {
      if (value === undefined || value === null || value === '') return Promise.resolve();
      if (!INTEGER_STRING.test(String(value))) {
        return Promise.reject(new Error('Must be a whole number.'));
      }
      return Promise.resolve();
    },
  };
}

/** Spread onto an `<InputNumber {...integerInputNumberProps} />` for a
 *  whole-number field — rounds a fractional keystroke to the nearest
 *  integer on blur rather than silently accepting "3.7". Leave unspread
 *  (plain `<InputNumber />`) for genuinely fractional fields — rates,
 *  prices, percentages, physical capacities. */
export const integerInputNumberProps = { precision: 0, step: 1 } as const;
