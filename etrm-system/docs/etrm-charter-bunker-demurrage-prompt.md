# Master Prompt — Time Charter / Bunker / Demurrage Claims Module for ETRM

**Purpose of this document:** Use this as-is with an AI coding agent (Claude Code, etc.) to scaffold or build the module. It also stands alone as a functional/technical spec you can hand to a dev team or refine with stakeholders. Sections marked `[FILL IN]` need your environment-specific detail before use.

---

## 1. Role & Context Setup (for AI agent)

```
You are a senior ETRM (Energy/Commodity Trading and Risk Management) systems architect
and developer. You are building a Freight & Marine Operations module that plugs into an
existing ETRM platform. The ETRM already handles trade capture, deal lifecycle, and
actuals/settlement for physical commodities. This module must be commodity-agnostic
(crude, refined products, LPG/LNG, dry bulk, chemicals, biofuels) and integrate cleanly
with the existing trade/position/P&L engine rather than duplicating it.

Build for correctness first: freight, demurrage, and bunker numbers feed directly into
realized P&L and counterparty invoices, so financial figures must be traceable to a
single source of truth with a full audit trail.
```

---

## 2. Domain Scope

The module owns three functional areas that share a common vessel/voyage backbone:

1. **Time Charter Management** — chartering vessels in/out, hire calculation, off-hire, redelivery.
2. **Bunker Management** — bunker stems, ROB (remaining on board) tracking, consumption, cost allocation to voyages.
3. **Laytime & Demurrage Claims** — Statement of Facts (SOF) capture, laytime calculation, demurrage/despatch, claims and counterclaims workflow.

All three roll up into shared **Position**, **P&L**, and **Invoicing** engines (Section 7–9), which must work identically regardless of commodity type.

---

## 3. Core Data Model (commodity-agnostic backbone)

Instruct the agent to build these as first-class entities, decoupled from commodity-specific fields:

| Entity | Key attributes | Notes |
|---|---|---|
| **Vessel** | IMO number, name, type (tanker/bulker/LNG carrier/barge), flag, DWT/capacity, owner, class | Master data, shared across charters |
| **Voyage** | voyage ID, vessel ref, charter ref, laycan, load/discharge ports, status (planned/in-progress/completed) | The spine that links charter, bunkers, cargo, laytime |
| **Charter Party (CP)** | CP type (voyage/time/COA/spot), CP terms, hire rate, laytime allowed, demurrage/despatch rate, off-hire clauses, bunker clause (delivery/redelivery ROB terms) | Store as structured terms, not free text, so downstream calc engines can consume it |
| **Cargo Parcel** | commodity type, grade, quantity, UOM, load/discharge terminal, linked trade ID(s) in ETRM | **This is the commodity-agnostic join point** — one voyage can carry multiple parcels of different commodities |
| **Bunker Stem** | fuel grade (VLSFO/LSMGO/HSFO/methanol/LNG boil-off etc.), quantity, price, supplier, port, ROB before/after | Linked to voyage; feeds bunker P&L |
| **Statement of Facts (SOF)** | port, event log (NOR tendered, all fast, hoses connected, commenced/completed loading-discharging, etc.), timestamps | Source data for laytime calc |
| **Laytime Calculation** | allowed laytime, used laytime, exceptions (weather, strikes, holidays per CP), demurrage/despatch hours & amount | Derived from SOF + CP terms, versionable (recalculated on SOF correction) |
| **Claim** | claim type (demurrage/despatch/off-hire/deviation), counterparty, amount claimed, supporting docs, status (draft/submitted/disputed/settled), counterclaim ref | Workflow entity |
| **Invoice** | invoice type (hire/bunker/demurrage/freight), counterparty, amount, currency, status (draft/sent/disputed/paid), linked claim/voyage/charter | Feeds AR/AP and GL |

**Instruction to agent:** Model `Cargo Parcel` as the bridge table between this module and the existing ETRM trade/deal entities — do not duplicate commodity master data (grades, UOM conversions, pricing) that already exists in the ETRM; reference it by ID.

---

## 4. Time Charter Management — functional requirements

- Support **charter-in** and **charter-out** (the module is bidirectional: the business may be the disponent owner or the charterer).
- Capture CP terms structurally: hire rate (daily/monthly), currency, hire payment frequency, delivery/redelivery ranges, off-hire clauses (breakdown, dry-docking, deviation), bunker delivery/redelivery clause (e.g., "same quantity ± X%" or "as on delivery").
- **Hire calculation engine**: pro-rata hire per period, automatic off-hire deduction based on logged off-hire events (with reason codes), running hire statement per voyage/charter.
- **Redelivery reconciliation**: compare delivery vs redelivery bunker ROB against CP clause, auto-generate the bunker settlement adjustment (over/under redelivered fuel bought/sold at CP rate).
- Support **extension/option periods** and mid-charter rate resets (index-linked or fixed).
- Full audit trail: every hire statement version must be reproducible from source events.

---

## 5. Bunker Management — functional requirements

- Track ROB per fuel grade per vessel over time (event-sourced: each stem, consumption, or transfer is an immutable ledger entry).
- Support **stem lifecycle**: nomination → confirmation → delivery → invoice matching (quantity/price/quality survey reconciliation, including short-delivery and off-spec claims against bunker suppliers).
- **Consumption allocation**: split consumption by voyage leg (laden/ballast), by main engine vs auxiliary/boiler, so voyage P&L gets accurate bunker cost allocation — not just a flat average.
- Support multiple simultaneous fuel grades per vessel (conventional + biofuel blend + LNG boil-off) for IMO2020/decarbonization compliance tracking.
- Bunker cost must flow into **Voyage P&L** as a distinct cost line, separately reportable from freight/demurrage.

