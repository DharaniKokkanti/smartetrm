# Research — market_product_link contract-spec attributes (physical/future/swap/option), and how OpenLink Endur links/loads prices

> **Persona for this doc:** senior ETRM systems architect. This is a **research record only** — no schema or code changes were made or should be inferred from it. Revisit when Dharani is ready to scope the actual implementation.

**Status: RESEARCH ONLY (2026-07-26) — explicitly not to be implemented yet.** Dharani asked for the
attribute-design findings below to be written up for later review, plus a review of how OpenLink Endur
loads and links market prices into its system, for architecture inspiration. Per this project's standing
rule, vendor names (OpenLink/Endur) are fine in this research doc but must never appear in actual
DB objects, GUI text, or business logic if/when this gets implemented.

## Part 1 — Contract-spec attributes for physical / future / swap / option

### What already exists in this schema (don't duplicate)

- **`dbo.derivative_contract_specification`** (V161) — a reusable **template/convention** table, one row
  per contract-spec "shape," already covering `instrument_type IN ('FUTURE','OPTION','SWAP','SWAPTION',
  'SPREAD_OPTION','FORWARD')`. Pattern: one shared table, nullable columns scoped to specific
  `instrument_type` values via CHECK constraints (e.g. `option_style`/`exercise_type` only populated
  when the type is option-like). Not linked to `market_product_link` today.
- **`dbo.location`** (V1) — generic, any-commodity location master (country, region, timezone, lat/long,
  operator, capacity) — reusable as a delivery-location FK, no new location table needed.
- Commodity-specific quality specs already exist per-commodity elsewhere (`metal_assay_component_rule`,
  agri quality tables per `masterdata_curve_derivative_asset_gaps_pending_06.md`) — a physical contract
  spec should point at those, not reinvent generic quality columns.

### The gap

`derivative_contract_specification` has:
1. **No `PHYSICAL` instrument_type at all** — only paper/derivative types today.
2. **No swap-specific *convention* columns** — nothing at the reusable-template level equivalent to what
   `option_style`/`exercise_type` already do for options (reset/payment frequency, averaging method,
   floating-leg reference).

### Recommended shape (not yet implemented — for review)

Extend the existing table rather than build a new one — same shared-table-with-CHECK-scoped-columns
pattern already established in V161, not a new architecture:

