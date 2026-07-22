# SmartETRM Platform — Architecture Context for Claude Code

> **Persona for this file and this platform, always:** You are a senior ETRM (Energy/Commodity Trading and Risk Management) systems architect and full-stack developer, expert in designing and implementing multi-commodity enterprise trading platforms end to end — trade capture, deal lifecycle, credit & risk, master data governance, settlements, logistics, and the event/streaming architecture below. Bring that domain expertise to every file in this repo, not just this one.
>
> This file is manually synced from Claude.ai chat memory. Dharani reviews and updates it after design sessions, then commits/pushes from VS Code. Claude Code should treat this as authoritative background for the new ETRM platform build.
>
> **This describes a planned architecture layer — none of it is built yet.** No `meta_*` table or `sys_event_outbox`/`sys_stream_registry` exists in the real schema (confirmed as of migration V151, 2026-07-21). For what's actually built and running today, see [`etrm-system/docs/ETRM_Project_Handoff_v1_0.md`](etrm-system/docs/ETRM_Project_Handoff_v1_0.md) — the real source of truth for the current codebase. This file is the quick single-file version of the plan below; the fuller structured version (architecture write-ups, ADRs, playbooks, task tracking) lives at [`etrm-system/docs/event-architecture-plan/`](etrm-system/docs/event-architecture-plan/) — keep both in sync when either changes.

## 1. Meta-Data Table System (Event Architecture Foundation)

Core registry tables driving cascade logic and change significance across the platform:

- **`meta_table_registry`** — table_category / data_domain / source_type / mutability
- **`meta_table_dependency`** — dependency DAG for cascade recalculations across tables
- **`meta_field_change_rule`** — column-level change significance and cascade actions (drives what counts as a "significant" change worth propagating)
- **`meta_field_transition_rule`** — from-value/to-value specific overrides (e.g. status transitions that need special handling beyond generic field-change rules)

## 2. Event Generation on UPDATE — Transactional Outbox Pattern

**Decision:** Diff entity state in the **Java service layer** (not `@PreUpdate` — has flush-timing / persistence-context issues that make diffing unreliable).

**Flow:**
1. Service layer snapshots entity state before/after against `meta_field_change_rule` / `sys_config`.
2. Write business data + an event row to a `sys_event_outbox` table, in the **same DB transaction**.
3. A polling worker dispatches outbox events asynchronously to Kafka / message broker.

**Open concern (unresolved):** JPA-session-based diffing misses writes from direct SQL that bypass the Java layer entirely. A CDC-based approach (SQL Server Change Tracking / CDC) as an outbox alternative or hybrid safety net may be needed to catch these.

**Next step to return to:** Concrete Java implementation of the service-layer snapshot/diff/outbox-insert pattern.

## 3. UI Live-Streaming Layer (extends the meta-data architecture)

**`sys_stream_registry`** table: report_name, triggering_table_name, websocket_topic, client_component_target, render_strategy (e.g. `CELL_FLASH`, `OVERWRITE_DATASET`).

**Flow:** Calculation engine updates a derived table → outbox worker checks `sys_stream_registry` → Java WebSocket service pushes to the matched topic → React components do **targeted state updates** (not full remount), preserving trader UI state (open dropdowns, cursor position, layout).

**Open gaps flagged, to resolve before implementation:**
1. Triggering should be **field-level** via `meta_field_change_rule` significance, not whole-table — avoids noise on trivial changes.
2. **No topic-level authorization/entitlement check yet** — need desk/book access control on WebSocket subscriptions.
3. **Payload contract undefined per render_strategy** (full row vs. delta) — needs a `payload_strategy` column.
4. **No batching/debounce/backpressure story** for rapid cascading updates.
5. **No reconnect/missed-message catch-up strategy** — needs REST snapshot fetch + resume streaming on reconnect.

## 4. AI Governance & Reliability — Design Principle

Informed by ComTech industry roundtables on ETRM/commodity-trading AI vendor practices. Industry concerns to design against, treated as **core product requirements baked into architecture from day one**, not bolted on later:

- Security / data protection
- Data quality
- Hallucination / reliability of AI-generated outputs
- "Black box" transparency
- Implementation / operational cost
- Governance / legal frameworks
- AI talent availability

**Framing:** Software vendors treat these as long-solved product requirements (secure interfaces, data governance, reliability engineering) rather than novel problems. The new ETRM's architecture should reflect that maturity natively.

**Possible integration points into existing design (not yet decided, for discussion):**
- Security/entitlement → same mechanism as the WebSocket topic-level authorization gap above.
- Data quality → hook into `meta_field_change_rule` significance framework for pre-cascade validation.
- Hallucination/reliability → if AI/LLM features are added (copilot, anomaly detection, auto-classification), embed a confidence/audit trail into the outbox event schema itself.
- Transparency → favor explicit rule tables (already the pattern here) over opaque ML models for anything trader-facing or auditable.
- Governance/legal → maps to entitlement/access control layered onto the event and streaming systems.
- Cost/talent → organizational/roadmap concern, not architecture.

## 5. Misc Debugging Notes (carry over, may still be relevant to platform build)

- **SQL Server Msg 3930** ("current transaction cannot be committed...") on `INSERT INTO #temp EXEC some_proc`: first check for a column name/order/type mismatch between the target temp table and the SELECT(s) inside the called proc — check **all branches**, not just the one being tested. Don't jump to transaction/XACT_ABORT/tempdb theories first.

---
*Last synced from Claude.ai chat memory: 2026-07-21. Update this file after design review sessions and push manually from VS Code.*
