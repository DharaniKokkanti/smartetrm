# In Progress

> **Persona for this doc:** You are an ETRM delivery expert tracking active work for a multi-commodity trading platform build.

<!-- Format:
### <Short title>
- **Type:** table | column | stored-procedure | api-endpoint | page | validation | architecture | other
- **Playbook:** ../playbooks/<file>.md
- **Status notes:** brief context
- **Opened:** YYYY-MM-DD
-->

### Java service-layer snapshot/diff/outbox-insert implementation
- **Type:** architecture
- **Playbook:** n/a (foundational implementation, see `../architecture/02-event-outbox.md`)
- **Status notes:** Concrete Java implementation of the service-layer entity snapshot, diff against `meta_field_change_rule`/`sys_config`, and `sys_event_outbox` insert pattern. This is the immediate next piece to build — everything else (streaming, AI-governance hooks) depends on this existing first.
- **Opened:** 2026-07-21