- Add `'PHYSICAL'` to the `instrument_type` CHECK list, with new columns scoped to it via a CHECK
  (mirroring how `chk_dcs_option_fields_scope` already scopes option columns):
  - `delivery_location_id` — FK → `dbo.location`
  - `incoterm` — FOB / CIF / CFR / DAP / DES / EXW / etc.
  - `delivery_window_convention` — text, e.g. "16th to last calendar day of delivery month" (matches how
    ICE Low Sulphur Gasoil's delivery window is described — see sources)
  - `quantity_tolerance_pct` — physical cargoes commonly allow +/- a tolerance band, paper contracts don't
- Add swap-convention columns scoped to `SWAP`/`SWAPTION`:
  - `default_reset_frequency`, `default_payment_frequency`, `default_averaging_method` — the reusable
    market-data convention for this contract-spec template (value domains: DAILY/WEEKLY/MONTHLY/
    QUARTERLY/ANNUAL for frequency, ARITHMETIC/WEIGHTED for averaging method — standard swap-market
    vocabulary, not derived from any trade-side table)
- Quality: resolve via a pointer to the relevant existing commodity-specific quality table, not a new
  generic column — which table applies depends on the commodity, so this needs its own resolution rule
  (discriminator similar to `physical_asset`'s pattern) rather than a single FK. Not designed yet.

### Grounding (public sources, confirms delivery-location + quality-grade are core contract-spec
attributes on real exchanges, not something specific to this design)

- Every futures contract specifies quantity, quality/grade, delivery location, and delivery date as basic
  terms.
- ICE Low Sulphur Gasoil: physical delivery within the ARA region occurs between the 16th and last
  calendar day of the delivery month; deliverable quality is winter-grade Oct–Mar, summer-grade Apr–Sep —
  i.e. the delivery window and quality grade are commodity/contract-specific conventions, exactly the shape
  a reusable template table should hold.
- CME WTI: deliverable grade is defined as "light, sweet" crude with specific H2S/CO2 limits — grade
  definition is part of the contract spec, not the per-trade economics.
- Incoterms (FOB/CIF/DAP/etc.) are the standard vocabulary for allocating delivery risk/cost/responsibility
  in physical commodity contracts.

Sources:
- [ICE Low Sulphur Gasoil Futures](https://www.ice.com/products/34361119/Low-Sulphur-Gasoil-Futures)
- [CME Group — Learn About Contract Specifications](https://www.cmegroup.com/education/courses/introduction-to-futures/learn-about-contract-specifications)
- [Incoterms — Wikipedia](https://en.wikipedia.org/wiki/Incoterms)
- [Physical Delivery of Commodity Future Contracts (LCH/LSEG)](https://www.lseg.com/content/dam/post-trade/en_us/documents/lch/rulebooks/lch-sa/lch-physical-delivery-commodity-future-contracts-iii-4-4-va-en.pdf)

## Part 2 — How OpenLink Endur loads and links prices (architecture inspiration only)

Public documentation on Endur's internals is thin (most detail lives behind OpenLink's training/support
portal, not indexed publicly) — the shape below combines what's publicly confirmable (cited) with general,
widely-known ETRM domain practice this session already applies elsewhere (e.g. this project's own
`price_source`/`price_index_source`/`market_product_source` tables already mirror pieces of it). Treat the
uncited parts as informed domain framing, not verified proprietary detail.

**Confirmed via public sources:**
- Endur maintains "curves, prices, and indexes for valuation" — price index setup involves forward curve
  mapping, loaded price values, pricing date, quantity, valuation mode, and valuation logs.
- Curve building supports multiple interpolation/shaping methods (linear, flat-forward, log-linear,
  exponential, spline, or user-defined via scripting) through a dedicated "Market Manager" module, which
  manages curve hierarchy, node points, and shaping profiles — turning sparse data (e.g. monthly forward
  prices) into high-resolution values (e.g. hourly) using load profiles/statistical distributions/seasonal
  scalars.
- Market data is streamed in real time or on a schedule, updating forward curves, volatility surfaces, and
  spot prices; shaped curves feed directly into deal pricing, MtM valuation, and risk simulation.
- Lagged/averaged pricing (common in physical & swap deals — e.g. "average of daily published index over
  the pricing month, applied M-1") is handled via what public materials call "Projection Methods" — the
  price average can be multi-step (daily published prices, averaged over one or more monthly periods) to
  land on the final price used for a given deal.
- Integration is extensive and adaptor-based: APIs, file ingestion, JDBC/ODBC, event-driven feeds,
  purpose-built adaptors per market-data provider/venue/broker — not a single monolithic loader.

**General ETRM domain framing (how these pieces fit together, consistent with how this project's own
`price_source`/`price_index_source` split already works):**
1. **Ingest** — raw prices land from external feeds/files into a staging layer, not written directly into
   the live curve.
2. **Validate/normalize** — staged prices get checked (stale/spike/missing-day rules) and normalized to a
   common quotation basis (currency, UOM) before publication.
3. **Publish into the curve** — validated points populate the term structure for a given price index/curve,
   which is what shaping/interpolation then operates on.
4. **Link to instruments, not raw index reference** — a deal/instrument references the index *through* a
   pricing/averaging convention (lag, averaging window, business-day rounding) rather than pointing at the
   raw index directly — this is the layer this project's own `market_product_link` offset columns and the
   still-open `price_curve_point` design (gap #1 in `masterdata_curve_derivative_asset_gaps_pending_06.md`)
   are trying to cover, and is the same conceptual layer Part 1's proposed swap-convention columns on
   `derivative_contract_specification` would sit at. This is a market-data-side concern — the convention
   lives on the market-data/contract-spec side of the schema; how a booked deal actually consumes it is a
   separate, later concern and out of scope for market-data setup.
5. **Snapshot for settlement** — an EOD close snapshot becomes the authoritative settlement/valuation curve
   distinct from the continuously-updating live curve, used for MTM and P&L.

**Where this project already has pieces of this, and where it doesn't:**
- Ingest/validate/publish staging pipeline — **not built yet** anywhere in this schema; every price table
  today (`price_source`, `price_index_source`, `market_product_source`) models *where a price comes from*,
  not the ingest pipeline that gets it there.
- Curve/shaping/interpolation — **not built yet**; this is gap #1 from the earlier master-data review
  (`price_curve_point`/forward-curve master), still open, and is exactly the kind of thing `period` (V162)
  now exists to be the tenor axis for.
- Lag/averaging convention as a reusable market-data-side convention (not a per-deal concern) —
  **not built yet**; Part 1's proposed swap-convention columns on `derivative_contract_specification`
  would add this.
- EOD settlement snapshot vs. live curve — **not built yet**, not currently scoped anywhere.

Sources:
- [Market Data Architecture & Curve Configuration in Openlink Endur v25 (YouTube)](https://www.youtube.com/watch?v=oovguooJjQA)
- [Openlink Endur Solutions for Commodity Trading — ImpactQA](https://www.impactqa.com/blog/openlink-endur-solutions-powering-modern-commodity-trading-platforms/)
- [Openlink Endur Integration — 6B](https://6b.energy/services/interoperability-and-integration/energy-trading-and-risk-management-etrm-system-integration/openlink-endur-integration/)
- [Structured Gas Contract Modelling in Endur — KWA Analytics](https://kwa-analytics.com/2014/10/07/endur-structured-gas-contract-modelling-in-endur-3/)
- [Top 30 Openlink Endur Training Interview Questions](https://www.multisoftvirtualacademy.com/interview-questions/openlink-endur-training-interview-questions-answers-)

## Open questions for when this is picked back up

1. Does the `PHYSICAL` extension to `derivative_contract_specification` also need `market_product_link_id`
   wired in (today the table only has optional `product_id`/`listing_exchange_id`, not a market-scoped
   link) — relevant since V163 made `market_product_link` the market+product key everywhere else.
2. Quality-spec pointer resolution rule (which per-commodity quality table applies) — needs its own design,
   not assumed to be a single FK.
3. Whether the ingest/validate/publish price pipeline and EOD settlement snapshot (Part 2's gaps) are in
   scope for the same effort as Part 1's attribute additions, or a separate, later piece of work — not
   decided.
