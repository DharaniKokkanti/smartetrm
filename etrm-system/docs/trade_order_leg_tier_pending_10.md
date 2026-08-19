# Trade capture: insert a real Order tier above Leg

**Status (2026-08-19): frontend done and verified live (types/api/hooks/mocks/TradeBlotter.tsx — see handoff doc §0). Backend migration (V258) still drafted-only, not applied to a real DB — no `etrm-sqlserver` container was running this session (`docker ps` empty). Next session: `docker ps` first; if a real DB is up, run V258, start the backend, confirm Flyway applies clean.**

## Problem

`tran_trade_order` is named "order" but has always been shaped as a **leg**: one row
per delivery/risk period, with its own `product_id`, `pricing_rule_id`, `quantity`,
`price`, `risk_start_date`/`risk_end_date`. Proof from the seed data itself
(V33): the TTF gas term deal (`trade_id = 3`) has *two* `tran_trade_order` rows —
one for the July delivery window, one for August — each independently priced.
That's two legs. There is no row anywhere holding the **order**-level facts that
produced them: the single quantity the trader actually agreed to, the one
execution date, order-level status. That context doesn't exist today — each
`tran_trade_order` row stands alone, linked to its siblings only by sharing a
`trade_id`.

Correct domain shape (confirmed with Dharani 2026-08-19 — this is about physical
deal-capture semantics, not exchange/OMS execution connectivity, which is out of
scope and not being added here):

```
tran_trade   — commercial contract header (counterparty, trader, book, legal_entity)
  └─ tran_order  — NEW. One negotiated order: order_quantity, order_execution_date,
                    order-level status/reference. What the trader actually agreed.
       └─ tran_leg   — RENAME of tran_trade_order. Per-delivery-period risk leg:
                        period, leg quantity (a slice of order_quantity), price,
                        pricing_rule_id, delivery details. Multiple legs can share
                        one order.
            └─ tran_leg_item — RENAME of tran_trade_item. Sub-line items/tolerance
                                under one leg.
```

Costs/assay/price-adjustment/custom-fields already correctly hang off the leg
(`order_id` FK, unchanged meaning) — V88/V89 got that grain right. This
restructure does not touch their grain, only what the parent above them is
called and the addition of a real order tier above it.

## Full inventory of everything that currently FKs to `tran_trade_order(order_id)`

Confirmed by grep against every migration through V257 — this is the complete
blast radius:

| Table | FK column | Migration | V258 table rename? |
|---|---|---|---|
| `tran_trade_item` | `order_id` (+ denormalized `trade_id`) | V33, V220 | → `tran_leg_item` |
| `tran_trade_order_cost` | `order_id` (+ `trade_id`) | V88, V220 | → `tran_leg_cost`, col → `leg_id` |
| `tran_trade_order_assay_result` | `order_id` (+ `trade_id`) | V88, V220 | → `tran_leg_assay_result`, col → `leg_id` |
| `tran_trade_order_price_adjustment` | `order_id` (+ `trade_id`) | V46, V220 | → `tran_leg_price_adjustment`, col → `leg_id` |
| `tran_trade_order_balmo` | `order_id` (+ `trade_id`) | V41, V220 | → `tran_leg_balmo`, col → `leg_id` |
| `tran_trade_order_tas` | `order_id` (+ `trade_id`) | V39, V220 | → `tran_leg_tas`, col → `leg_id` |
| `tran_trade_order_custom_field_value` | `order_id` (+ `trade_id`) | V89, V220 | → `tran_leg_custom_field_value`, col → `leg_id` |
| `tran_nomination` | `order_id` | V93 (renamed V239) | no — deferred (col only, no table-name confusion) |
| `tran_delivery_instruction` | `order_id` | V93 (renamed V239) | no — deferred |
| `tran_trade_swap_detail` | `order_id` | V44 | no — deferred |
| `tran_trade_option_detail` | `order_id` | V44 | no — deferred |
| `tran_trade_storage_agreement_detail` | `order_id` | V44 | no — deferred |
| `tran_trade_transport_agreement_detail` | `order_id` | V44 | no — deferred |
| `tran_voyage_cargo_parcel` | `trade_order_id` | V108 (renamed V242) | no — deferred |

None of these need to *move* (re-anchor to a different parent) — they all
correctly stay pointed at the leg. 7 of the 14 get renamed in V258 for
terminology (their own table name said "order" when they mean "leg"); the
other 7 keep their current name and `order_id`/`trade_order_id` column since
their own table name never claimed to be order-level in the first place.

Separately known, **not** addressed here: `tran_trade_pricing_schedule` is
`UNIQUE(trade_id)` — one pricing schedule per trade, not per leg, which is its
own bug for multi-leg term deals (flagged in a prior session, still open).
Left alone in this migration to keep blast radius contained; worth revisiting
once `tran_order`/`tran_leg` land, since pricing more naturally keys off the
leg the same way cost/assay already do.

## What the draft migration (V258) does

1. Renames `dbo.tran_trade_order` → `dbo.tran_leg`, `order_id` → `leg_id`,
   and (caught on a second pass while building the frontend types against
   this table) `order_sequence` → `leg_sequence`, `order_reference` →
   `leg_reference` — the leg's own sequence/reference within the trade, not
   to be confused with `tran_order`'s own columns of the same base name
   (safe: SQL Server tracks FK/index/trigger references by `column_id`, not
   name — no dependent object needs updating for the column rename itself).