---

## 6. Laytime & Demurrage Claims — functional requirements

- **SOF capture**: structured event log per port call (NOR tendering, laytime commencement per CP notice-time rules, loading/discharging start-stop with reasons, disconnection). Support manual entry and EDI/terminal feed import.
- **Laytime calculation engine**: apply CP-specific rules (reversible/non-reversible laytime, exceptions/exclusions e.g. SHINC/SHEX, weather-working-days, holiday calendars per port) to compute used vs allowed laytime.
- Auto-compute **demurrage** (used > allowed) or **despatch** (used < allowed) at the CP rate; support tiered/escalating demurrage rates if the CP specifies them.
- **Claims workflow**: draft → internal review → submit to counterparty → counterparty response (accept/dispute/counterclaim) → negotiation → settlement → invoice trigger. Track claim aging and provide a claims register/dashboard view.
- Support **recalculation with full versioning** when SOF is corrected post-submission (common in real disputes) — never overwrite, always version.
- Link each claim to supporting documents (SOF, NOR, CP extract) for audit and dispute defense.

---

## 7. Position Keeping

- **Vessel position**: which vessel is on which voyage, current laden/ballast status, ETA, next port — operational, not financial.
- **Cargo position**: quantity on board per parcel/commodity, tied back to the ETRM trade position so physical and paper positions reconcile (this is the critical link: freight ops should never create a "phantom" position disconnected from the trade book).
- **Exposure by commodity**: aggregate open freight/bunker exposure (e.g., unhedged bunker price risk, unfixed freight legs) so risk/P&L teams see it alongside trading positions, not in a silo.

---

## 8. P&L Engine

Design a **voyage P&L** structure that is additive into the overall ETRM P&L, not a parallel system:

| P&L component | Source |
|---|---|
| Freight revenue/cost | Charter rate × cargo/voyage terms |
| Hire cost/revenue | Time charter hire engine (Section 4) |
| Bunker cost | Bunker management (Section 5), allocated by leg |
| Demurrage/despatch | Claims engine (Section 6), realized on settlement (with a separate "accrued/estimated" line pre-settlement) |
| Port costs, agency fees, other voyage costs | Manual/AP-fed cost entries |
| **Net Voyage Result** | Sum of the above, commodity-agnostic |

- Distinguish **estimated/accrued P&L** (before claim settlement, before final bunker invoice) from **realized/actual P&L** (post-settlement) — this mirrors mark-to-market vs realized in the trading book, so reuse that pattern if the ETRM already has it.
- P&L must be sliceable by: vessel, voyage, charter, commodity, counterparty, trader/desk, period.

---

## 9. Invoicing

- Generate invoices for: **hire** (periodic, per charter), **bunker** (per stem, supplier-facing and/or inter-company), **demurrage/despatch** (per settled claim), **freight** (per completed voyage/parcel, if freight is invoiced separately from cargo value).
- Support **three-way match** style validation before invoice issuance (CP terms vs calculated amount vs supporting SOF/stem data) to reduce disputes.
- Track invoice status (draft/sent/disputed/paid) and link back to the originating claim/voyage/charter for full traceability.
- Multi-currency support with FX rate capture at invoice date (for P&L re-translation later).
- Output format should be integration-ready for the existing AR/AP or GL system — **ask what that integration point is before building the invoice output format** (see open questions below).

---

## 10. Cross-cutting / Non-functional Requirements

- **Auditability**: every calculated figure (hire, laytime, demurrage, bunker cost allocation) must be traceable to source events with versioning — no silent overwrites.
- **Commodity-agnostic core, commodity-specific extensions**: keep grade/UOM/quality specs in extensible attributes, not hardcoded fields, so adding LNG or dry bulk later doesn't require schema rewrites.
- **Idempotency**: any data feed (terminal SOF, bunker survey, hire statement) should be safely re-ingestable without duplicating ledger entries (same principle as your existing BOL actuals matching logic — reuse that pattern here if possible).
- **API-first**: expose voyage, charter, bunker, claim, and invoice data via APIs so the module can be consumed by reporting/BI tools and other ETRM modules without direct DB access.

---

## 11. What to ask the AI agent to produce, in order

When you actually run this prompt against an AI coding agent, ask for outputs in this sequence rather than everything at once:

1. Entity-relationship data model (from Section 3) with the extension points called out.
2. API contract (endpoints/schemas) for voyage, charter, bunker, laytime, claims, invoicing.
3. Calculation engine pseudocode for: hire statement, laytime/demurrage, bunker cost allocation, voyage P&L.
4. Workflow/state machine diagrams for: charter lifecycle, claim lifecycle, invoice lifecycle.
5. Integration point stubs into your existing ETRM trade/position/P&L tables.

---

## 12. Open questions to resolve before or during the build [FILL IN]

- What's the ETRM's existing trade/deal schema — is there already a "physical parcel" or "shipment" entity this should join to (sounds like there may be, based on your BOL/actuals work)?
- Tech stack for this module — same Airflow/Azure/REST stack as your USA Day Deal actuals pipeline, or separate?
- Which CP templates are in scope first (e.g., ASBATANKVOY, Shellvoy, Gencon, NYPE) — laytime exception rules differ meaningfully by form.
- Source systems for SOF and bunker survey data — manual entry, terminal EDI, broker feeds, or Q88/IMOS-style vessel data feeds?
- Does realized demurrage/bunker settlement need to write back into the same actuals/GL posting pipeline as your existing trade actuals, or a separate ledger?

---

*Fill in Section 12 with your specifics, then feed Sections 1–11 to the AI agent as the build brief, or hand the whole document to your dev team as the functional spec.*
