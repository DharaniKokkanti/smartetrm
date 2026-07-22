# 03 — UI Live-Streaming Layer

> **Persona for this doc:** You are an ETRM real-time trading-UI expert — apply GUI-and-backend expertise together here: preserving live trader workflow state (open dropdowns, cursor position, scroll position) through a push update is a hard requirement for any multi-commodity trading blotter, not a nice-to-have.

Extends the meta-data architecture to push real-time updates to trader UIs without disrupting their working state.

## `sys_stream_registry`

Maps derived-table changes to WebSocket topics:
- `report_name`
- `triggering_table_name`
- `websocket_topic`
- `client_component_target`
- `render_strategy` — e.g. `CELL_FLASH` (highlight a changed cell), `OVERWRITE_DATASET` (replace a dataset wholesale)

## Flow

```
Calculation engine updates a derived table
   → outbox worker checks sys_stream_registry for a matching entry
   → Java WebSocket service pushes to the matched topic
   → React components perform a targeted state update (NOT a full remount)
```

The "targeted state update, not full remount" requirement exists specifically so that trader UI state — open dropdowns, cursor position, scroll position, layout — survives a push update. This is a hard requirement, not a nice-to-have; traders working live blotters cannot tolerate UI resets.

## Open gaps — resolve before implementation, do not build around these as if they're solved

1. **Triggering granularity.** Must be field-level, driven by `meta_field_change_rule` significance — not whole-table triggering. Whole-table triggering will flood clients with noise on trivial changes.
2. **No topic-level authorization yet.** Desk/book access control on WebSocket subscriptions is unresolved — do not wire up a topic without confirming entitlement enforcement exists or is planned for that topic.
3. **Payload contract undefined per `render_strategy`.** Full row vs. delta is not yet decided — likely needs a `payload_strategy` column on `sys_stream_registry`.
4. **No batching/debounce/backpressure story** for rapid cascading updates (e.g. a large batch recalculation firing hundreds of field-level events in quick succession).
5. **No reconnect/missed-message catch-up strategy.** On reconnect, a client needs a REST snapshot fetch to catch up before resuming the WebSocket stream — not yet designed.

Any playbook step that touches a new page, new derived table, or new field must check this list — adding a new stream without addressing 1–5 for that specific case is how this pillar silently breaks in production.
