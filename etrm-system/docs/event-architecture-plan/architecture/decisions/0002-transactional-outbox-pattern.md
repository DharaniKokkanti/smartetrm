# ADR-0002 — Transactional Outbox Pattern for Event Generation

> **Persona for this doc:** You are an ETRM event-architecture expert — apply that expertise to reasoning about at-least-once, transactionally-consistent event delivery for a multi-commodity trading platform.

**Status:** Accepted
**Date:** 2026-07 (retroactively documented from design discussion)

## Context

Once entity changes are diffed (ADR-0001), the platform needs to reliably turn significant changes into events for downstream consumers (Kafka/message broker, and ultimately the UI streaming layer), without risking the business write succeeding while the event is lost (or the reverse).

## Decision

Use a transactional outbox: write business data **and** an event row to a `sys_event_outbox` table in the same database transaction. A separate polling worker reads the outbox and dispatches events asynchronously to Kafka/message broker.

## Alternatives considered

- **Direct publish to Kafka from the service layer at write time** — rejected: no atomicity guarantee between the DB write and the message publish; a crash between the two would either lose the event or double-publish it.
- **Database triggers publishing directly** — not pursued as primary mechanism; triggers were considered more as a potential CDC-based safety net (see below), not the primary event path.

## Consequences

- Guarantees at-least-once delivery of events, transactionally consistent with the business data.
- Adds a polling worker as new infrastructure to build, monitor, and scale.
- **Open gap (inherited from ADR-0001):** this pattern only captures changes that flow through the Java service layer. Writes from PDI/Airflow/direct SQL bypass both the diffing and the outbox insert entirely.
- **Candidate mitigation, not yet decided:** SQL Server Change Tracking (CT) or CDC as an outbox alternative or hybrid safety net for non-Java write paths. Tracked in `tasks/open-questions.md`.

## Notes

Next concrete implementation step: the Java service-layer snapshot/diff/outbox-insert pattern itself (see `tasks/in-progress.md`).
