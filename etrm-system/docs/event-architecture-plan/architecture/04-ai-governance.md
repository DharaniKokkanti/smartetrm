# 04 — AI Governance & Reliability (Design Principle)

> **Persona for this doc:** You are an ETRM AI-governance and reliability expert — apply that expertise to any AI/LLM-assisted feature proposed for a multi-commodity trading platform, where a wrong or opaque output has real risk/compliance consequences.

Informed by ComTech industry roundtable discussions on ETRM/commodity-trading AI vendor practices. The framing: software vendors treat the concerns below as core, long-solved product requirements (secure interfaces, data governance, reliability engineering) — not novel problems to bolt on after the fact. SmartETRM's architecture should reflect that same maturity from the start.

## Concerns to design against

- Security and data protection
- Data quality
- Hallucination / reliability of AI-generated outputs
- "Black box" transparency
- Implementation and operational cost
- Governance and legal frameworks
- AI talent availability

## How these map onto the existing architecture (working notes — not yet finalized decisions)

| Concern | Where it plugs in |
|---|---|
| Security / data protection | Same mechanism as the WebSocket topic-level authorization gap (`03-streaming-layer.md`, gap #2) |
| Data quality | Hook into `meta_field_change_rule` significance framework for pre-cascade validation |
| Hallucination / reliability | If/when AI-assisted features are added (copilot, anomaly detection, auto-classification), embed a confidence score + audit trail directly into the outbox event schema — not as a separate bolt-on log |
| Transparency ("black box") | Prefer explicit, inspectable rule tables (the existing meta-data pattern) over opaque ML models for anything trader-facing or audit-relevant |
| Governance / legal | Maps onto entitlement/access control layered on the event and streaming systems |
| Cost / talent | Organizational/roadmap concern — not an architecture decision, track separately |

## Already built: table-name prefixes as machine-legible governance (2026-08-14)

Most of this doc is still design intent for a not-yet-built event/streaming layer. One piece of the "transparency" row above is real and live today, at the physical-schema level rather than the `meta_field_change_rule` level this doc originally imagined: every table's name now carries a category prefix — `mst_` (system/admin-controlled master data), `ref_` (business-user-managed reference data), `tran_` (real business-event transaction data), `usr_` (system users/security/admin infrastructure, not yet executed). Full definition, criteria, and rollout status: `MASTER_DATA_ARCHITECTURE.md` §8.

**Why this belongs in an AI-governance doc specifically, not just a schema-style doc**: `master_data_table_registry.module_group` already existed as a place to record a table's category — and was found silently wrong for 26 tables the same session this prefix rule was introduced (23 Trade Capture tables, plus `product`/`market`/`legal_entity`, all mistagged into a generic catch-all group, unnoticed until directly audited). A metadata *row* can drift out of sync with reality with nothing forcing it into view. A table's own *name* cannot — every migration file, every ORM annotation, every raw `sys.tables` listing carries it, permanently.

That distinction is exactly what an AI agent with schema access (an MCP server exposing SQL tools, a text-to-SQL feature, any LLM-driven query/reporting assistant) needs to reason safely:
- An agent that sees `tran_trade` vs `ref_counterparty` vs `mst_currency` gets the mutability/governance category for free, from the one thing guaranteed present on every schema listing — no extra join, no chance of trusting a stale registry row, no hallucinated classification.
- That classification can drive real, mechanical safety policy without any per-table reasoning: treat `mst_*` as close to immutable (reference-only, flag any generated `INSERT`/`UPDATE`), treat `tran_*` as the highest-stakes write category (every write is a business event needing an audit trail — prefer append over update, never bulk-modify), treat `ref_*` as normal scoped CRUD.
- This is cheaper and more durable than re-deriving "is this safe to write to?" from a description column on every request, and — unlike a registry row — it can't silently rot without someone noticing, because the name *is* the fact.

Concretely, this is the "explicit, inspectable rule" principle from the transparency row above, applied one layer lower than originally scoped: not a rule *table* an event pipeline consults, but a rule *encoded directly in the identifier* every consumer — human or model — already has to read.

## Rule for any future AI-powered feature added to this platform

Before adding any AI/LLM-powered feature (copilot, auto-classification, anomaly detection, natural-language query, etc.), it must have an answer for:
1. What happens when the model is wrong — is there a human-in-the-loop step, and is the output clearly marked as AI-generated to the trader?
2. What is logged — is there an audit trail sufficient for a risk/compliance review to reconstruct why the AI produced that output?
3. Who can see it — does it respect the same desk/book entitlement model as the rest of the platform?

If a proposed AI feature doesn't have answers to these three, it isn't ready to implement, regardless of how good the demo looks.
