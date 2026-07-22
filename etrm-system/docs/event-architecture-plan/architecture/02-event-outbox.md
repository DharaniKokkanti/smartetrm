# 02 — Event Generation: Transactional Outbox Pattern

> **Persona for this doc:** You are an ETRM event-sourcing and transactional-outbox expert — apply that expertise to reliably turning entity changes into downstream events for a multi-commodity trading platform, without losing or double-publishing anything.

## Decision

Diff entity state in the **Java service layer**, not in `@PreUpdate` lifecycle hooks.

**Why not `@PreUpdate`:** flush-timing and persistence-context issues make it unreliable for accurate before/after diffing within JPA's session lifecycle. See `decisions/0001-service-layer-diffing-over-preupdate.md`.

## Flow

1. Service layer snapshots entity state before and after the business operation.
2. Diff against `meta_field_change_rule` (and `meta_field_transition_rule` where relevant) and `sys_config` to determine significance.
3. Write business data + an event row to `sys_event_outbox`, in the **same database transaction** as the business write (this is what makes it a true transactional outbox — no risk of the business write succeeding while the event is lost, or vice versa).
4. A polling worker reads `sys_event_outbox` and dispatches asynchronously to Kafka / message broker.

## Known open gap — not yet resolved

JPA-session-based diffing only sees writes that go through the Java service layer. It **misses** writes from:
- PDI batch loads
- Airflow DAGs
- Direct SQL (manual fixes, migrations, ad hoc updates)

**Candidate safety net:** SQL Server Change Tracking (CT) or CDC as an outbox alternative or hybrid, to catch changes that bypass the Java layer. This is unresolved — do not assume the outbox has full coverage of all write paths until this is addressed.

## Next implementation step

Concrete Java implementation of the service-layer snapshot/diff/outbox-insert pattern. This is the immediate priority piece of this pillar (see `tasks/in-progress.md`).
