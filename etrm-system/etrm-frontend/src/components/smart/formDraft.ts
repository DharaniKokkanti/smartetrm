import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { message } from 'antd';
import type { FormInstance } from 'antd';

/**
 * In-memory draft store for capture forms.
 *
 * Problem: a trader opens "New Trade", fills half the form, then needs to go
 * check a counterparty's credit limit on another page. Navigating away unmounts
 * the page and the drawer — everything typed is lost.
 *
 * Solution: when a page unmounts while its capture drawer is open, the form
 * values + editing state are stashed here and surfaced as a pinned chip
 * (`MinimizedDraftsDock`). The drawer does NOT reopen automatically when the
 * user lands back on the page — that would hijack the page every time (e.g.
 * blocking them from opening a *different* existing record) until they'd
 * fished the old draft back out. It only restores when the user explicitly
 * clicks the pin, via `requestRestore`. A dormant, un-resumed draft is never
 * silently discarded by navigation alone — only by being resumed, or by the
 * user explicitly dismissing its pin.
 *
 * Multiple drafts can coexist under the same logical form `key` — e.g.
 * minimizing a brand-new trade and then, separately, minimizing an edit of
 * an existing trade both leave their own pin. Each draft's storage id is
 * `${key}:new` or `${key}:edit:<snapshot of editing>`, so re-minimizing the
 * *same* record just replaces its own pin rather than piling up duplicates.
 *
 * Deliberately in-memory (not sessionStorage): form values can hold dayjs
 * objects and other non-serialisable instances, and drafts should not outlive
 * the session anyway.
 */
interface DraftEntry {
  id: string;
  /** The form key this entry belongs to (e.g. 'trade', 'org-desks') — used by the dock to look up route/label. */
  key: string;
  values: Record<string, unknown>;
  editing: unknown;
  extra?: Record<string, unknown>;
  /**
   * Per-entry route/label override for forms whose route or display name
   * isn't a fixed constant (e.g. a specific Static Data table keyed by name,
   * or a specific counterparty id) — takes precedence over the static
   * `DRAFT_META` lookup the dock otherwise uses for this entry's `key`.
   */
  route?: string;
  label?: string;
}

interface DraftStoreState {
  drafts: Record<string, DraftEntry>;
  stash: (entry: DraftEntry) => void;
  peek: (id: string) => DraftEntry | undefined;
  discard: (id: string) => void;
  /** Set by the pin chip when clicked; consumed by the owning page's restore effect. */
  restoreRequestId: string | null;
  requestRestore: (id: string) => void;
  clearRestoreRequest: () => void;
}

export const useDraftStore = create<DraftStoreState>((set, get) => ({
  drafts: {},
  stash: (entry) => set((s) => ({ drafts: { ...s.drafts, [entry.id]: entry } })),
  peek: (id) => get().drafts[id],
  discard: (id) =>
    set((s) => {
      if (!(id in s.drafts)) return s;
      const next = { ...s.drafts };
      delete next[id];
      return { drafts: next };
    }),
  restoreRequestId: null,
  requestRestore: (id) => set({ restoreRequestId: id }),
  clearRestoreRequest: () => set({ restoreRequestId: null }),
}));

/** Stable-ish id for a specific in-progress record under a form key. */
function draftId(key: string, editing: unknown): string {
  if (editing == null) return `${key}:new`;
  try {
    return `${key}:edit:${JSON.stringify(editing)}`;
  } catch {
    return `${key}:edit:${String(editing)}`;
  }
}

interface UseFormDraftOptions<T> {
  form: FormInstance;
  open: boolean;
  setOpen: (open: boolean) => void;
  editing?: T | null;
  setEditing?: (editing: T | null) => void;
  /** Extra non-form state to stash alongside values (e.g. a commodity segment). */
  extra?: () => Record<string, unknown>;
  /** Called after values are restored — rebuild any derived local state here. */
  onRestore?: (values: Record<string, unknown>, extra: Record<string, unknown> | undefined) => void;
  /** Override the dock's route/label for this key when it isn't a fixed constant (e.g. keyed by table name or record id). */
  meta?: () => { route: string; label: string };
}

/**
 * Attach draft-resume behaviour to a capture drawer.
 *
 * - Restore is opt-in: only fires when the pin chip's `requestRestore(id)`
 *   targets a draft under this hook's `key` (checked via a reactive store
 *   subscription, not just on mount — the pin can be clicked while already on
 *   the owning page). The draft is consumed (discarded) the instant it's
 *   applied, which also makes this naturally safe against React StrictMode's
 *   dev-only double effect-invoke on mount: the second invocation finds
 *   nothing left to apply.
 * - On unmount: stash the current values only if this drawer is currently
 *   open. If it's closed, leave the store alone — a dormant, not-yet-resumed
 *   draft for this key must survive the page unmounting/remounting (e.g. the
 *   user opening a different existing record) until the user acts on its pin.
 *
 * Keys must be globally unique across the app (e.g. 'org-books', 'trade-leg').
 */
