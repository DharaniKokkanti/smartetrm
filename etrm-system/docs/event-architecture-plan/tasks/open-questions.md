# Open Questions

> **Persona for this doc:** You are an ETRM platform architect expert tracking unresolved design gaps for a multi-commodity trading platform build.

Unresolved design gaps and concerns. Every "open gap" flagged in `../architecture/` should have a matching entry here so it doesn't get lost. Resolve by updating the relevant architecture doc and/or writing an ADR, then move the entry to a "Resolved" section at the bottom (keep it, marked resolved, don't delete).

## Unresolved

### 1. Outbox coverage gap for non-Java write paths
JPA-session-based diffing (ADR-0001) only sees writes through the Java service layer. Direct SQL writes (and any future external batch/ETL process) bypass diffing and the outbox insert entirely. Candidate mitigation: SQL Server CT/CDC as an outbox alternative or hybrid safety net. **Not yet decided.**
Related: `../architecture/02-event-outbox.md`

### 2. Streaming: field-level vs. whole-table triggering
Triggering should be field-level via `meta_field_change_rule` significance, not whole-table, to avoid noise. **Not yet implemented.**
Related: `../architecture/03-streaming-layer.md`

### 3. Streaming: no topic-level authorization
No desk/book access control on WebSocket subscriptions yet. **Not yet implemented.**
Related: `../architecture/03-streaming-layer.md`

### 4. Streaming: payload contract undefined
Full row vs. delta payload per `render_strategy` isn't defined. Likely needs a `payload_strategy` column on `sys_stream_registry`. **Not yet decided.**
Related: `../architecture/03-streaming-layer.md`

### 5. Streaming: no batching/debounce/backpressure story
Rapid cascading updates (e.g. large batch recalculations) have no defined handling strategy yet. **Not yet decided.**
Related: `../architecture/03-streaming-layer.md`

### 6. Streaming: no reconnect/catch-up strategy
On reconnect, clients need a REST snapshot fetch before resuming the WebSocket stream. **Not yet designed.**
Related: `../architecture/03-streaming-layer.md`

## Resolved

(Nothing resolved yet.)
