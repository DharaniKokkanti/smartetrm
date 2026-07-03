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
 * Solution: when a page unmounts while its capture drawer is open (and the form
 * has been touched), the form values + editing state are stashed here. When the
 * user returns to the page, the drawer reopens exactly where they left off.
 *
 * Deliberately in-memory (not sessionStorage): form values can hold dayjs
 * objects and other non-serialisable instances, and drafts should not outlive
 * the session anyway. Explicitly closing the drawer (Cancel / Save & Close)
 * discards the draft — only *navigating away mid-entry* preserves it.
 */
interface DraftEntry {
  values: Record<string, unknown>;
  editing: unknown;
  extra?: Record<string, unknown>;
}

interface DraftStoreState {
  drafts: Record<string, DraftEntry>;
  stash: (key: string, entry: DraftEntry) => void;
  peek: (key: string) => DraftEntry | undefined;
  discard: (key: string) => void;
}

export const useDraftStore = create<DraftStoreState>((set, get) => ({
  drafts: {},
  stash: (key, entry) => set((s) => ({ drafts: { ...s.drafts, [key]: entry } })),
  peek: (key) => get().drafts[key],
  discard: (key) =>
    set((s) => {
      if (!(key in s.drafts)) return s;
      const next = { ...s.drafts };
      delete next[key];
      return { drafts: next };
    }),
}));

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
}

/**
 * Attach draft-resume behaviour to a capture drawer.
 *
 * - On mount: if a draft exists for `key`, restore values + editing state and
 *   reopen the drawer.
 * - On unmount: if the drawer is open and the form was touched (or was itself
 *   restored from a draft), stash the current values; otherwise discard.
 *
 * Keys must be globally unique across the app (e.g. 'org-books', 'trade-leg').
 */
export function useFormDraft<T = unknown>(key: string, opts: UseFormDraftOptions<T>) {
  const live = useRef(opts);
  useEffect(() => { live.current = opts; });
  // Guards the draft against StrictMode's synchronous mount→cleanup→mount in
  // dev: cleanup runs before the reopened state commits, and must not discard.
  const applyingRef = useRef(false);

  useEffect(() => {
    const draft = useDraftStore.getState().peek(key);
    if (draft) {
      applyingRef.current = true;
      live.current.setEditing?.(draft.editing as T | null);
      live.current.form.setFieldsValue(draft.values);
      live.current.onRestore?.(draft.values, draft.extra);
      live.current.setOpen(true);
      message.info('Draft restored — continuing where you left off');
      setTimeout(() => { applyingRef.current = false; }, 0);
    }
    return () => {
      // NOTE: no isFieldsTouched() here — antd unregisters fields (child
      // cleanups run first) so touched flags are already gone by the time the
      // page unmounts. An open drawer at navigation time is itself the signal.
      // getFieldsValue(true) still returns everything: values survive
      // unregistration because antd preserves the store.
      const cur = live.current;
      if (cur.open) {
        useDraftStore.getState().stash(key, {
          values: cur.form.getFieldsValue(true) as Record<string, unknown>,
          editing: cur.editing ?? null,
          extra: cur.extra?.(),
        });
      } else if (!applyingRef.current) {
        useDraftStore.getState().discard(key);
      }
    };
    // mount/unmount lifecycle only — all state is read through live.current

  }, [key]);
}

/**
 * Child-drawer variant for form components that receive `open`/`editing` as
 * props (DeskFormDrawer, BookFormDrawer, LegalEntityFormDrawer): the parent
 * page restores open/editing via useFormDraft-style state, while the child —
 * which owns the FormInstance — stashes and restores the values.
 *
 * Returns a ref the child's own `[open, editing]` reset-effect must check:
 * when true, skip the reset once (the restored draft must not be wiped).
 */
export function useDraftValues(key: string, form: FormInstance, open: boolean) {
  const skipResetRef = useRef(false);
  const liveOpen = useRef(open);
  useEffect(() => { liveOpen.current = open; });
  const applyingRef = useRef(false);

  useEffect(() => {
    const draft = useDraftStore.getState().peek(key);
    if (draft) {
      applyingRef.current = true;
      skipResetRef.current = true;
      form.setFieldsValue(draft.values);
      setTimeout(() => { applyingRef.current = false; }, 0);
    }
    return () => {
      if (liveOpen.current) {
        useDraftStore.getState().stash(key, { values: form.getFieldsValue(true) as Record<string, unknown>, editing: null });
      } else if (!applyingRef.current) {
        useDraftStore.getState().discard(key);
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
  const applyingRef = useRef(false);

  useEffect(() => {
    const draft = useDraftStore.getState().peek(key);
    if (draft) {
      applyingRef.current = true;
      live.current.setEditing(draft.editing as T | null);
      live.current.setOpen(true);
      message.info('Draft restored — continuing where you left off');
      setTimeout(() => { applyingRef.current = false; }, 0);
    }
    return () => {
      if (live.current.open) {
        useDraftStore.getState().stash(key, { values: {}, editing: live.current.editing ?? null });
      } else if (!applyingRef.current) {
        useDraftStore.getState().discard(key);
      }
    };
     
  }, [key]);
}
