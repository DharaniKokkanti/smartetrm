# 04 — AI Governance & Reliability (Design Principle)

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

## Rule for any future AI-powered feature added to this platform

Before adding any AI/LLM-powered feature (copilot, auto-classification, anomaly detection, natural-language query, etc.), it must have an answer for:
1. What happens when the model is wrong — is there a human-in-the-loop step, and is the output clearly marked as AI-generated to the trader?
2. What is logged — is there an audit trail sufficient for a risk/compliance review to reconstruct why the AI produced that output?
3. Who can see it — does it respect the same desk/book entitlement model as the rest of the platform?

If a proposed AI feature doesn't have answers to these three, it isn't ready to implement, regardless of how good the demo looks.
