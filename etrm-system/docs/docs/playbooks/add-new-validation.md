# Playbook — Add a New Field-Level or Business-Rule Validation

## 1. Design questions to answer first

- Is this a simple field-level validation (format, range, required) or a business-rule validation that depends on other fields/entities/state?
- Where should it live — client-side (immediate feedback), service-layer (authoritative, always enforced), or both? Service-layer enforcement is non-negotiable for anything that protects data integrity or risk/compliance correctness; client-side alone is never sufficient for those.
- Does this validation relate to a status/state transition? If so, it may belong alongside the relevant `meta_field_transition_rule` entry rather than as a standalone check.

## 2. Implementation

- [ ] Implement service-layer validation as the authoritative check (always required for data-integrity/compliance-relevant rules).
- [ ] Implement matching client-side validation for UX, if applicable — but never as a substitute for the service-layer check.
- [ ] If tied to a specific field, note it in that field's `meta_field_change_rule` documentation/comments so the rule is discoverable alongside the metadata, not just buried in code.

## 3. AI-governance consideration (per `../architecture/04-ai-governance.md`)

- [ ] If this validation is being proposed to be handled by an AI/LLM-based check rather than a deterministic rule, stop and apply the three-question test from `04-ai-governance.md` (what happens when it's wrong, what's logged, who can see it) before proceeding. Deterministic validation should remain deterministic; don't reach for AI here without a clear reason and those three answers.

## 4. Tests

- [ ] Test the validation fires correctly for both invalid and valid cases, including boundary conditions.
- [ ] Test that service-layer enforcement can't be bypassed by a client that skips the client-side check.

## 5. Documentation

- [ ] Update `../tasks/` per the standard flow.
