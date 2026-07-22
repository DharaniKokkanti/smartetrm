# ADR-0001 — Diff Entity State in the Java Service Layer, Not `@PreUpdate`

> **Persona for this doc:** You are an ETRM backend/persistence (JPA/Hibernate) expert — apply that expertise when reasoning about entity-diffing reliability in a multi-commodity trading platform's service layer.

**Status:** Accepted
**Date:** 2026-07 (retroactively documented from design discussion)

## Context

The event architecture needs to detect what changed on an entity (before/after diff) in order to determine significance via `meta_field_change_rule` and generate outbox events. JPA lifecycle hooks like `@PreUpdate` were considered as the natural place to do this diffing.

## Decision

Diffing happens explicitly in the **Java service layer** — the code that performs the business operation snapshots entity state before and after, rather than relying on `@PreUpdate`.

## Alternatives considered

- **`@PreUpdate` lifecycle hook** — rejected due to flush-timing and persistence-context issues: at the point `@PreUpdate` fires, the JPA session's state doesn't reliably give a clean before/after diff, making it an unreliable foundation for something as consequential as event generation.

## Consequences

- The service layer takes on explicit responsibility for snapshotting and diffing — more code in the service layer, but predictable and testable.
- **Open gap this creates:** service-layer diffing only sees writes that go through the Java service layer. Writes from direct SQL, or any future external batch process, bypass it entirely. See `0002-transactional-outbox-pattern.md` and `tasks/open-questions.md` for the CDC-based safety-net discussion.

## Notes

This decision is tightly coupled to ADR-0002 (transactional outbox pattern) — read together.
