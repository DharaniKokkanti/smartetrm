# Pending Project — Metals/Agri price discount-premium framework, and interest_rate orphan linkage

> **Persona for this doc:** You are a senior ETRM systems architect who understands how
> physical commodity contracts actually price off an exchange/PRA reference (LME cash
> settlement, Platts/Argus assessments) via location, grade, and quality adjustments —
> apply that grounding here, not just schema mechanics.

**Status: FLAGGED, NOT IMPLEMENTED.** This is a research + gap-flagging pass only
(2026-07-26), triggered by Dharani asking (a) where `market_product_link` lives in the
GUI, (b) whether a discount concept is needed for metals/agri, and (c) what
`interest_rate` is actually used for. No schema/code changes were made — per
[[project_research_before_schema]]-style precedent, this gets written up and reviewed
before any table is built.

## 1. Where `market_product_link` lives in the GUI (context, not a gap)

Two entry points into the same underlying record, confirmed live in the code:
- **Product → "Markets" tab** (`ProductsPage.tsx`, `MarketsTab` component): lists every
  market this product is listed on, with ticker/lot size/LTD offset; "Link Market"
  button adds a new row.
- **Market → "Market Products" tab** (`MarketsPage.tsx`): the mirror view, per market,
  showing every product listed there plus its own sub-tabs (Price Sources, Market
  Specs — the latter is the fullest read view: currency/UoM/lot size/settlement
  overrides, min/max quantity, notice/LTD offsets).

Both write to the same `market_product_link` row either way — confirmed by the
in-app hint text in `MarketsTab`.

## 2. Discount/premium functionality — gap confirmed, metals specifically missing

**Research finding (LME, industry-standard framing):** physical metal contracts price
as *reference price ± premium/discount*, where the adjustment is driven by:
- **Grade/quality** — impurity content, deviation from the LME-standard grade/shape.
- **Location** — regional delivery premium (e.g. Rotterdam vs. Baltimore vs. Busan),
  often itself a separately-traded/PRA-published benchmark, not a fixed number.
- **Delivery terms** — CIF/FOB/warehouse-specific handling.

Source: [The role of premiums and discounts in pricing of industrial metals
contracts](https://www.lme.com/education/online-resources/lme-digest/the-role-of-premiums-and-discounts-in-pricing-of-industrial-metals-contracts),
[How are LME prices referenced in physical contracts](https://www.lme.com/education/online-resources/lme-digest/how-are-the-lme-prices-referenced-in-physical-contracts).

**Current schema state (verified):**

| Table | Commodity | Shape |
|---|---|---|
| `dbo.agri_moisture_discount_scale` (V96) | Agri only | `grade_standard_id` + a moisture-band → `price_discount_per_uom` (currency + UoM scoped). Real, live-registered in `master_data_table_registry` ("Agri Moisture Discount Scales"). |
| *(none)* | Metals | **No table at all.** No grade/location/quality premium-discount mechanism exists for metals despite this being the dominant LME pricing pattern. |

**Why agri's shape doesn't just extend to metals as-is:** agri's discount is a single
axis (moisture %, banded). Metals premiums are typically **two axes that can combine**
(grade deviation *and* delivery location), and location premiums are often themselves
a *quoted, time-varying* market price (a PRA/broker-published regional premium), not a
static per-grade table lookup the way agri moisture is. A metals discount/premium
design needs to decide, before any table is built:
1. Is location premium a **fixed scale** (like agri moisture) or a **linked price
   index** (reusing `product_price_index`/`market_product_source` — i.e. the regional
   premium is itself a tradeable/published series)?
2. Does grade deviation apply per-`grade_standard_id` (reusing the existing
   `commodity_grade_standard` infrastructure from V67/V69, same as agri) or does it
   need its own metals-specific parameter set (impurity ppm bands, not moisture %)?
3. Scope: product-level default vs. trade-level negotiated override (mirrors the
   `product` → `market_product_link` → `trade` settlement-type layering already in the
   schema) — premiums are very commonly negotiated per-deal in practice, so a
   trade-level override point is likely required, not just master data.

**Recommendation:** don't generalize `agri_moisture_discount_scale` into a fake
"universal discount table" — the two commodity groups' discount mechanics are
structurally different (banded scale vs. linked index, single-axis vs. two-axis).
Model metals premium/discount as its own table once the three questions above are
answered with Dharani, reusing `commodity_grade_standard` and
`product_price_index`/`market_product_source` where the shape actually matches,
rather than inventing new generic infrastructure.

## 3. `interest_rate` / `interest_rate_index` — confirmed orphan, exactly as suspected

Dharani's guess was correct: **this master data was added and never linked to
anything.**

- `dbo.interest_rate_index` (V05) — 12 rows seeded (SOFR, EURIBOR_3M, SONIA, FEDFUNDS,
  etc.), full RFR-transition modeling (`is_rfrr`, `replaces_index_id`), day-count/
  compounding conventions. **Registered and enabled** in
  `master_data_table_registry` (Static Data → Pricing & Rates → "Interest Rate
  Indices"), so it's visibly editable in the GUI today.
- `dbo.interest_rate` (daily fixing values per index) and `dbo.rate_fixing` (official
  settlement fixings) exist alongside it — **schema only**. `interest_rate`'s
  `master_data_table_registry` row is deliberately `is_enabled=0` with the comment
  *"schema-only, no backend CRUD yet... exists only so governance sweeps can query by
  data_category"* (added in the 2026-07-21 whole-schema sweep, V143).
- **Grep-confirmed zero references** anywhere in `etrm-backend/src/main/java` or
  `etrm-frontend/src` to `interest_rate_index`, `InterestRateIndex`, or
  `interestRateIndex` outside the master-data CRUD scaffolding itself. No trade,
  financing, discounting/NPV, or late-payment-interest code path reads it.

**What it's *for*, per its own SQL header comment (V05):** "financing cost
calculations, late payment interest, credit exposure discounting" — i.e. this was
seeded ahead of three features that don't exist yet:
1. **Late-payment interest** on overdue invoices/settlements (references
   `payment_term`/`invoice` domain — V22).
2. **Financing cost** on inventory/storage carry or margin financing (references
   `storage_facility`/credit domain).
3. **Credit exposure discounting** (PV of future exposure — references whatever
   credit-risk engine eventually gets built).

None of those consuming features exist yet, so the index master data has nothing to
attach to — it's correctly schema-present and correctly not orphaned-looking in the
GUI (Static Data page renders fine, looks like real functioning master data), but is
functionally inert. Flagging here so it doesn't get mistaken for "already wired"
in a future audit.

**Recommendation:** leave as-is (no code to write today — there's no consuming
feature to link it to). Revisit when/if late-payment interest, financing cost, or
credit-exposure discounting gets designed; at that point `interest_rate_index` +
`interest_rate` are already in good shape to plug into whichever gets built first.