export function useFormDraft<T = unknown>(key: string, opts: UseFormDraftOptions<T>) {
  const live = useRef(opts);
  useEffect(() => { live.current = opts; });
  const restoreRequestId = useDraftStore((s) => s.restoreRequestId);
  const isMine = restoreRequestId !== null && restoreRequestId.startsWith(`${key}:`);

  useEffect(() => {
    if (!isMine || restoreRequestId === null) return;
    const draft = useDraftStore.getState().peek(restoreRequestId);
    if (draft) {
      useDraftStore.getState().discard(restoreRequestId);
      useDraftStore.getState().clearRestoreRequest();
      live.current.setEditing?.(draft.editing as T | null);
      // Reset first — the form may currently hold values from whatever the
      // user looked at in between (e.g. a different existing record opened
      // and cancelled), which setFieldsValue alone would leave bleeding
      // through on any field the stashed snapshot didn't touch.
      live.current.form.resetFields();
      live.current.form.setFieldsValue(draft.values);
      live.current.onRestore?.(draft.values, draft.extra);
      live.current.setOpen(true);
      message.info('Draft restored — continuing where you left off');
    }
  }, [key, restoreRequestId, isMine]);

  useEffect(() => {
    return () => {
      // NOTE: no isFieldsTouched() here — antd unregisters fields (child
      // cleanups run first) so touched flags are already gone by the time the
      // page unmounts. An open drawer at navigation time is itself the signal.
      // getFieldsValue(true) still returns everything: values survive
      // unregistration because antd preserves the store.
      const cur = live.current;
      if (cur.open) {
        const meta = cur.meta?.();
        useDraftStore.getState().stash({
          id: draftId(key, cur.editing ?? null),
          key,
          values: cur.form.getFieldsValue(true) as Record<string, unknown>,
          editing: cur.editing ?? null,
          extra: cur.extra?.(),
          route: meta?.route,
          label: meta?.label,
        });
      }
    };
    // mount/unmount lifecycle only — all state is read through live.current
  }, [key]);
}

/**
 * Child-drawer variant for form components that receive `open`/`editing` as
 * props (BookFormDrawer, GuaranteeFormDrawer): the parent
 * page restores open/editing via `useDraftState`, while the child — which
 * owns the FormInstance — stashes and restores the values.
 *
 * `key` must be the parent's key + `-v` (e.g. 'org-desks-v' for parent
 * 'org-desks') — the pin's restore request targets the *parent's* id, and
 * this hook derives its own matching id by swapping in its own key.
 *
 * Returns a ref the child's own `[open, editing]` reset-effect must check.
 * That effect fires more times than it looks like it should around a
 * restore: StrictMode's dev-only double-invoke runs it twice back-to-back
 * while `open` is still stale (the parent's `setOpen(true)` from the same
 * restore hasn't committed yet), then a *third*, genuine time once `open`
 * actually flips true. All three must skip the reset — but the flag can only
 * be safely cleared on that third, `open === true` occurrence; clearing it
 * on the first (e.g. via a timer) leaves the real one unprotected and it
 * wipes the just-restored values. Use exactly this shape:
 * `if (skipDraftReset.current) { if (open) skipDraftReset.current = false; return; }`
 */
