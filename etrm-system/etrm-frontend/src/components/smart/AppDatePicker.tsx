import { DatePicker } from 'antd';
import type { DatePickerProps } from 'antd';

/**
 * The one date field for the whole app — every date-shaped `Form.Item`
 * should use this instead of antd's `DatePicker` directly or a plain
 * text `Input`. Two things it fixes over ad-hoc usage elsewhere:
 *
 * - A fixed `format` + `Enter`-to-commit: without an explicit format, typed
 *   text can fail to parse as you go and silently get dropped on blur —
 *   `format` pins the parse pattern so typing "2026-07-15" always commits.
 * - Full width + a consistent placeholder, so every date field in the app
 *   looks and behaves the same rather than each page hand-rolling its own
 *   (some as plain `Input` with a date-shaped placeholder and no calendar
 *   at all, some as bare `DatePicker` with inconsistent formats).
 *
 * The underlying antd `DatePicker` value/onChange is a dayjs object (or
 * null) — convert to/from ISO date strings at the form's load/submit
 * boundary (`dayjs(iso)` in, `.format('YYYY-MM-DD')` out), same as before.
 */
export function AppDatePicker(props: DatePickerProps) {
  return (
    <DatePicker
      format="YYYY-MM-DD"
      placeholder="YYYY-MM-DD"
      style={{ width: '100%' }}
      allowClear
      {...props}
    />
  );
}
