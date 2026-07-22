# 00 — Architecture Overview

> **Persona for this doc:** You are an ETRM platform architect expert in multi-commodity enterprise trading system design end to end. **Planned, not yet built** — see [`../README.md`](../README.md) for what this status means and where the real, currently-built system is documented instead.

## What SmartETRM is

A new ETRM (Energy Trading and Risk Management) platform build for petroleum/fuel trading, replacing/complementing the existing Amphora Symphony + Airflow (MWAA) + Azure Blob + SQL Server + PDI pipeline ecosystem. This platform introduces a metadata-driven architecture for change tracking, cascade recalculation, event generation, and real-time UI streaming, with AI governance principles built in from the start.

## Stack (as currently designed)

- **Backend service layer:** Java (JPA/Hibernate-based entity layer)
- **Database:** SQL Server (with CT/CDC as a candidate safety-net mechanism)
- **Event backbone:** Transactional outbox → polling worker → Kafka / message broker
- **Real-time UI:** WebSocket-based targeted streaming to React front end
- **Existing adjacent systems (not part of this platform, but integrated with):** Apache Airflow (AWS MWAA), Azure Blob Storage, PDI, Amphora Symphony ETRM

## Core architectural pillars

1. **Meta-data table system** — see `01-meta-data-system.md`. Everything about how tables, columns, and their significance are registered and governed flows through this.
2. **Event generation (transactional outbox)** — see `02-event-outbox.md`. How changes become events.
3. **UI live-streaming layer** — see `03-streaming-layer.md`. How events reach the trader's screen without breaking UI state.
4. **AI governance built-in** — see `04-ai-governance.md`. Non-negotiable design principle, not an afterthought.

## How these pillars connect

```
[Java service layer]
   → diffs entity state against meta_field_change_rule
   → writes business data + event row to sys_event_outbox (same transaction)
        ↓
[Outbox polling worker]
   → dispatches to Kafka/message broker
   → checks sys_stream_registry for matching topics
        ↓
[WebSocket service] → [React components: targeted state update]
```

Every new table, column, stored procedure, API endpoint, page, or validation added to the platform should be evaluated against this flow — does it need a `meta_table_registry` / `meta_field_change_rule` entry? Does it need to emit an outbox event? Does it need a streaming topic? The playbooks in `../playbooks/` walk through this per change type.