export function useDraftValues(key: string, form: FormInstance, open: boolean, editing?: unknown) {
  const skipResetRef = useRef(false);
  const liveOpen = useRef(open);
  useEffect(() => { liveOpen.current = open; });
  const liveEditing = useRef(editing);
  useEffect(() => { liveEditing.current = editing; });

  const parentKey = key.endsWith('-v') ? key.slice(0, -2) : key;
  const restoreRequestId = useDraftStore((s) => s.restoreRequestId);
  const parentPrefix = `${parentKey}:`;
  const suffix = restoreRequestId !== null && restoreRequestId.startsWith(parentPrefix)
    ? restoreRequestId.slice(parentPrefix.length)
    : null;

  useEffect(() => {
    if (suffix === null) return;
    const myId = `${key}:${suffix}`;
    const draft = useDraftStore.getState().peek(myId);
    if (draft) {
      useDraftStore.getState().discard(myId);
      skipResetRef.current = true;
      form.resetFields();
      form.setFieldsValue(draft.values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, suffix]);

  useEffect(() => {
    return () => {
      if (liveOpen.current) {
        useDraftStore.getState().stash({
          id: draftId(key, liveEditing.current ?? null),
          key,
          values: form.getFieldsValue(true) as Record<string, unknown>,
          editing: null,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return skipResetRef;
}

/**
 * Parent-page counterpart of useDraftValues: restores/stashes only the
 * open/editing state (the child drawer owns the form values).
 */
export function useDraftState<T = unknown>(key: string, opts: {
  open: boolean;
  setOpen: (open: boolean) => void;
  editing: T | null;
  setEditing: (editing: T | null) => void;
}) {
  const live = useRef(opts);
  useEffect(() => { live.current = opts; });
  const restoreRequestId = useDraftStore((s) => s.restoreRequestId);
  const isMine = restoreRequestId !== null && restoreRequestId.startsWith(`${key}:`);

  useEffect(() => {
    if (!isMine || restoreRequestId === null) return;
    const draft = useDraftStore.getState().peek(restoreRequestId);
    if (draft) {
      useDraftStore.getState().discard(restoreRequestId);
      useDraftStore.getState().clearRestoreRequest();
      live.current.setEditing(draft.editing as T | null);
      live.current.setOpen(true);
      message.info('Draft restored — continuing where you left off');
    }
  }, [key, restoreRequestId, isMine]);

  useEffect(() => {
    return () => {
      if (live.current.open) {
        useDraftStore.getState().stash({
          id: draftId(key, live.current.editing ?? null),
          key,
          values: {},
          editing: live.current.editing ?? null,
        });
      }
    };
  }, [key]);
}

/**
 * Page-level variant for routed capture forms with no drawer open/close
 * concept (e.g. `CounterpartyFormPage` at `/tier1/counterparty/:id`). There's
 * no drawer to gate on, so the page must track its own `active` flag —
 * true while the user is still mid-edit, set to `false` right before
 * navigating away via an explicit Cancel or a successful Save (mirroring a
 * drawer's `setOpen(false)`) so that deliberately leaving doesn't also leave
 * a pin behind; only navigating away *without* one of those (e.g. clicking a
 * sidebar link mid-edit) stashes. `recordId` is the route's record id (or
 * `null`/`'new'`) and distinguishes drafts for different records the same
 * way `editing` does for drawers.
 *
 * Because the page likely also has its own effect(s) that populate the form
 * from freshly-fetched server data (keyed on a React Query result rather
 * than `editing`), those effects can fire *after* a restore and clobber it —
 * the fetch is async and may resolve on a later render than the restore.
 * Returns two independent refs (the query effects here don't reliably run in
 * the same commit) that those effects must each check once and skip: one for
 * the core form fields, one for any extra non-form local state.
 */
export function usePageFormDraft(key: string, opts: {
  form: FormInstance;
  recordId: number | string | null;
  /**
   * Ref (not a snapshotted boolean — mutating a plain prop wouldn't be seen
   * at unmount time without a re-render in between) the caller flips to
   * `false` right before navigating away via an explicit Cancel or a
   * successful Save, so that deliberately leaving doesn't also leave a pin
   * behind. Defaults to always-active if omitted.
   */
  activeRef?: { current: boolean };
  extra?: () => Record<string, unknown>;
  onRestore?: (values: Record<string, unknown>, extra: Record<string, unknown> | undefined) => void;
  meta: () => { route: string; label: string };
}) {
  const live = useRef(opts);
  useEffect(() => { live.current = opts; });
  const skipFormSyncRef = useRef(false);
  const skipExtraSyncRef = useRef(false);
  const restoreRequestId = useDraftStore((s) => s.restoreRequestId);
  const isMine = restoreRequestId !== null && restoreRequestId.startsWith(`${key}:`);

  useEffect(() => {
    if (!isMine || restoreRequestId === null) return;
    const draft = useDraftStore.getState().peek(restoreRequestId);
    if (draft) {
      useDraftStore.getState().discard(restoreRequestId);
      useDraftStore.getState().clearRestoreRequest();
      skipFormSyncRef.current = true;
      skipExtraSyncRef.current = true;
      live.current.form.resetFields();
      live.current.form.setFieldsValue(draft.values);
      live.current.onRestore?.(draft.values, draft.extra);
      message.info('Draft restored — continuing where you left off');
    }
  }, [key, restoreRequestId, isMine]);

  useEffect(() => {
    // `activeRef` defaults to active (unlike the drawer variants' `open`,
    // which defaults closed), so the very first render is already
    // "active" before the user has touched anything. That makes this
    // effect's cleanup vulnerable to React StrictMode's dev-only
    // mount→cleanup→mount double-invoke: the phantom cleanup fires
    // synchronously, in the same tick as the initial mount, well before any
    // real navigation could happen. Gate on a timer so only a cleanup that
    // fires *after* the component has genuinely been alive for a tick — a
    // real unmount, always well after 0ms since it requires a user action —
    // stashes a draft; the synchronous StrictMode phantom cleanup is a
    // no-op here.
    let settled = false;
    const timer = setTimeout(() => { settled = true; }, 0);
    return () => {
      clearTimeout(timer);
      if (!settled) return;
      const cur = live.current;
      if (cur.activeRef?.current === false) return;
      const meta = cur.meta();
      useDraftStore.getState().stash({
        id: draftId(key, cur.recordId),
        key,
        values: cur.form.getFieldsValue(true) as Record<string, unknown>,
        editing: cur.recordId,
        extra: cur.extra?.(),
        route: meta.route,
        label: meta.label,
      });
    };
    // mount/unmount lifecycle only — all state is read through live.current
  }, [key]);

  return { skipFormSyncRef, skipExtraSyncRef };
}
