# Playbook — Add a New API Endpoint (Java Service Layer)

## 1. Design questions to answer first

- What entity/entities does this endpoint create/update/delete?
- Does it perform updates that need to go through the standard snapshot/diff/outbox pattern (see `../architecture/02-event-outbox.md`)? If it bypasses the standard entity-update path (e.g. a bulk operation, a custom SQL call), that needs to be deliberate and documented, not incidental.
- What desk/book entitlement does this endpoint need to enforce?

## 2. Implementation

- [ ] Follow existing service-layer conventions for the endpoint (routing, request/response shape, error handling).
- [ ] If the endpoint updates an entity, ensure it goes through the standard snapshot-before / snapshot-after / diff-against-`meta_field_change_rule` / outbox-insert pattern — do not write a parallel update path that skips this unless there's a documented, deliberate reason (and if so, log the coverage gap in `../tasks/open-questions.md`).
- [ ] Add entitlement/access control checks consistent with existing patterns.

## 3. Validation

- [ ] Follow `add-new-validation.md` for any new field-level or business-rule validation this endpoint introduces.

## 4. Metadata / streaming implications

- [ ] If this endpoint's changes should be visible live in the UI, confirm the relevant `sys_stream_registry` entries exist and are correctly scoped (field-level, not whole-table — see `../architecture/03-streaming-layer.md`).

## 5. Tests

- [ ] Unit tests for the endpoint logic.
- [ ] Integration test confirming the outbox event fires correctly (and only when the change is significant).
- [ ] Entitlement test — confirm access is correctly denied/allowed by desk/book.

## 6. Documentation

- [ ] Update `../tasks/` per the standard flow.
