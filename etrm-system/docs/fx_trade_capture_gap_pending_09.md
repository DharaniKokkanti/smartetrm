# Pending Project — FX trade capture: real gap, design review before schema

> **Persona for this doc:** You are a senior ETRM systems architect and full-stack developer who understands how FX deals are captured and settled in a commodity trading house's treasury/back-office flow — apply that grounding, not just schema mechanics, before any table gets written.

**Status: IMPLEMENTED (2026-08-10) — SPOT/FORWARD/NDF live in Trade Capture + Trade Blotter, live-verified end-to-end. SWAP two-leg modeling still deferred per this doc's own recommendation.** Design review (below) was written 2026-08-09; Dharani reviewed and asked to proceed directly ("continue to build screen for fx in trade capture first and then monitor in trade blotter"), making both open design-question calls himself implicitly by not objecting to the recommended defaults — reuse the dealt leg (question 1), defer SWAP (question 2).

**Implementation record (2026-08-10):**
- Both design questions resolved as recommended: `trade_order.quantity`/`currencyId`/`price` reused directly for the dealt leg (quantity = dealt amount, currencyId = dealt currency, price = FX rate) — no duplication. SWAP deferred; only `SPOT`/`FORWARD`/`NDF` implemented (`FX_DEAL_TYPES`).
- **Frontend-only build** (confirmed Trade Capture has no real backend at all — this joins every other commodity type's existing "schema-real, mocks-only" state, not a new inconsistency). `types.ts`: `'FX'` added to `COMMODITY_TYPES_TRADE`; new `FxDetail` interface (`dealType`, `contraCurrencyId`, `contraAmount`, `rateValueType`, `valueDate`, `isNdf`, `fixingDate`, `fixingSource`) attached to `TradeOrder.fxDetail`.
- **Trade Capture** (`TradeBlotter.tsx`, routed at `/trade/capture`): new `FxSection` component follows the exact same per-commodity conditional-section pattern as `OilSection`/`GasSection`/etc. — contra currency/amount/rate-type/value-date/NDF toggle, with `fixingDate`/`fixingSource` conditionally shown only when NDF is on (same `Form.useWatch` pattern used elsewhere in this file). Wired into `openEditOrder`/`submitOrder`'s existing `detailToForm`/`detailFromForm` date-conversion pipeline, same as every other commodity detail object.
- **Trade Blotter** (`TradeBlotterMonitor.tsx`, routed at `/trade/blotter`) needed no structural change — it's a fully generic grid keyed off `commodityType`/`createdSourceSystemCode`, both of which already existed; just added `FX: 'magenta'` to its color map. Confirms the Source-column/manual-vs-API distinction Dharani asked about was already live infrastructure (`SOURCE_SYSTEM_CODES`, V192/V193) — nothing new needed there.
- **New master-data friction point closed**: no currency/count-style UoM existed anywhere (`unit_of_measure` is 100% volume/weight/energy) and `trade_order.uomId` is required. Added a mock-only placeholder `CCY` ("Currency Unit") UoM row — matches this doc's recommendation exactly; no real migration since there's no real backend table to migrate.
- **Shared component fix, not FX-specific**: `SmartGrid.tsx`'s commodity-filter chip list is a *second*, independently-hardcoded `COMMODITY_TYPES` array (separate from `trade/types.ts`'s `COMMODITY_TYPES_TRADE`) — missed `FX` too, fixed alongside.
- **Live-verified**: `npx tsc -b` clean. Full Playwright pass against a throwaway MSW-mock dev instance (not the user's own real-backend-pointed session, since Trade Capture needs mocks): added a real FX trade+leg to the mock seed (buy EUR 1,000,000 / sell USD 1,085,000 outright forward, value date 2026-09-15) — confirmed it renders correctly in both Trade Blotter (commodity tag, source tag) and Trade Capture (FX filter chip, leg grid showing "1,000,000 CCY" / "EUR 1.08", full FX Deal Details form section with all fields correctly populated including resolved "USD — US Dollar" contra-currency label), confirmed the NDF toggle correctly reveals Fixing Date/Fixing Source, and confirmed a save round-trip completes with zero console errors.
- **Real FX-specific data gap found (not fixed — same shape as the FCM-counterparty gap above)**: the leg edit form's Book field showed a raw numeric id ("2") instead of a resolved book code on the test leg. Root cause: `bookOptionsFor(commodityType)` filters books by their `COMMODITY`-dimension classification (or includes unclassified/generalist books) — every one of the 5 mock books is explicitly classified to OIL/GAS/METALS/POWER, **none are generalist and none are classified FX**, so the Book dropdown is genuinely empty for an FX leg and can't resolve a label for whatever id was saved on it. Not a UI bug — a real trading-book master-data gap: **no book exists yet that FX trades can book into**. Needs a decision: classify an existing book (or a new dedicated Treasury/FX book) with `COMMODITY = FX`, mirroring the still-open "tag a counterparty as FCM" ask from the Clearing Account work. Flagged, not fixed.

## What this is

Dharani flagged: no FX trade setup exists anywhere in the platform — "we buy 100 xx and sell 100 xx * rate" is the core economics, needs its own commodity type in Trade Capture, needs master data reviewed, and needs the existing FX-rate-loading setup checked for whether it actually supports FX deals. Deliberately researched generically (industry-standard FX deal capture patterns), not from any named vendor's implementation, per this project's standing rule against citing vendor systems in real schema/GUI/business logic.

## 1. Confirmed: FX is missing everywhere, not just one place

- `dbo.trade.commodity_type` — `CHECK` constraint allows only `OIL/GAS/POWER/METALS/AGRICULTURAL/FREIGHT`. No `FX`.
- `dbo.trade_order.commodity_type` — separately, this column is actually an `INT` FK into `dbo.commodity_type` (a real lookup table), not the same VARCHAR/CHECK shape as `trade.commodity_type` above (a pre-existing inconsistency, not something to fix as part of this). That lookup table's 11 rows (`OIL/GAS/POWER/LNG/AGRICULTURAL/METALS/FREIGHT/RINS/ENVIRONMENTAL/MULTI/OTHER`) also have no `FX`.
- `etrm-frontend/src/features/trade/types.ts`'s `COMMODITY_TYPES_TRADE` const — same gap, frontend side.
- No `trade_fx_detail` table exists (the commodity-specific detail-table pattern every other commodity type already has — `trade_oil_detail`, `trade_gas_detail`, `trade_power_detail`, `trade_metals_detail`, `trade_swap_detail`, `trade_option_detail`, etc.).

Reminder for whoever picks this up: `dbo.trade`/`trade_order`/`trade_item` and every commodity-detail sub-table are **frontend-mocks-only today** — there is no real Java backend controller for Trade Capture at all yet (confirmed via `SecurityConfig.java`'s own comment). Building FX support here means it joins the same "designed, schema-real, not backend-wired" state every other commodity type is already in — not a new inconsistency, just worth knowing going in.

## 2. Real-world FX deal capture — what the economics actually need

Dharani's own framing ("buy 100 xx and sell 100 xx * rate", fixed rate, but with a due/settlement date and other reporting fields) matches the standard industry shape for a **fixed-rate FX deal** (spot or, more likely given "due date," an **outright forward** — a single fixed exchange of two currencies on a future value date, distinct from a swap, which is two linked legs). The universally-standard fields for this, independent of any vendor's specific implementation:

- **Deal type**: SPOT (T+1/T+2 value date) / FORWARD (outright, value date beyond spot) / SWAP (near-leg + far-leg, two linked exchanges) / NDF (non-deliverable forward — cash-settled in one currency against a fixing rate, no physical exchange of the non-deliverable currency).
- **Currency pair**: dealt currency (the currency whose amount is specified — "buy 100 xx") + contra currency (the other side of the pair).
- **Direction**: BUY or SELL, always expressed against the dealt currency (mirrors `trade.direction`'s existing BUY/SELL shape).
- **Dealt amount** and **contra amount** (= dealt amount × rate, stored explicitly rather than always recomputed — rounding and audit trail both need the number that was actually agreed, not a re-derived one).
- **FX rate** + whether it's expressed as an outright rate or as forward points added to a spot rate (this maps directly to `dbo.fx_rate.rate_value_type`'s existing `POINTS`/`OUTRIGHT` distinction — good sign the rate master data already anticipated this).
- **Trade date** vs. **value date / settlement date** — the two are different and both matter for reporting (trade date = when dealt, value date = when currencies actually exchange). Dharani's "due date or settlement date" maps to value date.
- **Counterparty** (the bank/broker on the other side of the deal) + **settlement instructions for both currency legs** — this is where the platform's existing `bank_account`/`SettlementInstruction` polymorphic infrastructure (already built, already used by Counterparty/Legal Entity/Clearing Account) should plug in directly rather than inventing anything new: an FX trade needs one settlement account per currency leg, which the existing SSI model already supports (SSI is keyed by counterparty + currency already).
- **NDF-only fields**: fixing date, fixing source/rate reference, settlement currency (since only one currency actually moves).
- **Confirmation status** — mirrors `trade.status`'s existing DRAFT/CONFIRMED/CANCELLED/AMENDED/MATURED/CLOSED shape; no new enum needed, FX orders reuse the same trade-level status.

## 3. Master data already in place — confirmed, don't rebuild

- **`dbo.currency`** — already has every field an FX pair needs (code, name, decimal places, base-currency flag). Both legs of an FX deal are just two `currency_id` FKs into this existing table. Nothing to add here.
- **`dbo.fx_rate`** (generic Tier2, `is_enabled=1`, live in Static Data today) — already has `from_currency_id`/`to_currency_id`/`rate`/`rate_date`/`rate_type` (`MID`/`FIXING`/`SETTLEMENT`/`INTRADAY`/`EOD`)/`source`/`fx_period_id`/`maturity_date`/`rate_value_type` (`POINTS`/`OUTRIGHT`). **This is a real, already-correctly-designed FX rate/curve master** — it anticipated forward points vs. outright, tenor via `fx_period_id`, and multiple rate types. Confirmed **0 rows today** (never populated) and **no dedicated backend controller** (works via the generic Tier2 CRUD mechanism only — functional, just manual entry, no automated feed) — same maturity level as every other market-data table on this platform, not a special FX gap.
- **`dbo.fx_period`** (generic Tier2, live) — tenor buckets (SPOT/1W/1M/3M/etc. presumably, via `period_code`/`period_type`/`days_offset`) for forward-point lookups against `fx_rate`. Also already correctly shaped for this use case.

**Conclusion on "how are we going to load FX rates": the mechanism already exists and already works** (Static Data → `fx_rate`/`fx_period`, same generic CRUD every other reference table uses) — it just has zero real rows yet. No schema change needed here; this is a data-population task (enter real currency-pair rates) once real currency pairs are known, not a build task. Confirm with Dharani whether an automated rate-feed integration is wanted eventually (out of scope for master data, would be its own integration project).

## 4. Proposed schema — two design questions before writing anything

**Proposed `trade_fx_detail` table** (mirrors the existing `trade_swap_detail`/`trade_option_detail` shape — one row per `trade_order`):

| Column | Type | Notes |
|---|---|---|
| `fx_detail_id` | INT IDENTITY PK | |
| `order_id` | INT FK → `trade_order` | one row per FX order, same pattern as every other detail table |
| `deal_type` | VARCHAR CHECK (`SPOT`/`FORWARD`/`SWAP`/`NDF`) | |
| `contra_currency_id` | INT FK → `currency` | the non-dealt side of the pair |
| `contra_amount` | DECIMAL | dealt amount × rate, stored explicitly |
| `fx_rate` | DECIMAL | |
| `rate_value_type` | VARCHAR CHECK (`OUTRIGHT`/`POINTS`) | mirrors `fx_rate.rate_value_type` |
| `value_date` | DATE | settlement/due date Dharani flagged |
| `is_ndf` | BIT | |
| `fixing_date` | DATE NULL | NDF only |
| `fixing_source` | VARCHAR NULL | NDF only, free text or FK to a rate-source lookup — TBD |
| governance columns | — | row_version + full audit set, per this project's standing rule |

**Question 1 — where does the "dealt" leg live?** `trade_order` already has `quantity`/`currency_id`/`price` (all real, already NOT NULL-appropriate columns). Two options:
  - (a) **Reuse them**: `quantity` = dealt amount, `currency_id` = dealt currency, `price` = FX rate. `trade_fx_detail` only carries the contra side + FX-specific fields (leaner, no duplication).
  - (b) **Duplicate them** into `trade_fx_detail` (its own `dealt_currency_id`/`dealt_amount` columns), leaving `trade_order`'s generic fields unused for FX rows — matches `trade_swap_detail`'s own precedent (it duplicates `notional_quantity`/`fixed_currency_id` rather than reusing `trade_order`'s fields), but means two places an FX amount could theoretically diverge.
  - **Recommendation: (a)**, since `trade_order.quantity`/`price`/`currency_id` map onto the dealt leg's economics exactly with no semantic stretch (unlike physical commodities, an FX "price" genuinely is a rate) — but this is a real judgment call given `trade_swap_detail`'s existing precedent went the other way, so flagging rather than deciding.

**Question 2 — how does SWAP (near + far leg) get modeled?** A few options: two linked `trade_fx_detail` rows (near/far) under the same `trade_order`, two separate `trade_order` rows under one `trade` (mirrors how multi-leg deals elsewhere in this schema are handled — worth checking `trade_item`'s own pattern first), or near/far as parallel column pairs on one row. Needs a decision before the table is finalized — **recommend starting with SPOT/FORWARD/NDF only** (all single-exchange, no ambiguity) and deferring SWAP's two-leg modeling to a follow-up once the simpler shape is confirmed working, rather than solving both at once.

**`trade_order.uom_id` friction**: it's `NOT NULL` today, and there is no currency/count-style UoM in `dbo.unit_of_measure` at all (checked — every row is volume/weight/energy, nothing like "each"/"unit"/"CCY"). FX orders have no physical UoM. Needs either a placeholder UoM row (e.g. `CCY` — "Currency Unit") or making `trade_order.uom_id` nullable generally (bigger blast radius, touches every existing commodity type's NOT NULL assumption) — **recommend the placeholder UoM row**, smallest change, doesn't touch existing rows/logic.

## 5. Trade Capture UI

Once the schema question above is settled: new "FX" tab in `TradeBlotter.tsx`'s commodity-detail section, following the exact same tab pattern already used for Swap/Option/Oil/Gas/Power/Metals detail — dealt/contra currency selects (from the existing `useCurrencies()` hook, already live), rate + rate-type inputs, value-date picker, deal-type select, NDF-conditional fixing fields (same `Form.Item noStyle shouldUpdate` conditional-field pattern already used elsewhere in this codebase, e.g. `CounterpartyFormPage.tsx`'s `parentInd`/`parentCounterpartyId` pair). `COMMODITY_TYPES_TRADE` const gains `'FX'`.

## Next steps when this gets picked up

1. Confirm the two design questions above with Dharani (dealt-leg reuse-vs-duplicate; SWAP two-leg modeling, or defer it).
2. Write the migration: `trade.commodity_type` CHECK gains `FX`, `dbo.commodity_type` lookup gains an `FX` row, new `trade_fx_detail` table, new placeholder UoM row.
3. Frontend: `COMMODITY_TYPES_TRADE` gains `'FX'`, new FX detail tab on `TradeBlotter.tsx`, MSW mock parity.
4. Populate a handful of real currency-pair rows into `fx_rate`/`fx_period` (data-entry task, mechanism already works) so the new tab has real dropdown data to demo against, same convention as every other commodity type's seed data.
5. Out of scope for this pass, flag separately if wanted later: automated FX rate feed integration (currently manual entry only, same as all other market data on this platform).

## Related

- `period_fx_fold_product_link_pending_07.md` — the `fx_period` design history (kept standalone from `dbo.period`, confirmed correct, see that doc's "FX question resolved" note).
- Handoff doc §12 — this gap should be added there once this doc exists (cross-reference, not duplicate detail).
