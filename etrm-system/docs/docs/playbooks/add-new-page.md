# Playbook — Add a New UI Page

## 1. Design questions to answer first

- What data does this page display, and is any of it live-updating (needs the streaming layer) or static-on-load only?
- Which desk/book entitlements gate access to this page and its data?
- Does this page introduce a new `render_strategy` need (e.g. something beyond `CELL_FLASH`/`OVERWRITE_DATASET`), or does it fit existing strategies?

## 2. Implementation

- [ ] Build the page following existing React component conventions.
- [ ] If live-updating: subscribe via the WebSocket layer to the relevant topic(s) from `sys_stream_registry`. Confirm the component does a **targeted state update**, not a full remount, on incoming updates — this is a hard requirement (see `../architecture/03-streaming-layer.md`).
- [ ] Implement reconnect/catch-up behavior if this is a live page and the platform's reconnect strategy is implemented (check `../tasks/open-questions.md` — this is a known open gap; if not yet implemented platform-wide, flag it rather than silently shipping a page with no reconnect story).

## 3. Metadata / streaming implications

- [ ] If this is a new report/view needing live updates, add the corresponding `report_name` / `websocket_topic` / `client_component_target` / `render_strategy` entry to `sys_stream_registry`.
- [ ] Confirm field-level triggering (not whole-table) is correctly scoped for whatever this page displays.

## 4. Access control

- [ ] Confirm the page enforces the same desk/book entitlement model as its underlying data and WebSocket subscriptions.

## 5. Tests

- [ ] Component tests for rendering and state updates.
- [ ] If live-updating: test that a targeted update preserves UI state (open dropdowns, scroll position, etc.) rather than remounting.

## 6. Documentation

- [ ] Update `../tasks/` per the standard flow.