2. Renames `dbo.tran_trade_item` → `dbo.tran_leg_item`.
3. Also renames the two governance triggers/indexes still carrying the old
   `trade_order`/`trade_item` names (debris left over from V221, which
   renamed the tables but not their trigger/index objects) — cleaned up here
   since the migration is already touching these objects.
4. Creates `dbo.tran_order`: `order_id`, `trade_id` FK, `order_sequence`,
   `order_reference`, `status`, `order_execution_date`, `order_quantity`,
   `uom_code`, `price`, `currency_code`, `order_type`, `notes`, full
   governance columns (`row_version` INT, `created_at/by`, `updated_at/by`) +
   the standard `trg_tran_order_row_version_guard` trigger, matching V219's
   pattern exactly.
5. Adds `order_id` to `tran_leg`, backfills, sets `NOT NULL`, adds the FK.
6. Renames the 6 leg-child tables whose name literally contains
   "trade_order" to `tran_leg_*`, `order_id` → `leg_id` on each, plus their
   FK/index objects (see the update below — folded in, not deferred).

## Backfill decision — flagging this explicitly, don't run blind

There is no data today recording "these N legs came from one order" — even
the two-leg TTF example (`TRD-2026-00003-01`/`-02`) has independent
`order_reference` values per row, suggesting they were originally captured as
separate events, not one order split into two legs.

**The draft backfills 1:1** — one new `tran_order` row created per existing
`tran_leg` row, copying that leg's own `order_reference`/`quantity`/`uom_code`/
`price`/`currency_code`/`status` up into the new order row, with
`order_execution_date` taken from the parent `tran_trade.trade_date` (legs
have no execution-date column of their own to source it from). This preserves
current semantics exactly (no leg silently gains a sibling it didn't have) —
it does **not** attempt to guess that the July/August TTF legs should
retroactively become one order. Confirm this is right before running; if any
existing multi-leg trade actually *should* collapse to one order, that's a
manual data call, not something the migration should infer.

## Update — folded into V258, not deferred

On review, the 6 tables whose name literally contains "trade_order"
(`tran_trade_order_cost`/`_assay_result`/`_price_adjustment`/`_balmo`/`_tas`/
`_custom_field_value`) get renamed to `tran_leg_*` **in this same migration**,
`order_id` → `leg_id`, along with their FK/index objects. These are
unambiguously leg-level data (assay results, freight/port-due costs, BALMO
specs are cargo-level facts) — the table name should say so, and the
technical risk of an sp_rename here is identical to renaming the leg table
itself (FK/index tracking is by object/column id, not name), so there's no
reason to split it into a second pass.

Also added to `tran_order`: `order_type` (`OUTRIGHT`/`SPREAD`/`TERM`) —
deal-structure classification (single leg / paired-commodity structure like
spark-spread / multi-period strip). This is a domain classification, not
execution/OMS metadata, so it's in scope even though exchange connectivity
stays out of scope.

**Deliberately not adopted:** an execution-style status vocabulary
(`FILLED`/`PARTIALLY_FILLED`/`WORKING`) for `tran_order.status`. The draft
keeps `WORKING`/`CONFIRMED`/`SETTLED`/`CANCELLED` — the same vocabulary
`tran_trade` and the leg table already use — rather than introducing
OMS-fill language into a platform that isn't tracking exchange fills. A
leg-rollup concept ("some legs of this order are confirmed, others aren't")
is a real and different idea from an OMS fill state, and worth its own
follow-up if wanted, but shouldn't borrow fill-status wording that implies
execution tracking this platform doesn't do. Flagging for confirmation next
session rather than silently picking one.

## Deferred to a later, purely cosmetic pass (not in V258)

Renaming the `order_id`/`trade_order_id` column on the remaining 7 leg-child
tables that do **not** carry "trade_order" in their own table name
(`tran_nomination`, `tran_delivery_instruction`, `tran_trade_swap_detail`,
`tran_trade_option_detail`, `tran_trade_storage_agreement_detail`,
`tran_trade_transport_agreement_detail`, `tran_charter_party`) to `leg_id`.
No table-name confusion to fix here, so lower value — matches the same
"cosmetic pass can follow later" call made for column reordering in V199.

## Also not done here

- No Java entity changes — Trade Capture has no live backend for any of these
  tables (`tran_trade_order`/`tran_trade_item` confirmed to have zero JPA
  entities as of the V219 session), so this is schema + eventual frontend
  work only, same as every other Trade Capture schema change so far.
- No frontend/MSW changes. `TradeBlotter.tsx` and `mocks/etrmHandlers.ts`
  reference `orderId`/`trade_order` pervasively — updating those to the new
  `tran_order`/`tran_leg` shape (adding an order-selection/creation step
  above the leg form) is real, separate frontend work for a later session,
  not attempted in this draft.
- Costs/settlement work generally — explicitly still pending, unrelated to
  this restructure (Dharani: "we've not done anything to costs or settlement
  yet — that is still pending").
