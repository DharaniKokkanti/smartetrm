-- =============================================================================
-- SmartETRM — Consolidated Master Data Schema
-- =============================================================================
-- GENERATED FILE — do not hand-edit. Regenerate with mssql-scripter against a
-- freshly-migrated database (see the command at the bottom of this header).
--
-- Scope: every table registered in dbo.master_data_table_registry, plus every
-- Tier 1 core entity shown on the frontend's Master Data Hub
-- (etrm-frontend/src/features/master-data/MasterDataHub.tsx) — 146 tables —
-- plus 8 supporting/child tables the Hub's curated list references but
-- doesn't list as their own card (address, document_store,
-- field_permission_profile, gtc_version, pipeline_point,
-- pricing_trigger_event_type, pricing_window_rule, screen_field_registry) —
-- added so this file has no dangling FK references and applies cleanly on
-- its own. 154 tables total.
-- Deliberately excludes transactional/operational tables (trade, trade_order,
-- trade_item, trade_*_detail, position, position_eod_snapshot, nomination,
-- delivery_instruction, trade_cost, trade_order_cost, trade_order_assay_result,
-- trade_custom_field_value) — those live in the Flyway migration chain only.
--
-- This is a SNAPSHOT of final table shape (all 96 migrations already applied,
-- including every ALTER/DROP/rename along the way) — not a migration script.
-- The actual source of truth for schema history is
-- etrm-backend/src/main/resources/db/migration/V*.sql (Flyway reads that,
-- not this file). Regenerate whenever the migration frontier moves.
--
-- Deliberately has NO "USE [database]" statement — run it against whichever
-- database you've connected to (sqlcmd -d, or a `USE` of your own first).
--
-- Temporal (system-versioned) tables (legal_entity, app_user, book,
-- counterparty, pricing_rule) are post-processed from mssql-scripter's raw
-- output: SYSTEM_VERSIONING=ON is moved to after the PRIMARY KEY is added,
-- since SQL Server requires the PK to exist first — mssql-scripter's default
/****** Object:  Table [dbo].[legal_entity]    Script Date: 7/12/26 1:03:42PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[legal_entity](
	[legal_entity_id] [int] IDENTITY(1,1) NOT NULL,
	[entity_code] [varchar](20) NOT NULL,
	[entity_name] [varchar](200) NOT NULL,
	[short_name] [varchar](100) NOT NULL,
	[lei_code] [varchar](20) NULL,
	[parent_entity_id] [int] NULL,
	[incorporation_number] [varchar](50) NULL,
	[default_timezone] [varchar](50) NULL,
	[regulator] [varchar](100) NULL,
	[regulatory_licence] [varchar](100) NULL,
	[is_internal] [bit] NOT NULL,
	[is_active] [bit] NOT NULL,
	[go_live_date] [date] NULL,
	[deactivated_date] [date] NULL,
	[notes] [varchar](1000) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[valid_from] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[valid_to] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[entity_type] [int] NOT NULL,
	[parent_ind] [bit] NOT NULL,
	[base_currency_id] [int] NOT NULL,
	[jurisdiction_id] [int] NOT NULL,
	[incorporation_country_id] [int] NULL,
	PERIOD FOR SYSTEM_TIME ([valid_from], [valid_to])
) ON [PRIMARY]
GO

GO
/****** Object:  Table [dbo].[app_user]    Script Date: 7/12/26 1:03:42PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[app_user](
	[user_id] [int] IDENTITY(1,1) NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[username] [varchar](100) NOT NULL,
	[email] [varchar](255) NOT NULL,
	[password_hash] [varchar](255) NOT NULL,
	[full_name] [varchar](200) NOT NULL,
	[display_name] [varchar](100) NULL,
	[department] [varchar](100) NULL,
	[default_timezone] [varchar](50) NULL,
	[mfa_enabled] [bit] NOT NULL,
	[mfa_secret] [varchar](200) NULL,
	[last_login] [datetime2](7) NULL,
	[password_changed_at] [datetime2](7) NULL,
	[failed_login_count] [tinyint] NOT NULL,
	[locked_until] [datetime2](7) NULL,
	[is_active] [bit] NOT NULL,
	[deactivated_date] [date] NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[valid_from] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[valid_to] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[phone] [varchar](30) NULL,
	[trader_id] [bigint] NULL,
	[preferred_locale] [varchar](10) NULL,
	[office_location] [varchar](100) NULL,
	PERIOD FOR SYSTEM_TIME ([valid_from], [valid_to])
) ON [PRIMARY]
GO

GO
/****** Object:  Table [dbo].[book]    Script Date: 7/12/26 1:03:42PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[book](
	[book_id] [int] IDENTITY(1,1) NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[desk_id] [int] NULL,
	[responsible_trader_id] [int] NOT NULL,
	[book_code] [varchar](30) NOT NULL,
	[book_name] [varchar](200) NOT NULL,
	[position_limit] [decimal](18, 4) NULL,
	[pnl_limit] [decimal](18, 2) NULL,
	[var_limit] [decimal](18, 2) NULL,
	[is_active] [bit] NOT NULL,
	[go_live_date] [date] NULL,
	[description] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[valid_from] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[valid_to] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[book_type_id] [int] NULL,
	[book_type] [int] NOT NULL,
	[commodity_type] [int] NOT NULL,
	[base_currency_id] [int] NOT NULL,
	PERIOD FOR SYSTEM_TIME ([valid_from], [valid_to])
) ON [PRIMARY]
GO

GO
/****** Object:  Table [dbo].[counterparty]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[counterparty](
	[counterparty_id] [int] IDENTITY(1,1) NOT NULL,
	[cp_code] [varchar](20) NOT NULL,
	[legal_name] [varchar](300) NOT NULL,
	[short_name] [varchar](100) NOT NULL,
	[lei_code] [varchar](20) NULL,
	[credit_rating_id] [int] NULL,
	[credit_limit] [decimal](18, 2) NULL,
	[credit_review_date] [date] NULL,
	[settlement_days] [tinyint] NOT NULL,
	[default_currency_id] [int] NULL,
	[is_intercompany] [bit] NOT NULL,
	[internal_entity_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[kyc_approved_date] [date] NULL,
	[kyc_expiry_date] [date] NULL,
	[onboarded_date] [date] NULL,
	[deactivated_date] [date] NULL,
	[notes] [varchar](1000) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[valid_from] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[valid_to] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[cp_type] [int] NOT NULL,
	[kyc_status] [int] NOT NULL,
	[parent_ind] [bit] NOT NULL,
	[parent_counterparty_id] [int] NULL,
	[credit_limit_currency_id] [int] NOT NULL,
	[jurisdiction_id] [int] NOT NULL,
	PERIOD FOR SYSTEM_TIME ([valid_from], [valid_to])
) ON [PRIMARY]
GO

GO
/****** Object:  Table [dbo].[pricing_rule]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pricing_rule](
	[pricing_rule_id] [int] IDENTITY(1,1) NOT NULL,
	[product_id] [int] NOT NULL,
	[market_id] [int] NULL,
	[incoterm_id] [int] NULL,
	[pricing_type_id] [int] NOT NULL,
	[price_index_id] [int] NULL,
	[formula_template_id] [int] NULL,
	[differential_value] [decimal](18, 6) NULL,
	[differential_currency_id] [int] NULL,
	[primary_trigger_id] [int] NULL,
	[fallback_trigger_id] [int] NULL,
	[fallback_deadline_days] [smallint] NULL,
	[fallback_deadline_basis] [varchar](20) NULL,
	[window_rule_id] [int] NULL,
	[index_currency_id] [int] NULL,
	[trade_currency_id] [int] NULL,
	[fx_conversion_required] [bit] NOT NULL,
	[fx_fixing_type] [varchar](20) NULL,
	[fx_index_id] [int] NULL,
	[late_pricing_rule] [varchar](20) NULL,
	[provisional_basis] [varchar](20) NULL,
	[price_decimal_places] [tinyint] NOT NULL,
	[quantity_decimal_places] [tinyint] NOT NULL,
	[value_decimal_places] [tinyint] NOT NULL,
	[rounding_convention] [varchar](20) NOT NULL,
	[invoice_trigger_id] [int] NULL,
	[invoice_timing_days] [smallint] NOT NULL,
	[invoice_timing_basis] [varchar](10) NOT NULL,
	[invoice_calendar_id] [int] NULL,
	[requires_final_invoice] [bit] NOT NULL,
	[final_invoice_trigger_id] [int] NULL,
	[rule_name] [varchar](200) NOT NULL,
	[rule_code] [varchar](30) NOT NULL,
	[is_default] [bit] NOT NULL,
	[effective_from] [date] NOT NULL,
	[effective_to] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[valid_from_sys] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[valid_to_sys] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[tas_exchange] [nvarchar](20) NULL,
	[tas_contract_series] [nvarchar](10) NULL,
	[tas_tick_size] [decimal](12, 6) NULL,
	PERIOD FOR SYSTEM_TIME ([valid_from_sys], [valid_to_sys])
) ON [PRIMARY]
GO

GO
/****** Object:  Table [dbo].[address]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[address](
	[address_id] [int] IDENTITY(1,1) NOT NULL,
	[entity_type] [varchar](20) NULL,
	[entity_id] [bigint] NULL,
	[is_primary] [bit] NULL,
	[address_line1] [varchar](200) NOT NULL,
	[address_line2] [varchar](200) NULL,
	[address_line3] [varchar](200) NULL,
	[city] [varchar](100) NOT NULL,
	[state_province] [varchar](100) NULL,
	[postal_code] [varchar](20) NULL,
	[po_box] [varchar](50) NULL,
	[latitude] [decimal](9, 6) NULL,
	[longitude] [decimal](9, 6) NULL,
	[valid_from] [date] NULL,
	[valid_to] [date] NULL,
	[notes] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[address_type] [int] NOT NULL,
	[phone_number] [varchar](30) NULL,
	[country_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[address_type]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[address_type](
	[address_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[agri_crop_year_lifecycle]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[agri_crop_year_lifecycle](
	[lifecycle_id] [int] IDENTITY(1,1) NOT NULL,
	[commodity_id] [int] NOT NULL,
	[country_id] [int] NOT NULL,
	[crop_year_label] [varchar](20) NOT NULL,
	[harvest_start_date] [date] NOT NULL,
	[harvest_end_date] [date] NOT NULL,
	[regulatory_cutoff_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[agri_moisture_discount_scale]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[agri_moisture_discount_scale](
	[scale_id] [int] IDENTITY(1,1) NOT NULL,
	[grade_standard_id] [int] NOT NULL,
	[moisture_pct_min] [decimal](5, 2) NOT NULL,
	[moisture_pct_max] [decimal](5, 2) NOT NULL,
	[price_discount_per_uom] [decimal](10, 4) NOT NULL,
	[discount_currency_id] [int] NOT NULL,
	[discount_uom_id] [int] NOT NULL,
	[weight_shrinkage_factor_pct] [decimal](6, 4) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[balancing_authority]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[balancing_authority](
	[balancing_authority_id] [int] IDENTITY(1,1) NOT NULL,
	[ba_code] [varchar](20) NOT NULL,
	[ba_name] [varchar](200) NOT NULL,
	[region] [varchar](100) NULL,
	[market_type] [varchar](30) NOT NULL,
	[timezone] [varchar](50) NULL,
	[website] [varchar](300) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[country_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[balmo_product]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[balmo_product](
	[balmo_product_id] [int] IDENTITY(1,1) NOT NULL,
	[product_code] [varchar](30) NOT NULL,
	[product_name] [nvarchar](120) NOT NULL,
	[exchange] [varchar](20) NOT NULL,
	[contract_series] [varchar](20) NOT NULL,
	[contract_month] [char](7) NOT NULL,
	[pricing_start_date] [date] NOT NULL,
	[pricing_end_date] [date] NOT NULL,
	[last_trading_date] [date] NOT NULL,
	[settlement_price_ticker] [varchar](10) NOT NULL,
	[tick_size] [decimal](12, 6) NOT NULL,
	[price_source] [varchar](20) NOT NULL,
	[status] [varchar](20) NOT NULL,
	[notes] [nvarchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[uom_id] [int] NOT NULL,
	[tick_currency_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[bank_account]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bank_account](
	[bank_account_id] [int] IDENTITY(1,1) NOT NULL,
	[entity_type] [varchar](30) NOT NULL,
	[entity_id] [int] NOT NULL,
	[currency_id] [int] NOT NULL,
	[is_primary] [bit] NOT NULL,
	[bank_name] [varchar](200) NOT NULL,
	[bank_code] [varchar](20) NULL,
	[swift_bic] [varchar](11) NULL,
	[iban] [varchar](34) NULL,
	[account_number] [varchar](50) NULL,
	[account_name] [varchar](200) NOT NULL,
	[bank_address_id] [int] NULL,
	[correspondent_swift] [varchar](11) NULL,
	[correspondent_name] [varchar](200) NULL,
	[valid_from] [date] NULL,
	[valid_to] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[account_type] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[bank_account_type]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bank_account_type](
	[bank_account_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[bank_guarantee]    Script Date: 7/12/26 1:03:43PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bank_guarantee](
	[bg_id] [int] IDENTITY(1,1) NOT NULL,
	[bg_number] [varchar](100) NOT NULL,
	[bg_type] [varchar](20) NOT NULL,
	[issuing_bank_id] [int] NOT NULL,
	[principal_entity_id] [int] NOT NULL,
	[beneficiary_cp_id] [int] NOT NULL,
	[currency_id] [int] NOT NULL,
	[guarantee_amount] [decimal](18, 2) NOT NULL,
	[issue_date] [date] NOT NULL,
	[expiry_date] [date] NOT NULL,
	[claim_period_days] [smallint] NOT NULL,
	[bg_status] [varchar](20) NOT NULL,
	[amount_called] [decimal](18, 2) NOT NULL,
	[document_store_id] [int] NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[bolmo_agreement]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bolmo_agreement](
	[bolmo_id] [int] IDENTITY(1,1) NOT NULL,
	[bolmo_reference] [varchar](25) NOT NULL,
	[counterparty_id] [int] NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[agreement_date] [date] NOT NULL,
	[settlement_date] [date] NULL,
	[commodity_type] [varchar](20) NOT NULL,
	[delivery_period_code] [varchar](30) NULL,
	[net_quantity] [decimal](18, 6) NOT NULL,
	[netting_price] [decimal](18, 6) NULL,
	[status] [varchar](20) NOT NULL,
	[notes] [nvarchar](1000) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[delivery_location_id] [int] NULL,
	[uom_id] [int] NOT NULL,
	[currency_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[book_type]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[book_type](
	[book_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[broker]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[broker](
	[broker_id] [int] IDENTITY(1,1) NOT NULL,
	[broker_code] [varchar](30) NOT NULL,
	[broker_name] [varchar](120) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[broker_type] [varchar](10) NOT NULL,
	[description] [nvarchar](500) NULL,
	[contact_name] [varchar](120) NULL,
	[contact_email] [varchar](200) NULL,
	[contact_phone] [varchar](50) NULL,
	[website] [varchar](255) NULL,
	[legal_doc_id] [varchar](100) NULL,
	[commission_notes] [nvarchar](1000) NULL,
	[commodity_type] [varchar](20) NULL,
	[commission_uom_id] [int] NULL,
	[country_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[broker_fee_agreement]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[broker_fee_agreement](
	[agreement_id] [int] IDENTITY(1,1) NOT NULL,
	[broker_id] [int] NOT NULL,
	[agreement_code] [varchar](30) NOT NULL,
	[description] [nvarchar](300) NULL,
	[commodity_type] [varchar](20) NULL,
	[product_id] [int] NULL,
	[trade_type] [varchar](15) NULL,
	[fee_type] [varchar](20) NOT NULL,
	[fee_rate] [decimal](18, 6) NOT NULL,
	[pay_period] [varchar](15) NOT NULL,
	[payment_due_days] [int] NOT NULL,
	[minimum_fee] [decimal](14, 2) NULL,
	[maximum_fee] [decimal](14, 2) NULL,
	[effective_from] [date] NOT NULL,
	[effective_to] [date] NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[uom_id] [int] NULL,
	[fee_currency_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[carbon_registry]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[carbon_registry](
	[registry_id] [int] IDENTITY(1,1) NOT NULL,
	[registry_code] [nvarchar](30) NOT NULL,
	[registry_name] [nvarchar](200) NOT NULL,
	[operator] [nvarchar](200) NULL,
	[website] [nvarchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[registry_type] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[carbon_registry_type]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[carbon_registry_type](
	[carbon_registry_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[charter_party_type]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[charter_party_type](
	[charter_party_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](20) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[rate_basis] [varchar](20) NOT NULL,
	[duration_basis] [varchar](20) NOT NULL,
	[standard_form_reference] [varchar](100) NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[collateral]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[collateral](
	[collateral_id] [int] IDENTITY(1,1) NOT NULL,
	[collateral_type_id] [int] NOT NULL,
	[direction] [varchar](10) NOT NULL,
	[secured_entity_type] [varchar](20) NOT NULL,
	[secured_entity_id] [int] NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[counterparty_id] [int] NULL,
	[currency_id] [int] NOT NULL,
	[face_value] [decimal](18, 2) NOT NULL,
	[market_value] [decimal](18, 2) NULL,
	[haircut_pct] [decimal](5, 2) NOT NULL,
	[eligible_value]  AS ([market_value]*((1)-[haircut_pct]/(100))),
	[instrument_isin] [varchar](12) NULL,
	[instrument_desc] [varchar](200) NULL,
	[lc_id] [int] NULL,
	[bg_id] [int] NULL,
	[posting_date] [date] NOT NULL,
	[maturity_date] [date] NULL,
	[return_date] [date] NULL,
	[status] [varchar](20) NOT NULL,
	[document_store_id] [int] NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[collateral_type]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[collateral_type](
	[collateral_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](30) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[asset_class] [varchar](20) NOT NULL,
	[standard_haircut_pct] [decimal](5, 2) NOT NULL,
	[is_active] [bit] NOT NULL,
	[description] [varchar](300) NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[commodity]    Script Date: 7/12/26 1:03:44PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[commodity](
	[commodity_id] [int] IDENTITY(1,1) NOT NULL,
	[commodity_code] [varchar](20) NOT NULL,
	[commodity_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[commodity_subtype] [varchar](30) NULL,
	[default_uom_id] [int] NULL,
	[default_currency_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[commodity_family]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[commodity_family](
	[commodity_family_id] [int] IDENTITY(1,1) NOT NULL,
	[commodity_id] [int] NOT NULL,
	[family_code] [varchar](30) NOT NULL,
	[family_name] [varchar](100) NOT NULL,
	[family_type] [varchar](30) NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[commodity_grade_standard]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[commodity_grade_standard](
	[grade_standard_id] [int] IDENTITY(1,1) NOT NULL,
	[issuing_body] [varchar](50) NOT NULL,
	[grade_code] [varchar](30) NOT NULL,
	[grade_name] [varchar](150) NOT NULL,
	[is_par_grade] [bit] NOT NULL,
	[price_adjustment_per_uom] [decimal](10, 4) NOT NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[product_id] [int] NOT NULL,
	[adjustment_uom_id] [int] NULL,
	[adjustment_currency_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[commodity_type]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[commodity_type](
	[commodity_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[contact]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[contact](
	[contact_id] [int] IDENTITY(1,1) NOT NULL,
	[entity_type] [varchar](20) NULL,
	[entity_id] [bigint] NULL,
	[salutation] [varchar](10) NULL,
	[first_name] [varchar](100) NOT NULL,
	[last_name] [varchar](100) NOT NULL,
	[job_title] [varchar](200) NULL,
	[email] [varchar](255) NULL,
	[phone_direct] [varchar](50) NULL,
	[phone_mobile] [varchar](50) NULL,
	[phone_main] [varchar](50) NULL,
	[is_primary] [bit] NULL,
	[is_active] [bit] NOT NULL,
	[valid_from] [date] NULL,
	[valid_to] [date] NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[contact_role] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[contact_role]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[contact_role](
	[contact_role_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[container]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[container](
	[container_id] [int] IDENTITY(1,1) NOT NULL,
	[container_number] [varchar](20) NOT NULL,
	[container_type] [varchar](20) NOT NULL,
	[operator_id] [int] NOT NULL,
	[capacity_litres] [decimal](12, 2) NULL,
	[capacity_mt] [decimal](10, 3) NULL,
	[tare_weight_kg] [decimal](10, 2) NULL,
	[max_gross_weight_kg] [decimal](10, 2) NULL,
	[un_approval] [varchar](50) NULL,
	[approved_commodities] [varchar](500) NULL,
	[csc_plate_expiry] [date] NULL,
	[last_inspection_date] [date] NULL,
	[next_inspection_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[counterparty_type]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[counterparty_type](
	[counterparty_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[country]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[country](
	[country_id] [int] IDENTITY(1,1) NOT NULL,
	[country_code] [char](2) NOT NULL,
	[country_name] [varchar](100) NOT NULL,
	[region] [varchar](20) NOT NULL,
	[phone_code] [varchar](10) NULL,
	[fatf_status] [varchar](20) NOT NULL,
	[sanction_status] [varchar](20) NOT NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[cp_commercial_terms]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[cp_commercial_terms](
	[cp_terms_id] [int] IDENTITY(1,1) NOT NULL,
	[counterparty_id] [int] NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[payment_term_id] [int] NOT NULL,
	[credit_term_id] [int] NOT NULL,
	[default_currency_id] [int] NULL,
	[default_incoterm_id] [int] NULL,
	[commodity_type] [varchar](20) NULL,
	[effective_date] [date] NOT NULL,
	[expiry_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[cp_gtc_agreement]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[cp_gtc_agreement](
	[cp_gtc_id] [int] IDENTITY(1,1) NOT NULL,
	[counterparty_id] [int] NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[gtc_version_id] [int] NOT NULL,
	[signed_date] [date] NULL,
	[effective_date] [date] NOT NULL,
	[expiry_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[document_store_id] [int] NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[credit_limit]    Script Date: 7/12/26 1:03:45PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credit_limit](
	[credit_limit_id] [int] IDENTITY(1,1) NOT NULL,
	[counterparty_id] [int] NOT NULL,
	[limit_amount] [decimal](18, 2) NOT NULL,
	[used_amount] [decimal](18, 2) NOT NULL,
	[effective_date] [date] NOT NULL,
	[expiry_date] [date] NULL,
	[approved_by] [nvarchar](100) NULL,
	[approval_date] [date] NULL,
	[netting_agreement_ref] [nvarchar](100) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [nvarchar](1000) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[commodity_type] [varchar](20) NOT NULL,
	[limit_basis] [varchar](10) NOT NULL,
	[parent_limit_id] [int] NULL,
	[country_risk_rating] [varchar](10) NULL,
	[collateral_offset] [decimal](18, 2) NOT NULL,
	[collateral_ref] [nvarchar](100) NULL,
	[temp_uplift_amount] [decimal](18, 2) NULL,
	[temp_uplift_expiry] [date] NULL,
	[tenor_cap_months] [int] NULL,
	[credit_analyst_user_id] [int] NULL,
	[credit_analyst_name] [nvarchar](100) NULL,
	[review_frequency_days] [int] NULL,
	[last_review_date] [date] NULL,
	[next_review_date] [date] NULL,
	[last_review_outcome] [varchar](10) NULL,
	[internal_rating] [varchar](10) NULL,
	[external_rating] [varchar](10) NULL,
	[warning_threshold_pct] [decimal](5, 2) NOT NULL,
	[critical_threshold_pct] [decimal](5, 2) NOT NULL,
	[breach_action] [varchar](20) NOT NULL,
	[alert_internal] [bit] NOT NULL,
	[alert_counterparty] [bit] NOT NULL,
	[cp_alert_email] [nvarchar](200) NULL,
	[limit_type] [int] NOT NULL,
	[status] [int] NOT NULL,
	[limit_currency_id] [int] NOT NULL,
	[cp_country_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[credit_limit_status_type]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credit_limit_status_type](
	[credit_limit_status_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[credit_limit_type]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credit_limit_type](
	[credit_limit_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[credit_rating]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credit_rating](
	[credit_rating_id] [int] IDENTITY(1,1) NOT NULL,
	[agency] [varchar](20) NOT NULL,
	[rating] [varchar](10) NOT NULL,
	[numeric_score] [tinyint] NOT NULL,
	[risk_category] [varchar](20) NOT NULL,
	[description] [varchar](200) NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[credit_term]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credit_term](
	[credit_term_id] [int] IDENTITY(1,1) NOT NULL,
	[term_code] [varchar](30) NOT NULL,
	[term_name] [varchar](200) NOT NULL,
	[credit_period_days] [smallint] NOT NULL,
	[collateral_type] [varchar](30) NULL,
	[margin_call_threshold] [decimal](18, 2) NULL,
	[netting_eligible] [bit] NOT NULL,
	[requires_isda] [bit] NOT NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[margin_call_currency_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[currency]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[currency](
	[currency_id] [int] IDENTITY(1,1) NOT NULL,
	[currency_code] [char](3) NOT NULL,
	[currency_name] [varchar](100) NOT NULL,
	[symbol] [varchar](5) NULL,
	[decimal_places] [tinyint] NOT NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[deal_type]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[deal_type](
	[deal_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[demurrage_dispatch_rate]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[demurrage_dispatch_rate](
	[demurrage_rate_id] [int] IDENTITY(1,1) NOT NULL,
	[vessel_type] [varchar](30) NULL,
	[charter_party_type_id] [int] NULL,
	[demurrage_rate_per_day] [decimal](14, 2) NOT NULL,
	[dispatch_rate_per_day] [decimal](14, 2) NULL,
	[currency_id] [int] NOT NULL,
	[effective_from] [date] NOT NULL,
	[effective_to] [date] NULL,
	[notes] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[claim_time_bar_days] [smallint] NULL,
	[despatch_basis] [varchar](30) NULL,
	[commodity_type] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[desk]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[desk](
	[desk_id] [int] IDENTITY(1,1) NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[desk_code] [varchar](20) NOT NULL,
	[desk_name] [varchar](200) NOT NULL,
	[head_trader_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[commodity_type] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[document_store]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_store](
	[document_id] [int] IDENTITY(1,1) NOT NULL,
	[entity_type] [varchar](50) NOT NULL,
	[entity_id] [int] NOT NULL,
	[document_type] [varchar](50) NOT NULL,
	[document_name] [varchar](300) NOT NULL,
	[file_extension] [varchar](10) NULL,
	[mime_type] [varchar](100) NULL,
	[storage_path] [varchar](500) NOT NULL,
	[file_size_bytes] [bigint] NULL,
	[checksum_sha256] [varchar](64) NULL,
	[version] [varchar](20) NULL,
	[is_current] [bit] NOT NULL,
	[is_confidential] [bit] NOT NULL,
	[uploaded_at] [datetime2](7) NOT NULL,
	[uploaded_by] [varchar](100) NOT NULL,
	[expires_at] [datetime2](7) NULL,
	[notes] [varchar](500) NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[emission_obligation]    Script Date: 7/12/26 1:03:46PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[emission_obligation](
	[obligation_id] [int] IDENTITY(1,1) NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[scheme_id] [int] NOT NULL,
	[obligation_year] [smallint] NOT NULL,
	[verified_emissions] [decimal](18, 2) NULL,
	[allowances_held] [decimal](18, 2) NULL,
	[shortfall_units]  AS ([verified_emissions]-[allowances_held]) PERSISTED,
	[surrender_deadline] [date] NULL,
	[notes] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[status] [int] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
/****** Object:  Table [dbo].[emission_obligation_status]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[emission_obligation_status](
	[emission_obligation_status_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[emission_scheme]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[emission_scheme](
	[scheme_id] [int] IDENTITY(1,1) NOT NULL,
	[scheme_code] [nvarchar](30) NOT NULL,
	[scheme_name] [nvarchar](200) NOT NULL,
	[regulator] [nvarchar](200) NULL,
	[jurisdiction] [nvarchar](200) NULL,
	[description] [nvarchar](max) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[scheme_type] [int] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
/****** Object:  Table [dbo].[emission_scheme_type]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[emission_scheme_type](
	[emission_scheme_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[energy_footprint]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[energy_footprint](
	[energy_footprint_id] [int] IDENTITY(1,1) NOT NULL,
	[footprint_code] [varchar](30) NOT NULL,
	[footprint_name] [varchar](200) NOT NULL,
	[footprint_type] [varchar](30) NOT NULL,
	[flow_direction] [varchar](20) NOT NULL,
	[owner_counterparty_id] [int] NULL,
	[operator_counterparty_id] [int] NULL,
	[balancing_authority_id] [int] NULL,
	[default_zone_id] [int] NULL,
	[total_capacity_mw] [decimal](14, 2) NULL,
	[default_load_shape_id] [int] NULL,
	[is_aggregated_dispatch] [bit] NOT NULL,
	[commissioning_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[energy_footprint_site]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[energy_footprint_site](
	[footprint_site_id] [int] IDENTITY(1,1) NOT NULL,
	[energy_footprint_id] [int] NOT NULL,
	[site_code] [varchar](30) NOT NULL,
	[site_name] [varchar](200) NOT NULL,
	[site_type] [varchar](30) NOT NULL,
	[location_id] [int] NULL,
	[zone_id] [int] NULL,
	[capacity_mw] [decimal](14, 4) NOT NULL,
	[storage_capacity_mwh] [decimal](14, 4) NULL,
	[charger_count] [int] NULL,
	[max_charger_kw] [decimal](10, 2) NULL,
	[connector_standard] [varchar](20) NULL,
	[technology] [varchar](50) NULL,
	[generation_asset_id] [int] NULL,
	[site_load_shape_id] [int] NULL,
	[commissioning_date] [date] NULL,
	[decommissioning_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[environmental_product]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[environmental_product](
	[product_id] [int] IDENTITY(1,1) NOT NULL,
	[product_code] [nvarchar](30) NOT NULL,
	[product_name] [nvarchar](200) NOT NULL,
	[scheme_id] [int] NULL,
	[registry_id] [int] NULL,
	[unit_of_measure] [nvarchar](30) NOT NULL,
	[description] [nvarchar](max) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[product_type] [int] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
/****** Object:  Table [dbo].[environmental_product_type]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[environmental_product_type](
	[environmental_product_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[event_category]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[event_category](
	[category_id] [int] IDENTITY(1,1) NOT NULL,
	[category_code] [varchar](30) NOT NULL,
	[category_name] [varchar](100) NOT NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[event_type]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[event_type](
	[event_type_id] [int] IDENTITY(1,1) NOT NULL,
	[category_id] [int] NOT NULL,
	[event_code] [varchar](50) NOT NULL,
	[event_name] [varchar](200) NOT NULL,
	[entity_type] [varchar](30) NOT NULL,
	[severity] [varchar](20) NOT NULL,
	[requires_action] [bit] NOT NULL,
	[requires_approval] [bit] NOT NULL,
	[triggers_notification] [bit] NOT NULL,
	[sla_minutes] [smallint] NULL,
	[is_reportable] [bit] NOT NULL,
	[is_active] [bit] NOT NULL,
	[description] [varchar](500) NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[exchange]    Script Date: 7/12/26 1:03:47PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[exchange](
	[exchange_id] [int] IDENTITY(1,1) NOT NULL,
	[exchange_code] [varchar](20) NOT NULL,
	[exchange_name] [varchar](200) NOT NULL,
	[exchange_type] [varchar](20) NOT NULL,
	[city] [varchar](100) NULL,
	[timezone] [varchar](50) NOT NULL,
	[currency_id] [int] NOT NULL,
	[regulator] [varchar](100) NULL,
	[regulatory_code] [varchar](50) NULL,
	[mic_code] [char](4) NULL,
	[website] [varchar](200) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[country_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[external_system]    Script Date: 7/12/26 1:03:48PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[external_system](
	[external_system_id] [int] IDENTITY(1,1) NOT NULL,
	[system_code] [varchar](30) NOT NULL,
	[system_name] [varchar](150) NOT NULL,
	[system_type] [varchar](20) NOT NULL,
	[vendor_name] [varchar](150) NULL,
	[connection_type] [varchar](20) NULL,
	[base_url] [varchar](500) NULL,
	[owner_team] [varchar](100) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[field_permission_profile]    Script Date: 7/12/26 1:03:48PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[field_permission_profile](
	[profile_id] [int] IDENTITY(1,1) NOT NULL,
	[profile_code] [varchar](100) NOT NULL,
	[profile_name] [varchar](200) NOT NULL,
	[description] [varchar](500) NULL,
	[screen_code] [varchar](100) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[field_permission_rule]    Script Date: 7/12/26 1:03:48PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[field_permission_rule](
	[rule_id] [int] IDENTITY(1,1) NOT NULL,
	[profile_id] [int] NOT NULL,
	[field_id] [int] NOT NULL,
	[field_permission] [varchar](10) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[formula_template]    Script Date: 7/12/26 1:03:48PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[formula_template](
	[template_id] [int] IDENTITY(1,1) NOT NULL,
	[commodity_type] [varchar](20) NULL,
	[template_code] [varchar](30) NOT NULL,
	[template_name] [varchar](200) NOT NULL,
	[formula_type] [varchar](20) NOT NULL,
	[formula_expression] [varchar](500) NULL,
	[averaging_type] [varchar](20) NULL,
	[averaging_period_type] [varchar](20) NULL,
	[fx_conversion_required] [bit] NOT NULL,
	[fx_fixing_type] [varchar](20) NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[freight_rate_index]    Script Date: 7/12/26 1:03:48PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[freight_rate_index](
	[freight_rate_index_id] [int] IDENTITY(1,1) NOT NULL,
	[index_code] [varchar](30) NOT NULL,
	[index_name] [varchar](200) NOT NULL,
	[index_type] [varchar](20) NOT NULL,
	[vessel_type] [varchar](30) NULL,
	[route_description] [varchar](200) NULL,
	[currency_id] [int] NULL,
	[uom_id] [int] NULL,
	[publication_source] [varchar](100) NULL,
	[publication_frequency] [varchar](20) NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[commodity_type] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[fx_period]    Script Date: 7/12/26 1:03:48PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[fx_period](
	[fx_period_id] [int] IDENTITY(1,1) NOT NULL,
	[period_code] [varchar](20) NOT NULL,
	[period_name] [varchar](100) NOT NULL,
	[period_type] [varchar](20) NOT NULL,
	[days_offset] [int] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[fx_rate]    Script Date: 7/12/26 1:03:48PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[fx_rate](
	[fx_rate_id] [int] IDENTITY(1,1) NOT NULL,
	[from_currency_id] [int] NOT NULL,
	[to_currency_id] [int] NOT NULL,
	[rate] [decimal](18, 8) NOT NULL,
	[rate_date] [date] NOT NULL,
	[rate_type] [varchar](20) NOT NULL,
	[source] [varchar](50) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[fx_period_id] [int] NOT NULL,
	[maturity_date] [date] NOT NULL,
	[rate_value_type] [varchar](20) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[generation_asset]    Script Date: 7/12/26 1:03:48PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[generation_asset](
	[generation_asset_id] [int] IDENTITY(1,1) NOT NULL,
	[asset_code] [varchar](30) NOT NULL,
	[asset_name] [varchar](200) NOT NULL,
	[location_id] [int] NOT NULL,
	[balancing_authority_id] [int] NULL,
	[zone_id] [int] NULL,
	[owner_counterparty_id] [int] NULL,
	[fuel_type] [varchar](30) NOT NULL,
	[technology] [varchar](50) NULL,
	[nameplate_capacity_mw] [decimal](14, 2) NOT NULL,
	[commissioning_date] [date] NULL,
	[decommissioning_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[gl_account]    Script Date: 7/12/26 1:03:48PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[gl_account](
	[account_id] [int] IDENTITY(1,1) NOT NULL,
	[account_code] [nvarchar](30) NOT NULL,
	[account_name] [nvarchar](200) NOT NULL,
	[cost_center] [nvarchar](50) NULL,
	[description] [nvarchar](max) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[legal_entity_id] [int] NULL,
	[book_id] [int] NULL,
	[parent_account_id] [int] NULL,
	[normal_balance] [nvarchar](10) NOT NULL,
	[external_gl_code] [nvarchar](50) NULL,
	[is_control_account] [bit] NOT NULL,
	[account_type] [int] NOT NULL,
	[commodity_type] [int] NULL,
	[currency_id] [int] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
/****** Object:  Table [dbo].[governing_law_type]    Script Date: 7/12/26 1:03:49PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[governing_law_type](
	[governing_law_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[gtc]    Script Date: 7/12/26 1:03:49PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[gtc](
	[gtc_id] [int] IDENTITY(1,1) NOT NULL,
	[gtc_code] [varchar](30) NOT NULL,
	[gtc_name] [varchar](200) NOT NULL,
	[commodity_type] [varchar](20) NULL,
	[governing_law] [varchar](100) NULL,
	[dispute_resolution] [varchar](100) NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[jurisdiction_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[gtc_version]    Script Date: 7/12/26 1:03:49PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[gtc_version](
	[gtc_version_id] [int] IDENTITY(1,1) NOT NULL,
	[gtc_id] [int] NOT NULL,
	[version_number] [varchar](20) NOT NULL,
	[effective_date] [date] NOT NULL,
	[superseded_date] [date] NULL,
	[summary_of_changes] [varchar](1000) NULL,
	[document_store_id] [int] NULL,
	[is_current] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[holiday_calendar]    Script Date: 7/12/26 1:03:49PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[holiday_calendar](
	[calendar_id] [int] IDENTITY(1,1) NOT NULL,
	[calendar_code] [varchar](20) NOT NULL,
	[calendar_name] [varchar](200) NOT NULL,
	[commodity_type] [varchar](20) NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[country_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[incoterm]    Script Date: 7/12/26 1:03:49PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[incoterm](
	[incoterm_id] [int] IDENTITY(1,1) NOT NULL,
	[code] [varchar](10) NOT NULL,
	[name] [varchar](100) NOT NULL,
	[transport_mode] [varchar](20) NOT NULL,
	[risk_transfer] [varchar](200) NULL,
	[version_year] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[inspection_type]    Script Date: 7/12/26 1:03:49PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[inspection_type](
	[inspection_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](30) NOT NULL,
	[type_name] [varchar](200) NOT NULL,
	[applicable_to] [varchar](200) NULL,
	[issuing_body] [varchar](200) NULL,
	[validity_months] [smallint] NULL,
	[is_mandatory] [bit] NOT NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[insurance_policy]    Script Date: 7/12/26 1:03:49PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[insurance_policy](
	[policy_id] [int] IDENTITY(1,1) NOT NULL,
	[provider_id] [int] NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[policy_number] [varchar](100) NOT NULL,
	[policy_type] [varchar](30) NOT NULL,
	[insured_entity_type] [varchar](30) NULL,
	[insured_entity_id] [int] NULL,
	[currency_id] [int] NOT NULL,
	[sum_insured] [decimal](18, 2) NOT NULL,
	[deductible] [decimal](18, 2) NOT NULL,
	[premium_amount] [decimal](18, 2) NULL,
	[premium_currency_id] [int] NULL,
	[premium_frequency] [varchar](20) NULL,
	[inception_date] [date] NOT NULL,
	[expiry_date] [date] NOT NULL,
	[policy_status] [varchar](20) NOT NULL,
	[document_store_id] [int] NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[insurance_provider]    Script Date: 7/12/26 1:03:49PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[insurance_provider](
	[provider_id] [int] IDENTITY(1,1) NOT NULL,
	[provider_code] [varchar](20) NOT NULL,
	[provider_name] [varchar](200) NOT NULL,
	[provider_type] [varchar](20) NOT NULL,
	[credit_rating_id] [int] NULL,
	[counterparty_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[country_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[intercompany_transfer_rule]    Script Date: 7/12/26 1:03:49PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[intercompany_transfer_rule](
	[rule_id] [int] IDENTITY(1,1) NOT NULL,
	[source_legal_entity_id] [int] NOT NULL,
	[destination_legal_entity_id] [int] NOT NULL,
	[transfer_pricing_markup_type] [varchar](20) NOT NULL,
	[markup_value] [decimal](18, 6) NOT NULL,
	[markup_currency_id] [int] NULL,
	[automatic_booking_enabled] [bit] NOT NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[interconnector]    Script Date: 7/12/26 1:03:50PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[interconnector](
	[interconnector_id] [int] IDENTITY(1,1) NOT NULL,
	[interconnector_code] [varchar](30) NOT NULL,
	[interconnector_name] [varchar](200) NOT NULL,
	[from_zone_id] [int] NOT NULL,
	[to_zone_id] [int] NOT NULL,
	[capacity_mw] [decimal](14, 2) NULL,
	[direction_type] [varchar](20) NOT NULL,
	[operator] [varchar](200) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[interest_rate_index]    Script Date: 7/12/26 1:03:50PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[interest_rate_index](
	[rate_index_id] [int] IDENTITY(1,1) NOT NULL,
	[index_code] [varchar](20) NOT NULL,
	[index_name] [varchar](200) NOT NULL,
	[currency_id] [int] NOT NULL,
	[tenor] [varchar](20) NULL,
	[day_count_convention] [varchar](20) NOT NULL,
	[compounding] [varchar](20) NOT NULL,
	[publication_source] [varchar](100) NULL,
	[publication_time] [time](7) NULL,
	[fixing_lag_days] [tinyint] NOT NULL,
	[is_rfrr] [bit] NOT NULL,
	[replaces_index_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[description] [varchar](300) NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[kyc_status]    Script Date: 7/12/26 1:03:50PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[kyc_status](
	[kyc_status_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[laytime_exception_type]    Script Date: 7/12/26 1:03:50PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[laytime_exception_type](
	[exception_type_id] [int] IDENTITY(1,1) NOT NULL,
	[exception_code] [varchar](30) NOT NULL,
	[exception_name] [varchar](150) NOT NULL,
	[default_counts_against_laytime] [bit] NOT NULL,
	[is_weather_related] [bit] NOT NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[laytime_term_template]    Script Date: 7/12/26 1:03:50PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[laytime_term_template](
	[laytime_term_id] [int] IDENTITY(1,1) NOT NULL,
	[term_code] [varchar](20) NOT NULL,
	[term_name] [varchar](150) NOT NULL,
	[exclusion_basis] [varchar](20) NOT NULL,
	[is_reversible] [bit] NOT NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[nor_wipon_allowed] [bit] NOT NULL,
	[nor_wibon_allowed] [bit] NOT NULL,
	[nor_wifpon_allowed] [bit] NOT NULL,
	[nor_wccon_allowed] [bit] NOT NULL,
	[notice_of_readiness_turn_time_mins] [int] NOT NULL,
	[commodity_type] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[lc_status_type]    Script Date: 7/12/26 1:03:50PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[lc_status_type](
	[lc_status_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[lc_type]    Script Date: 7/12/26 1:03:50PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[lc_type](
	[lc_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[legal_entity_type]    Script Date: 7/12/26 1:03:50PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[legal_entity_type](
	[legal_entity_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[letter_of_credit]    Script Date: 7/12/26 1:03:50PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[letter_of_credit](
	[lc_id] [int] IDENTITY(1,1) NOT NULL,
	[lc_reference] [nvarchar](80) NOT NULL,
	[counterparty_id] [int] NOT NULL,
	[beneficiary_entity_id] [int] NOT NULL,
	[issuing_bank_name] [nvarchar](150) NOT NULL,
	[issuing_bank_bic] [nchar](11) NULL,
	[confirming_bank_name] [nvarchar](150) NULL,
	[lc_amount] [decimal](18, 2) NOT NULL,
	[issued_amount] [decimal](18, 2) NOT NULL,
	[drawdown_amount] [decimal](18, 2) NOT NULL,
	[issue_date] [date] NOT NULL,
	[expiry_date] [date] NOT NULL,
	[presentation_deadline_days] [smallint] NULL,
	[is_evergreen] [bit] NOT NULL,
	[auto_renewal_days] [smallint] NULL,
	[place_of_expiry] [nvarchar](80) NULL,
	[applicable_law] [nvarchar](50) NULL,
	[notes] [nvarchar](1000) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[lc_type] [int] NOT NULL,
	[status] [int] NOT NULL,
	[lc_currency_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[lng_boil_off_rule]    Script Date: 7/12/26 1:03:51PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[lng_boil_off_rule](
	[rule_id] [int] IDENTITY(1,1) NOT NULL,
	[rule_code] [varchar](30) NOT NULL,
	[rule_name] [varchar](150) NOT NULL,
	[vessel_id] [int] NULL,
	[facility_id] [int] NULL,
	[daily_boil_off_rate_pct] [decimal](6, 4) NOT NULL,
	[is_forcing_boil_off_allowed] [bit] NOT NULL,
	[effective_from] [date] NULL,
	[effective_to] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[lng_terminal_detail]    Script Date: 7/12/26 1:03:51PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[lng_terminal_detail](
	[facility_id] [int] NOT NULL,
	[terminal_type] [varchar](20) NOT NULL,
	[regas_capacity_mmscmd] [decimal](10, 2) NULL,
	[liquefaction_capacity_mtpa] [decimal](8, 2) NULL,
	[storage_capacity_cbm] [decimal](14, 2) NULL,
	[num_storage_tanks] [smallint] NULL,
	[num_berths] [smallint] NULL,
	[min_cargo_size_cbm] [decimal](12, 2) NULL,
	[max_cargo_size_cbm] [decimal](12, 2) NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[load_shape_component]    Script Date: 7/12/26 1:03:51PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[load_shape_component](
	[shape_component_id] [int] IDENTITY(1,1) NOT NULL,
	[parent_load_shape_id] [int] NOT NULL,
	[child_load_shape_id] [int] NOT NULL,
	[weight_factor] [decimal](8, 4) NOT NULL,
	[month_from] [tinyint] NULL,
	[month_to] [tinyint] NULL,
	[sequence_no] [smallint] NOT NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[load_shape_interval]    Script Date: 7/12/26 1:03:51PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[load_shape_interval](
	[shape_interval_id] [int] IDENTITY(1,1) NOT NULL,
	[load_shape_id] [int] NOT NULL,
	[day_type] [varchar](20) NOT NULL,
	[interval_no] [smallint] NOT NULL,
	[interval_factor] [decimal](8, 6) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[load_shape_template]    Script Date: 7/12/26 1:03:51PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[load_shape_template](
	[load_shape_id] [int] IDENTITY(1,1) NOT NULL,
	[shape_code] [varchar](30) NOT NULL,
	[shape_name] [varchar](150) NOT NULL,
	[shape_type] [varchar](20) NOT NULL,
	[applicable_days] [varchar](20) NOT NULL,
	[start_hour] [tinyint] NULL,
	[end_hour] [tinyint] NULL,
	[hours_per_day] [decimal](4, 2) NULL,
	[timezone_basis] [varchar](50) NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[interval_minutes] [smallint] NOT NULL,
	[is_composite] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[location]    Script Date: 7/12/26 1:03:51PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[location](
	[location_id] [int] IDENTITY(1,1) NOT NULL,
	[location_type_id] [int] NOT NULL,
	[location_code] [varchar](30) NOT NULL,
	[location_name] [varchar](200) NOT NULL,
	[commodity_type] [varchar](20) NULL,
	[region] [varchar](100) NULL,
	[timezone] [varchar](50) NULL,
	[latitude] [decimal](9, 6) NULL,
	[longitude] [decimal](9, 6) NULL,
	[operator] [varchar](200) NULL,
	[capacity] [decimal](18, 4) NULL,
	[capacity_uom_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[country_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[location_type]    Script Date: 7/12/26 1:03:51PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[location_type](
	[location_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](30) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL,
	[commodity_type] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[lookup_category]    Script Date: 7/12/26 1:03:51PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[lookup_category](
	[category_id] [int] IDENTITY(1,1) NOT NULL,
	[category_code] [varchar](100) NOT NULL,
	[category_name] [varchar](200) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[lookup_value]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[lookup_value](
	[lookup_id] [int] IDENTITY(1,1) NOT NULL,
	[code] [varchar](50) NOT NULL,
	[display_name] [varchar](200) NOT NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[category_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[margin_account]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[margin_account](
	[margin_account_id] [int] IDENTITY(1,1) NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[market_id] [int] NOT NULL,
	[account_ref] [varchar](100) NOT NULL,
	[account_type] [varchar](20) NOT NULL,
	[clearing_broker_id] [int] NULL,
	[currency_id] [int] NOT NULL,
	[initial_margin] [decimal](18, 2) NOT NULL,
	[variation_margin] [decimal](18, 2) NOT NULL,
	[excess_margin] [decimal](18, 2) NOT NULL,
	[margin_limit] [decimal](18, 2) NULL,
	[is_active] [bit] NOT NULL,
	[last_updated] [datetime2](7) NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[margin_agreement]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[margin_agreement](
	[margin_agreement_id] [int] IDENTITY(1,1) NOT NULL,
	[agreement_code] [nvarchar](50) NOT NULL,
	[counterparty_id] [int] NOT NULL,
	[threshold_amount] [decimal](18, 2) NOT NULL,
	[cp_threshold_amount] [decimal](18, 2) NOT NULL,
	[mta_amount] [decimal](18, 2) NOT NULL,
	[independent_amount] [decimal](18, 2) NULL,
	[rounding_amount] [decimal](18, 2) NULL,
	[eligible_collateral] [nvarchar](500) NULL,
	[eligible_currencies] [nvarchar](100) NULL,
	[effective_date] [date] NOT NULL,
	[expiry_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [nvarchar](1000) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[agreement_type] [int] NOT NULL,
	[valuation_frequency] [int] NOT NULL,
	[gov_law] [int] NOT NULL,
	[threshold_currency_id] [int] NOT NULL,
	[cp_threshold_currency_id] [int] NOT NULL,
	[mta_currency_id] [int] NOT NULL,
	[independent_amount_currency_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[margin_agreement_type]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[margin_agreement_type](
	[margin_agreement_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[market]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[market](
	[market_id] [int] IDENTITY(1,1) NOT NULL,
	[exchange_id] [int] NULL,
	[commodity_id] [int] NOT NULL,
	[market_code] [varchar](30) NOT NULL,
	[market_name] [varchar](200) NOT NULL,
	[market_type] [varchar](20) NOT NULL,
	[settlement_type] [varchar](20) NOT NULL,
	[currency_id] [int] NOT NULL,
	[timezone] [varchar](50) NOT NULL,
	[clearing_house] [varchar](100) NULL,
	[contract_size] [decimal](18, 4) NULL,
	[contract_uom_id] [int] NULL,
	[price_quotation] [varchar](100) NULL,
	[tick_size] [decimal](18, 6) NULL,
	[is_active] [bit] NOT NULL,
	[go_live_date] [date] NULL,
	[close_date] [date] NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[country_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[metal_assay_component_rule]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[metal_assay_component_rule](
	[rule_id] [int] IDENTITY(1,1) NOT NULL,
	[product_id] [int] NOT NULL,
	[element_code] [varchar](10) NOT NULL,
	[element_type] [varchar](20) NOT NULL,
	[base_content_pct] [decimal](9, 5) NOT NULL,
	[rejection_threshold_pct] [decimal](9, 5) NULL,
	[penalty_per_ppm_over_base] [decimal](18, 6) NULL,
	[penalty_currency_id] [int] NULL,
	[penalty_uom_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[metal_brand]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[metal_brand](
	[metal_brand_id] [int] IDENTITY(1,1) NOT NULL,
	[commodity_family_id] [int] NOT NULL,
	[brand_code] [varchar](30) NOT NULL,
	[brand_name] [varchar](150) NOT NULL,
	[producer_name] [varchar](200) NULL,
	[approval_date] [date] NULL,
	[delisting_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[metal_form] [int] NOT NULL,
	[country_of_origin_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[metal_shape]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[metal_shape](
	[metal_shape_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[metal_warrant]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[metal_warrant](
	[warrant_id] [int] IDENTITY(1,1) NOT NULL,
	[warrant_number] [varchar](50) NOT NULL,
	[facility_id] [int] NOT NULL,
	[product_id] [int] NOT NULL,
	[metal_brand_id] [int] NOT NULL,
	[metal_shape_id] [int] NOT NULL,
	[slot_vault_location] [varchar](50) NULL,
	[net_weight_mt] [decimal](18, 4) NOT NULL,
	[warrant_date] [date] NOT NULL,
	[rent_paid_through_date] [date] NULL,
	[is_pledged_collateral] [bit] NOT NULL,
	[holder_counterparty_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[mot_type]    Script Date: 7/12/26 1:03:52PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[mot_type](
	[mot_type_id] [int] IDENTITY(1,1) NOT NULL,
	[mot_code] [varchar](30) NOT NULL,
	[mot_name] [varchar](100) NOT NULL,
	[transport_medium] [varchar](20) NOT NULL,
	[requires_physical_asset] [bit] NOT NULL,
	[requires_routing] [bit] NOT NULL,
	[typical_commodities] [varchar](200) NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[netting_agreement]    Script Date: 7/12/26 1:03:53PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[netting_agreement](
	[netting_id] [int] IDENTITY(1,1) NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[counterparty_id] [int] NOT NULL,
	[agreement_ref] [varchar](100) NULL,
	[effective_date] [date] NOT NULL,
	[termination_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[agreement_type] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[netting_agreement_type]    Script Date: 7/12/26 1:03:53PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[netting_agreement_type](
	[netting_agreement_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[parent_company_guarantee]    Script Date: 7/12/26 1:03:53PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[parent_company_guarantee](
	[pcg_id] [int] IDENTITY(1,1) NOT NULL,
	[pcg_reference] [varchar](50) NOT NULL,
	[direction] [varchar](20) NOT NULL,
	[guarantor_entity_type] [varchar](20) NOT NULL,
	[guarantor_entity_id] [int] NOT NULL,
	[principal_entity_type] [varchar](20) NOT NULL,
	[principal_entity_id] [int] NOT NULL,
	[beneficiary_entity_type] [varchar](20) NOT NULL,
	[beneficiary_entity_id] [int] NOT NULL,
	[guarantee_amount] [decimal](18, 2) NOT NULL,
	[currency_id] [int] NOT NULL,
	[issue_date] [date] NOT NULL,
	[is_evergreen] [bit] NOT NULL,
	[expiry_date] [date] NULL,
	[pcg_status] [varchar](20) NOT NULL,
	[amount_called] [decimal](18, 2) NULL,
	[document_store_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[payment_calendar_assignment]    Script Date: 7/12/26 1:03:53PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payment_calendar_assignment](
	[assignment_id] [int] IDENTITY(1,1) NOT NULL,
	[payment_term_id] [int] NOT NULL,
	[currency_id] [int] NOT NULL,
	[location_id] [int] NULL,
	[primary_holiday_calendar_id] [int] NOT NULL,
	[secondary_holiday_calendar_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[payment_method]    Script Date: 7/12/26 1:03:53PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payment_method](
	[payment_method_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[payment_term]    Script Date: 7/12/26 1:03:53PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payment_term](
	[payment_term_id] [int] IDENTITY(1,1) NOT NULL,
	[term_code] [varchar](30) NOT NULL,
	[term_name] [varchar](200) NOT NULL,
	[offset_days] [smallint] NOT NULL,
	[days_basis] [varchar](20) NOT NULL,
	[calendar_id] [int] NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[payment_method] [int] NOT NULL,
	[base_date_event] [varchar](30) NOT NULL,
	[month_offset] [smallint] NOT NULL,
	[fixed_day_of_month] [smallint] NULL,
	[business_day_convention] [varchar](20) NOT NULL,
	[discount_days] [smallint] NULL,
	[discount_pct] [decimal](7, 4) NULL,
	[is_default] [bit] NOT NULL,
	[invoice_lead_days] [smallint] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[period]    Script Date: 7/12/26 1:03:53PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[period](
	[period_id] [int] IDENTITY(1,1) NOT NULL,
	[period_code] [varchar](30) NOT NULL,
	[period_name] [varchar](200) NOT NULL,
	[period_type] [varchar](20) NOT NULL,
	[is_rolling] [bit] NOT NULL,
	[roll_offset] [smallint] NULL,
	[roll_unit] [varchar](10) NULL,
	[period_start] [date] NULL,
	[period_end] [date] NULL,
	[curve_label] [varchar](30) NULL,
	[is_trading_period] [bit] NOT NULL,
	[is_risk_period] [bit] NOT NULL,
	[is_settlement_period] [bit] NOT NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[load_type_lookup_id] [int] NULL,
	[gas_day_type_lookup_id] [int] NULL,
	[start_time_utc] [time](7) NULL,
	[end_time_utc] [time](7) NULL,
	[crop_year_offset_months] [tinyint] NULL,
	[commodity_type] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[pipeline]    Script Date: 7/12/26 1:03:53PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pipeline](
	[pipeline_id] [int] IDENTITY(1,1) NOT NULL,
	[pipeline_code] [varchar](30) NOT NULL,
	[pipeline_name] [varchar](200) NOT NULL,
	[pipeline_type] [varchar](20) NOT NULL,
	[commodity_type] [varchar](20) NOT NULL,
	[operator_id] [int] NOT NULL,
	[owner_operator_id] [int] NULL,
	[tso_code] [varchar](50) NULL,
	[regulatory_body] [varchar](100) NULL,
	[regulatory_ref] [varchar](100) NULL,
	[length_km] [decimal](10, 2) NULL,
	[diameter_mm] [smallint] NULL,
	[max_operating_pressure] [decimal](8, 2) NULL,
	[max_capacity] [decimal](18, 4) NULL,
	[max_capacity_uom_id] [int] NULL,
	[flow_direction] [varchar](20) NOT NULL,
	[country_codes] [varchar](100) NULL,
	[is_cross_border] [bit] NOT NULL,
	[is_fungible] [bit] NOT NULL,
	[batch_scheduling] [bit] NOT NULL,
	[is_active] [bit] NOT NULL,
	[commissioned_date] [date] NULL,
	[decommissioned_date] [date] NULL,
	[notes] [varchar](1000) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[pipeline_cycle]    Script Date: 7/12/26 1:03:54PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pipeline_cycle](
	[cycle_id] [int] IDENTITY(1,1) NOT NULL,
	[pipeline_id] [int] NOT NULL,
	[cycle_type] [varchar](20) NOT NULL,
	[cycle_code] [varchar](20) NOT NULL,
	[cycle_name] [varchar](100) NOT NULL,
	[nomination_deadline] [time](7) NULL,
	[confirmation_deadline] [time](7) NULL,
	[scheduling_deadline] [time](7) NULL,
	[effective_start] [time](7) NULL,
	[effective_end] [time](7) NULL,
	[calendar_id] [int] NULL,
	[applies_to_days] [varchar](20) NOT NULL,
	[tolerance_pct] [decimal](5, 2) NULL,
	[cycle_priority] [tinyint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[product_id] [int] NULL,
	[effective_from] [date] NULL,
	[effective_to] [date] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[pipeline_point]    Script Date: 7/12/26 1:03:54PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pipeline_point](
	[point_id] [int] IDENTITY(1,1) NOT NULL,
	[pipeline_id] [int] NOT NULL,
	[location_id] [int] NOT NULL,
	[point_code] [varchar](30) NOT NULL,
	[point_name] [varchar](200) NOT NULL,
	[point_type] [varchar](20) NOT NULL,
	[flow_direction] [varchar](20) NOT NULL,
	[capacity] [decimal](18, 4) NULL,
	[capacity_uom_id] [int] NULL,
	[meter_ref] [varchar](50) NULL,
	[meter_type] [varchar](50) NULL,
	[interconnect_pipeline_id] [int] NULL,
	[facility_id] [int] NULL,
	[tariff_zone] [varchar](30) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[pipeline_segment]    Script Date: 7/12/26 1:03:54PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pipeline_segment](
	[segment_id] [int] IDENTITY(1,1) NOT NULL,
	[pipeline_id] [int] NOT NULL,
	[from_point_id] [int] NOT NULL,
	[to_point_id] [int] NOT NULL,
	[segment_code] [varchar](30) NOT NULL,
	[segment_name] [varchar](200) NULL,
	[length_km] [decimal](8, 2) NULL,
	[diameter_mm] [smallint] NULL,
	[max_operating_pressure] [decimal](8, 2) NULL,
	[forward_capacity] [decimal](18, 4) NULL,
	[reverse_capacity] [decimal](18, 4) NULL,
	[capacity_uom_id] [int] NULL,
	[tariff_zone] [varchar](30) NULL,
	[operational_status] [varchar](20) NOT NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[pipeline_tariff]    Script Date: 7/12/26 1:03:54PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pipeline_tariff](
	[tariff_id] [int] IDENTITY(1,1) NOT NULL,
	[pipeline_id] [int] NOT NULL,
	[from_point_id] [int] NOT NULL,
	[to_point_id] [int] NOT NULL,
	[product_id] [int] NULL,
	[tariff_type] [varchar](20) NOT NULL,
	[capacity_type] [varchar](20) NOT NULL,
	[currency_id] [int] NOT NULL,
	[rate] [decimal](18, 8) NOT NULL,
	[rate_uom_id] [int] NOT NULL,
	[season] [varchar](20) NULL,
	[effective_from] [date] NOT NULL,
	[effective_to] [date] NULL,
	[regulatory_ref] [varchar](100) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[power_ancillary_service_type]    Script Date: 7/12/26 1:03:54PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[power_ancillary_service_type](
	[service_type_id] [int] IDENTITY(1,1) NOT NULL,
	[service_code] [varchar](30) NOT NULL,
	[service_name] [varchar](150) NOT NULL,
	[balancing_authority_id] [int] NOT NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[power_pnode]    Script Date: 7/12/26 1:03:54PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[power_pnode](
	[pnode_id] [int] IDENTITY(1,1) NOT NULL,
	[pnode_market_name] [varchar](50) NOT NULL,
	[balancing_authority_id] [int] NOT NULL,
	[transmission_zone_id] [int] NULL,
	[node_type] [varchar](20) NOT NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[power_product_detail]    Script Date: 7/12/26 1:03:54PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[power_product_detail](
	[product_id] [int] NOT NULL,
	[default_load_shape_id] [int] NULL,
	[voltage_level] [varchar](20) NULL,
	[settlement_point_type] [varchar](20) NULL,
	[default_balancing_authority_id] [int] NULL,
	[default_zone_id] [int] NULL,
	[is_ancillary_service] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[price_index]    Script Date: 7/12/26 1:03:54PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[price_index](
	[price_index_id] [int] IDENTITY(1,1) NOT NULL,
	[commodity_id] [int] NOT NULL,
	[index_code] [varchar](30) NOT NULL,
	[index_name] [varchar](200) NOT NULL,
	[currency_id] [int] NOT NULL,
	[uom_id] [int] NOT NULL,
	[publication_source] [varchar](100) NULL,
	[publication_page] [varchar](100) NULL,
	[fixing_time] [time](7) NULL,
	[fixing_timezone] [varchar](50) NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[price_index_source]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[price_index_source](
	[pis_id] [int] IDENTITY(1,1) NOT NULL,
	[price_index_id] [int] NOT NULL,
	[price_source_id] [int] NOT NULL,
	[source_role] [varchar](20) NOT NULL,
	[source_field_code] [varchar](100) NULL,
	[source_ticker] [varchar](100) NULL,
	[price_multiplier] [decimal](10, 6) NOT NULL,
	[price_offset] [decimal](18, 4) NOT NULL,
	[effective_from] [date] NOT NULL,
	[effective_to] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[calculation_sequence] [tinyint] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[price_source]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[price_source](
	[price_source_id] [int] IDENTITY(1,1) NOT NULL,
	[source_code] [varchar](30) NOT NULL,
	[source_name] [varchar](200) NOT NULL,
	[source_type] [varchar](20) NOT NULL,
	[delivery_method] [varchar](20) NOT NULL,
	[frequency] [varchar](20) NOT NULL,
	[timezone] [varchar](50) NULL,
	[base_url] [varchar](300) NULL,
	[credentials_ref] [varchar](100) NULL,
	[sla_minutes] [smallint] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[pricing_trigger_event_type]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pricing_trigger_event_type](
	[trigger_type_id] [int] IDENTITY(1,1) NOT NULL,
	[trigger_code] [varchar](30) NOT NULL,
	[trigger_name] [varchar](200) NOT NULL,
	[trigger_category] [varchar](20) NOT NULL,
	[applicable_mot_codes] [varchar](100) NULL,
	[applicable_commodities] [varchar](100) NULL,
	[requires_physical_confirmation] [bit] NOT NULL,
	[is_fallback_type] [bit] NOT NULL,
	[is_system_generated] [bit] NOT NULL,
	[typical_confirmation_days] [smallint] NULL,
	[lifecycle_sequence] [tinyint] NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[pricing_type]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pricing_type](
	[pricing_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](30) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[requires_index] [bit] NOT NULL,
	[requires_formula] [bit] NOT NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[pricing_window_rule]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pricing_window_rule](
	[window_rule_id] [int] IDENTITY(1,1) NOT NULL,
	[commodity_type] [varchar](20) NULL,
	[rule_code] [varchar](30) NOT NULL,
	[rule_name] [varchar](200) NOT NULL,
	[window_type] [varchar](30) NOT NULL,
	[days_before] [smallint] NOT NULL,
	[days_after] [smallint] NOT NULL,
	[day_count_type] [varchar](20) NOT NULL,
	[calendar_id] [int] NULL,
	[market_id] [int] NULL,
	[min_fixings_required] [smallint] NOT NULL,
	[missing_fixing_rule] [varchar](20) NOT NULL,
	[backup_source_id] [int] NULL,
	[averaging_method] [varchar](20) NOT NULL,
	[price_rounding_dp] [tinyint] NOT NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[product]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[product](
	[product_id] [int] IDENTITY(1,1) NOT NULL,
	[commodity_id] [int] NOT NULL,
	[product_code] [varchar](30) NOT NULL,
	[product_name] [varchar](200) NOT NULL,
	[default_pricing_type_id] [int] NULL,
	[default_uom_id] [int] NULL,
	[default_currency_id] [int] NULL,
	[default_incoterm_id] [int] NULL,
	[lot_size] [decimal](18, 4) NULL,
	[min_quantity] [decimal](18, 4) NULL,
	[max_quantity] [decimal](18, 4) NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[settlement_type] [int] NOT NULL,
	[grade_code] [varchar](30) NULL,
	[bloomberg_ticker] [varchar](50) NULL,
	[reuters_ric] [varchar](50) NULL,
	[platts_code] [varchar](50) NULL,
	[is_exchange_traded] [bit] NOT NULL,
	[is_otc] [bit] NOT NULL,
	[updated_at] [datetime2](7) NULL,
	[updated_by] [varchar](100) NULL,
	[is_blend] [bit] NOT NULL,
	[blend_notes] [varchar](500) NULL,
	[density_estimate_kg_m3] [decimal](10, 3) NULL,
	[density_base_kg_m3] [decimal](10, 3) NULL,
	[cv_gross_mj_scm] [decimal](10, 4) NULL,
	[cv_net_mj_scm] [decimal](10, 4) NULL,
	[purity_basis_pct] [decimal](10, 4) NULL,
	[moisture_basis_pct] [decimal](5, 2) NULL,
	[protein_basis_pct] [decimal](5, 2) NULL,
	[commodity_family_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[product_spec_template]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[product_spec_template](
	[template_id] [int] IDENTITY(1,1) NOT NULL,
	[product_id] [int] NOT NULL,
	[template_code] [varchar](30) NOT NULL,
	[template_name] [varchar](200) NOT NULL,
	[commodity_type] [varchar](20) NOT NULL,
	[is_default] [bit] NOT NULL,
	[issuing_body] [varchar](200) NULL,
	[standard_ref] [varchar](100) NULL,
	[version] [varchar](20) NULL,
	[effective_from] [date] NULL,
	[effective_to] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[railcar]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[railcar](
	[railcar_id] [int] IDENTITY(1,1) NOT NULL,
	[car_number] [varchar](30) NOT NULL,
	[car_type] [varchar](30) NOT NULL,
	[operator_id] [int] NOT NULL,
	[capacity_litres] [decimal](12, 2) NULL,
	[capacity_mt] [decimal](10, 3) NULL,
	[dot_class] [varchar](20) NULL,
	[aar_class] [varchar](20) NULL,
	[last_test_date] [date] NULL,
	[next_test_date] [date] NULL,
	[cert_expiry] [date] NULL,
	[home_railroad] [varchar](100) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[build_year] [int] NULL,
	[gross_rail_load_lbs] [decimal](10, 2) NULL,
	[country_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[regulatory_obligation]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[regulatory_obligation](
	[obligation_id] [int] IDENTITY(1,1) NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[report_type_id] [int] NOT NULL,
	[obligation_type] [varchar](20) NOT NULL,
	[applicable_commodities] [varchar](200) NULL,
	[reporting_entity_id] [int] NULL,
	[registration_ref] [varchar](100) NULL,
	[registered_date] [date] NULL,
	[effective_from] [date] NOT NULL,
	[effective_to] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[regulatory_report_type]    Script Date: 7/12/26 1:03:55PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[regulatory_report_type](
	[report_type_id] [int] IDENTITY(1,1) NOT NULL,
	[report_code] [varchar](30) NOT NULL,
	[report_name] [varchar](200) NOT NULL,
	[regulation] [varchar](50) NOT NULL,
	[submission_target] [varchar](100) NULL,
	[reporting_deadline] [varchar](100) NULL,
	[report_format] [varchar](20) NULL,
	[is_mandatory] [bit] NOT NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[jurisdiction_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[reporting_group]    Script Date: 7/12/26 1:03:56PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[reporting_group](
	[reporting_group_id] [int] IDENTITY(1,1) NOT NULL,
	[group_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[classification_type_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[rin_account]    Script Date: 7/12/26 1:03:56PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[rin_account](
	[account_id] [int] IDENTITY(1,1) NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[epa_company_id] [nvarchar](20) NOT NULL,
	[epa_facility_id] [nvarchar](20) NULL,
	[account_code] [nvarchar](30) NOT NULL,
	[account_name] [nvarchar](200) NOT NULL,
	[account_type] [nvarchar](30) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[rin_fuel_category]    Script Date: 7/12/26 1:03:56PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[rin_fuel_category](
	[category_id] [int] IDENTITY(1,1) NOT NULL,
	[d_code] [nvarchar](5) NOT NULL,
	[fuel_name] [nvarchar](100) NOT NULL,
	[fuel_type] [nvarchar](30) NOT NULL,
	[equivalence_value] [decimal](5, 2) NOT NULL,
	[energy_sources] [nvarchar](500) NULL,
	[description] [nvarchar](max) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
/****** Object:  Table [dbo].[rin_obligation]    Script Date: 7/12/26 1:03:56PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[rin_obligation](
	[obligation_id] [int] IDENTITY(1,1) NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[compliance_year] [smallint] NOT NULL,
	[d_code] [nvarchar](5) NOT NULL,
	[required_quantity] [int] NOT NULL,
	[retired_quantity] [int] NOT NULL,
	[shortfall_quantity]  AS ([required_quantity]-[retired_quantity]) PERSISTED,
	[deadline] [date] NULL,
	[notes] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[status] [int] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
/****** Object:  Table [dbo].[screen_field_registry]    Script Date: 7/12/26 1:03:56PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[screen_field_registry](
	[field_id] [int] IDENTITY(1,1) NOT NULL,
	[screen_code] [varchar](100) NOT NULL,
	[field_key] [varchar](200) NOT NULL,
	[field_label] [varchar](200) NOT NULL,
	[field_group] [varchar](100) NULL,
	[is_required_field] [bit] NOT NULL,
	[sort_order] [int] NOT NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[settlement_calendar]    Script Date: 7/12/26 1:03:56PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[settlement_calendar](
	[sc_id] [int] IDENTITY(1,1) NOT NULL,
	[product_id] [int] NOT NULL,
	[calendar_id] [int] NOT NULL,
	[priority] [tinyint] NOT NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[settlement_price]    Script Date: 7/12/26 1:03:56PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[settlement_price](
	[settlement_price_id] [int] IDENTITY(1,1) NOT NULL,
	[exchange] [nvarchar](20) NOT NULL,
	[contract_ticker] [nvarchar](10) NOT NULL,
	[settle_date] [date] NOT NULL,
	[settle_price] [decimal](18, 6) NOT NULL,
	[tick_size] [decimal](12, 6) NOT NULL,
	[is_confirmed] [bit] NOT NULL,
	[source] [nvarchar](20) NOT NULL,
	[notes] [nvarchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[uom_id] [int] NOT NULL,
	[tick_currency_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[settlement_type]    Script Date: 7/12/26 1:03:56PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[settlement_type](
	[settlement_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[storage_facility]    Script Date: 7/12/26 1:03:57PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[storage_facility](
	[facility_id] [int] IDENTITY(1,1) NOT NULL,
	[location_id] [int] NOT NULL,
	[facility_code] [varchar](30) NOT NULL,
	[facility_name] [varchar](200) NOT NULL,
	[commodity_type] [varchar](20) NOT NULL,
	[capacity] [decimal](18, 4) NULL,
	[capacity_uom_id] [int] NULL,
	[operator] [varchar](200) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[facility_type] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[storage_facility_type]    Script Date: 7/12/26 1:03:57PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[storage_facility_type](
	[storage_facility_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[tank]    Script Date: 7/12/26 1:03:57PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tank](
	[tank_id] [int] IDENTITY(1,1) NOT NULL,
	[facility_id] [int] NOT NULL,
	[tank_number] [varchar](30) NOT NULL,
	[tank_name] [varchar](200) NULL,
	[tank_type] [varchar](30) NOT NULL,
	[commodity_type] [varchar](20) NOT NULL,
	[primary_product_id] [int] NULL,
	[nominal_capacity_m3] [decimal](12, 3) NULL,
	[working_capacity_m3] [decimal](12, 3) NULL,
	[heel_volume_m3] [decimal](10, 3) NULL,
	[diameter_m] [decimal](8, 2) NULL,
	[height_m] [decimal](8, 2) NULL,
	[is_heated] [bit] NOT NULL,
	[max_temp_celsius] [decimal](5, 1) NULL,
	[has_metering] [bit] NOT NULL,
	[meter_ref] [varchar](50) NULL,
	[tank_status] [varchar](20) NOT NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[heel_product_id] [int] NULL,
	[min_operating_level_m3] [decimal](12, 3) NULL,
	[max_safe_fill_level_m3] [decimal](12, 3) NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[tax_registration]    Script Date: 7/12/26 1:03:57PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tax_registration](
	[tax_reg_id] [int] IDENTITY(1,1) NOT NULL,
	[entity_type] [varchar](30) NOT NULL,
	[entity_id] [int] NOT NULL,
	[tax_id] [varchar](50) NOT NULL,
	[issuing_authority] [varchar](100) NULL,
	[registration_date] [date] NULL,
	[valid_from] [date] NULL,
	[valid_to] [date] NULL,
	[is_primary] [bit] NOT NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[tax_type] [int] NOT NULL,
	[jurisdiction_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[tax_type]    Script Date: 7/12/26 1:03:57PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tax_type](
	[tax_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[trade_repository]    Script Date: 7/12/26 1:03:57PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[trade_repository](
	[repository_id] [int] IDENTITY(1,1) NOT NULL,
	[repository_code] [varchar](20) NOT NULL,
	[repository_name] [varchar](200) NOT NULL,
	[regulation] [varchar](50) NOT NULL,
	[operator_cp_id] [int] NULL,
	[submission_url] [varchar](300) NULL,
	[submission_format] [varchar](20) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL,
	[jurisdiction_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[trader]    Script Date: 7/12/26 1:03:57PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[trader](
	[trader_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[legal_entity_id] [int] NOT NULL,
	[desk_id] [int] NULL,
	[trader_code] [varchar](20) NOT NULL,
	[commodity_types] [varchar](200) NULL,
	[daily_trade_limit] [decimal](18, 2) NULL,
	[single_trade_limit] [decimal](18, 2) NULL,
	[position_limit] [decimal](18, 4) NULL,
	[approver_trader_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[go_live_date] [date] NULL,
	[deactivated_date] [date] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[limit_currency_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[transmission_right_type]    Script Date: 7/12/26 1:03:57PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[transmission_right_type](
	[right_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](10) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[home_balancing_authority_id] [int] NULL,
	[settlement_basis] [varchar](30) NOT NULL,
	[allocation_method] [varchar](20) NOT NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[transmission_zone]    Script Date: 7/12/26 1:03:57PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[transmission_zone](
	[zone_id] [int] IDENTITY(1,1) NOT NULL,
	[balancing_authority_id] [int] NOT NULL,
	[zone_code] [varchar](30) NOT NULL,
	[zone_name] [varchar](200) NOT NULL,
	[zone_type] [varchar](30) NOT NULL,
	[location_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[transport_document_type]    Script Date: 7/12/26 1:03:58PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[transport_document_type](
	[doc_type_id] [int] IDENTITY(1,1) NOT NULL,
	[mot_type_id] [int] NULL,
	[doc_type_code] [varchar](30) NOT NULL,
	[doc_type_name] [varchar](200) NOT NULL,
	[is_mandatory] [bit] NOT NULL,
	[description] [varchar](300) NULL,
	[is_active] [bit] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[transport_operator]    Script Date: 7/12/26 1:03:58PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[transport_operator](
	[operator_id] [int] IDENTITY(1,1) NOT NULL,
	[operator_code] [varchar](20) NOT NULL,
	[operator_name] [varchar](200) NOT NULL,
	[mot_type_id] [int] NULL,
	[counterparty_id] [int] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[operator_type] [int] NOT NULL,
	[country_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[transport_route]    Script Date: 7/12/26 1:03:58PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[transport_route](
	[route_id] [int] IDENTITY(1,1) NOT NULL,
	[mot_type_id] [int] NOT NULL,
	[route_code] [varchar](30) NOT NULL,
	[route_name] [varchar](200) NOT NULL,
	[origin_location_id] [int] NOT NULL,
	[dest_location_id] [int] NOT NULL,
	[via_location_ids] [varchar](500) NULL,
	[distance_km] [decimal](10, 2) NULL,
	[transit_days_min] [smallint] NULL,
	[transit_days_max] [smallint] NULL,
	[commodity_type] [varchar](20) NULL,
	[max_vessel_size] [varchar](50) NULL,
	[seasonal_restriction] [varchar](200) NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[truck]    Script Date: 7/12/26 1:03:58PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[truck](
	[truck_id] [int] IDENTITY(1,1) NOT NULL,
	[registration_no] [varchar](30) NOT NULL,
	[fleet_no] [varchar](20) NULL,
	[operator_id] [int] NOT NULL,
	[truck_type] [varchar](30) NOT NULL,
	[capacity_litres] [decimal](12, 2) NULL,
	[capacity_mt] [decimal](10, 3) NULL,
	[num_compartments] [tinyint] NULL,
	[adr_certified] [bit] NOT NULL,
	[adr_classes] [varchar](100) NULL,
	[adr_expiry] [date] NULL,
	[last_inspection_date] [date] NULL,
	[next_inspection_date] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[country_id] [int] NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[unit_of_measure]    Script Date: 7/12/26 1:03:58PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[unit_of_measure](
	[uom_id] [int] IDENTITY(1,1) NOT NULL,
	[uom_code] [varchar](20) NOT NULL,
	[uom_name] [varchar](100) NOT NULL,
	[base_uom_code] [varchar](20) NULL,
	[conversion_factor] [decimal](20, 10) NULL,
	[is_active] [bit] NOT NULL,
	[uom_category] [int] NOT NULL,
	[commodity_type] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[uom_conversion]    Script Date: 7/12/26 1:03:58PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[uom_conversion](
	[conversion_id] [int] IDENTITY(1,1) NOT NULL,
	[from_uom_id] [int] NOT NULL,
	[to_uom_id] [int] NOT NULL,
	[factor] [decimal](20, 10) NOT NULL,
	[commodity_type] [varchar](20) NULL,
	[valid_from] [date] NULL,
	[valid_to] [date] NULL,
	[notes] [varchar](200) NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[uom_type]    Script Date: 7/12/26 1:03:58PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[uom_type](
	[uom_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[user_role]    Script Date: 7/12/26 1:03:58PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_role](
	[role_id] [int] IDENTITY(1,1) NOT NULL,
	[role_code] [varchar](50) NOT NULL,
	[role_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[role_type] [varchar](10) NOT NULL,
	[status] [varchar](20) NOT NULL,
	[rejection_reason] [varchar](500) NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[submitted_at] [datetime2](7) NULL,
	[approved_by] [varchar](100) NULL,
	[approved_at] [datetime2](7) NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[valuation_frequency_type]    Script Date: 7/12/26 1:03:59PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[valuation_frequency_type](
	[valuation_frequency_type_id] [int] IDENTITY(1,1) NOT NULL,
	[type_code] [varchar](50) NOT NULL,
	[type_name] [varchar](100) NOT NULL,
	[description] [varchar](500) NULL,
	[sort_order] [smallint] NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[vessel]    Script Date: 7/12/26 1:03:59PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vessel](
	[vessel_id] [int] IDENTITY(1,1) NOT NULL,
	[imo_number] [varchar](10) NOT NULL,
	[vessel_name] [varchar](200) NOT NULL,
	[vessel_type] [varchar](30) NOT NULL,
	[call_sign] [varchar](10) NULL,
	[mmsi] [varchar](9) NULL,
	[owner_operator_id] [int] NULL,
	[manager_operator_id] [int] NULL,
	[charterer_cp_id] [int] NULL,
	[dwt] [decimal](12, 2) NULL,
	[gross_tonnage] [decimal](12, 2) NULL,
	[net_tonnage] [decimal](12, 2) NULL,
	[cargo_capacity_cbm] [decimal](12, 2) NULL,
	[cargo_capacity_mt] [decimal](12, 2) NULL,
	[num_cargo_tanks] [smallint] NULL,
	[num_segregations] [smallint] NULL,
	[length_overall_m] [decimal](8, 2) NULL,
	[beam_m] [decimal](8, 2) NULL,
	[draft_max_m] [decimal](6, 2) NULL,
	[ice_class] [varchar](20) NULL,
	[build_year] [smallint] NULL,
	[shipyard] [varchar](200) NULL,
	[classification_society] [varchar](50) NULL,
	[class_notation] [varchar](100) NULL,
	[vetting_status] [varchar](20) NOT NULL,
	[vetting_expiry] [date] NULL,
	[is_active] [bit] NOT NULL,
	[notes] [varchar](1000) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[updated_by] [varchar](100) NOT NULL,
	[grain_capacity_cbm] [decimal](12, 2) NULL,
	[bale_capacity_cbm] [decimal](12, 2) NULL,
	[guaranteed_boil_off_rate_pct_per_day] [decimal](5, 3) NULL,
	[heel_capacity_cbm] [decimal](10, 2) NULL,
	[flag_country_id] [int] NOT NULL,
	[build_country_id] [int] NULL
) ON [PRIMARY]

GO
/****** Object:  Table [dbo].[vessel_certificate]    Script Date: 7/12/26 1:03:59PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vessel_certificate](
	[cert_id] [int] IDENTITY(1,1) NOT NULL,
	[vessel_id] [int] NOT NULL,
	[cert_type] [varchar](30) NOT NULL,
	[cert_number] [varchar](100) NULL,
	[issuing_body] [varchar](200) NULL,
	[issue_date] [date] NULL,
	[expiry_date] [date] NULL,
	[is_current] [bit] NOT NULL,
	[document_store_id] [int] NULL,
	[notes] [varchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[created_by] [varchar](100) NOT NULL
) ON [PRIMARY]

GO
/****** Object:  Index [pk_address]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[address] ADD  CONSTRAINT [pk_address] PRIMARY KEY CLUSTERED 
(
	[address_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_address_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[address_type] ADD  CONSTRAINT [pk_address_type] PRIMARY KEY CLUSTERED 
(
	[address_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_agri_crop_year_lifecycle]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[agri_crop_year_lifecycle] ADD  CONSTRAINT [pk_agri_crop_year_lifecycle] PRIMARY KEY CLUSTERED 
(
	[lifecycle_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_agri_moisture_discount_scale]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[agri_moisture_discount_scale] ADD  CONSTRAINT [pk_agri_moisture_discount_scale] PRIMARY KEY CLUSTERED 
(
	[scale_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_app_user]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[app_user] ADD  CONSTRAINT [pk_app_user] PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [dbo].[app_user] SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[app_user_history]))
GO
/****** Object:  Index [pk_balancing_authority]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[balancing_authority] ADD  CONSTRAINT [pk_balancing_authority] PRIMARY KEY CLUSTERED 
(
	[balancing_authority_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_balmo_product]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[balmo_product] ADD  CONSTRAINT [pk_balmo_product] PRIMARY KEY CLUSTERED 
(
	[balmo_product_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_bank_account]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[bank_account] ADD  CONSTRAINT [pk_bank_account] PRIMARY KEY CLUSTERED 
(
	[bank_account_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_bank_account_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[bank_account_type] ADD  CONSTRAINT [pk_bank_account_type] PRIMARY KEY CLUSTERED 
(
	[bank_account_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_bg]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[bank_guarantee] ADD  CONSTRAINT [pk_bg] PRIMARY KEY CLUSTERED 
(
	[bg_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_bolmo_agreement]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[bolmo_agreement] ADD  CONSTRAINT [pk_bolmo_agreement] PRIMARY KEY CLUSTERED 
(
	[bolmo_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_book]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[book] ADD  CONSTRAINT [pk_book] PRIMARY KEY CLUSTERED 
(
	[book_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [dbo].[book] SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[book_history]))
GO
/****** Object:  Index [pk_book_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[book_type] ADD  CONSTRAINT [pk_book_type] PRIMARY KEY CLUSTERED 
(
	[book_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_broker]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[broker] ADD  CONSTRAINT [pk_broker] PRIMARY KEY CLUSTERED 
(
	[broker_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_broker_fee_agreement]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[broker_fee_agreement] ADD  CONSTRAINT [pk_broker_fee_agreement] PRIMARY KEY CLUSTERED 
(
	[agreement_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__carbon_r__EF8E9CE8F07A240B]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[carbon_registry] ADD PRIMARY KEY CLUSTERED 
(
	[registry_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_carbon_registry_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[carbon_registry_type] ADD  CONSTRAINT [pk_carbon_registry_type] PRIMARY KEY CLUSTERED 
(
	[carbon_registry_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_charter_party_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[charter_party_type] ADD  CONSTRAINT [pk_charter_party_type] PRIMARY KEY CLUSTERED 
(
	[charter_party_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_collateral]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[collateral] ADD  CONSTRAINT [pk_collateral] PRIMARY KEY CLUSTERED 
(
	[collateral_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_collateral_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[collateral_type] ADD  CONSTRAINT [pk_collateral_type] PRIMARY KEY CLUSTERED 
(
	[collateral_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_commodity]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[commodity] ADD  CONSTRAINT [pk_commodity] PRIMARY KEY CLUSTERED 
(
	[commodity_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_commodity_family]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[commodity_family] ADD  CONSTRAINT [pk_commodity_family] PRIMARY KEY CLUSTERED 
(
	[commodity_family_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_commodity_grade_standard]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[commodity_grade_standard] ADD  CONSTRAINT [pk_commodity_grade_standard] PRIMARY KEY CLUSTERED 
(
	[grade_standard_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_commodity_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[commodity_type] ADD  CONSTRAINT [pk_commodity_type] PRIMARY KEY CLUSTERED 
(
	[commodity_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_contact]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[contact] ADD  CONSTRAINT [pk_contact] PRIMARY KEY CLUSTERED 
(
	[contact_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_contact_role]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[contact_role] ADD  CONSTRAINT [pk_contact_role] PRIMARY KEY CLUSTERED 
(
	[contact_role_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_container]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[container] ADD  CONSTRAINT [pk_container] PRIMARY KEY CLUSTERED 
(
	[container_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_counterparty]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[counterparty] ADD  CONSTRAINT [pk_counterparty] PRIMARY KEY CLUSTERED 
(
	[counterparty_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [dbo].[counterparty] SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[counterparty_history]))
GO
/****** Object:  Index [pk_counterparty_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[counterparty_type] ADD  CONSTRAINT [pk_counterparty_type] PRIMARY KEY CLUSTERED 
(
	[counterparty_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_country]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[country] ADD  CONSTRAINT [pk_country] PRIMARY KEY CLUSTERED 
(
	[country_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_cp_comm_terms]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[cp_commercial_terms] ADD  CONSTRAINT [pk_cp_comm_terms] PRIMARY KEY CLUSTERED 
(
	[cp_terms_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_cp_gtc]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[cp_gtc_agreement] ADD  CONSTRAINT [pk_cp_gtc] PRIMARY KEY CLUSTERED 
(
	[cp_gtc_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__credit_l__0B9BA40B0B41DB88]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[credit_limit] ADD PRIMARY KEY CLUSTERED 
(
	[credit_limit_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_credit_limit_status_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[credit_limit_status_type] ADD  CONSTRAINT [pk_credit_limit_status_type] PRIMARY KEY CLUSTERED 
(
	[credit_limit_status_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_credit_limit_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[credit_limit_type] ADD  CONSTRAINT [pk_credit_limit_type] PRIMARY KEY CLUSTERED 
(
	[credit_limit_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_credit_rating]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[credit_rating] ADD  CONSTRAINT [pk_credit_rating] PRIMARY KEY CLUSTERED 
(
	[credit_rating_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_credit_term]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[credit_term] ADD  CONSTRAINT [pk_credit_term] PRIMARY KEY CLUSTERED 
(
	[credit_term_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_currency]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[currency] ADD  CONSTRAINT [pk_currency] PRIMARY KEY CLUSTERED 
(
	[currency_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_deal_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[deal_type] ADD  CONSTRAINT [pk_deal_type] PRIMARY KEY CLUSTERED 
(
	[deal_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_demurrage_dispatch_rate]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[demurrage_dispatch_rate] ADD  CONSTRAINT [pk_demurrage_dispatch_rate] PRIMARY KEY CLUSTERED 
(
	[demurrage_rate_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_desk]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[desk] ADD  CONSTRAINT [pk_desk] PRIMARY KEY CLUSTERED 
(
	[desk_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_document_store]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[document_store] ADD  CONSTRAINT [pk_document_store] PRIMARY KEY CLUSTERED 
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__emission__06A6B248A1FB01AB]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[emission_obligation] ADD PRIMARY KEY CLUSTERED 
(
	[obligation_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_emission_obligation_status]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[emission_obligation_status] ADD  CONSTRAINT [pk_emission_obligation_status] PRIMARY KEY CLUSTERED 
(
	[emission_obligation_status_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__emission__8DF8FA63247F14C6]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[emission_scheme] ADD PRIMARY KEY CLUSTERED 
(
	[scheme_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_emission_scheme_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[emission_scheme_type] ADD  CONSTRAINT [pk_emission_scheme_type] PRIMARY KEY CLUSTERED 
(
	[emission_scheme_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_energy_footprint]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[energy_footprint] ADD  CONSTRAINT [pk_energy_footprint] PRIMARY KEY CLUSTERED 
(
	[energy_footprint_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_energy_footprint_site]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[energy_footprint_site] ADD  CONSTRAINT [pk_energy_footprint_site] PRIMARY KEY CLUSTERED 
(
	[footprint_site_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__environm__47027DF5F1EBC073]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[environmental_product] ADD PRIMARY KEY CLUSTERED 
(
	[product_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_environmental_product_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[environmental_product_type] ADD  CONSTRAINT [pk_environmental_product_type] PRIMARY KEY CLUSTERED 
(
	[environmental_product_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_event_category]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[event_category] ADD  CONSTRAINT [pk_event_category] PRIMARY KEY CLUSTERED 
(
	[category_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_event_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[event_type] ADD  CONSTRAINT [pk_event_type] PRIMARY KEY CLUSTERED 
(
	[event_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_exchange]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[exchange] ADD  CONSTRAINT [pk_exchange] PRIMARY KEY CLUSTERED 
(
	[exchange_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_external_system]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[external_system] ADD  CONSTRAINT [pk_external_system] PRIMARY KEY CLUSTERED 
(
	[external_system_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_fpp]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[field_permission_profile] ADD  CONSTRAINT [pk_fpp] PRIMARY KEY CLUSTERED 
(
	[profile_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_fpr]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[field_permission_rule] ADD  CONSTRAINT [pk_fpr] PRIMARY KEY CLUSTERED 
(
	[rule_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_formula_template]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[formula_template] ADD  CONSTRAINT [pk_formula_template] PRIMARY KEY CLUSTERED 
(
	[template_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_freight_rate_index]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[freight_rate_index] ADD  CONSTRAINT [pk_freight_rate_index] PRIMARY KEY CLUSTERED 
(
	[freight_rate_index_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_fx_period]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[fx_period] ADD  CONSTRAINT [pk_fx_period] PRIMARY KEY CLUSTERED 
(
	[fx_period_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_fx_rate]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[fx_rate] ADD  CONSTRAINT [pk_fx_rate] PRIMARY KEY CLUSTERED 
(
	[fx_rate_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_generation_asset]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[generation_asset] ADD  CONSTRAINT [pk_generation_asset] PRIMARY KEY CLUSTERED 
(
	[generation_asset_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__gl_accou__46A222CD51890E21]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[gl_account] ADD PRIMARY KEY CLUSTERED 
(
	[account_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_governing_law_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[governing_law_type] ADD  CONSTRAINT [pk_governing_law_type] PRIMARY KEY CLUSTERED 
(
	[governing_law_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_gtc]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[gtc] ADD  CONSTRAINT [pk_gtc] PRIMARY KEY CLUSTERED 
(
	[gtc_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_gtc_version]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[gtc_version] ADD  CONSTRAINT [pk_gtc_version] PRIMARY KEY CLUSTERED 
(
	[gtc_version_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_holiday_calendar]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[holiday_calendar] ADD  CONSTRAINT [pk_holiday_calendar] PRIMARY KEY CLUSTERED 
(
	[calendar_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_incoterm]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[incoterm] ADD  CONSTRAINT [pk_incoterm] PRIMARY KEY CLUSTERED 
(
	[incoterm_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_inspection_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[inspection_type] ADD  CONSTRAINT [pk_inspection_type] PRIMARY KEY CLUSTERED 
(
	[inspection_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_insurance_policy]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[insurance_policy] ADD  CONSTRAINT [pk_insurance_policy] PRIMARY KEY CLUSTERED 
(
	[policy_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_insurance_provider]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[insurance_provider] ADD  CONSTRAINT [pk_insurance_provider] PRIMARY KEY CLUSTERED 
(
	[provider_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_intercompany_transfer_rule]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[intercompany_transfer_rule] ADD  CONSTRAINT [pk_intercompany_transfer_rule] PRIMARY KEY CLUSTERED 
(
	[rule_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_interconnector]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[interconnector] ADD  CONSTRAINT [pk_interconnector] PRIMARY KEY CLUSTERED 
(
	[interconnector_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_iri]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[interest_rate_index] ADD  CONSTRAINT [pk_iri] PRIMARY KEY CLUSTERED 
(
	[rate_index_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_kyc_status]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[kyc_status] ADD  CONSTRAINT [pk_kyc_status] PRIMARY KEY CLUSTERED 
(
	[kyc_status_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_laytime_exception_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[laytime_exception_type] ADD  CONSTRAINT [pk_laytime_exception_type] PRIMARY KEY CLUSTERED 
(
	[exception_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_laytime_term_template]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[laytime_term_template] ADD  CONSTRAINT [pk_laytime_term_template] PRIMARY KEY CLUSTERED 
(
	[laytime_term_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_lc_status_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lc_status_type] ADD  CONSTRAINT [pk_lc_status_type] PRIMARY KEY CLUSTERED 
(
	[lc_status_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_lc_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lc_type] ADD  CONSTRAINT [pk_lc_type] PRIMARY KEY CLUSTERED 
(
	[lc_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_legal_entity]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[legal_entity] ADD  CONSTRAINT [pk_legal_entity] PRIMARY KEY CLUSTERED 
(
	[legal_entity_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [dbo].[legal_entity] SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[legal_entity_history]))
GO
/****** Object:  Index [pk_legal_entity_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[legal_entity_type] ADD  CONSTRAINT [pk_legal_entity_type] PRIMARY KEY CLUSTERED 
(
	[legal_entity_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__letter_o__E43FE1A98B100702]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[letter_of_credit] ADD PRIMARY KEY CLUSTERED 
(
	[lc_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_lng_boil_off_rule]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lng_boil_off_rule] ADD  CONSTRAINT [pk_lng_boil_off_rule] PRIMARY KEY CLUSTERED 
(
	[rule_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_lng_terminal_detail]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lng_terminal_detail] ADD  CONSTRAINT [pk_lng_terminal_detail] PRIMARY KEY CLUSTERED 
(
	[facility_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_load_shape_component]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[load_shape_component] ADD  CONSTRAINT [pk_load_shape_component] PRIMARY KEY CLUSTERED 
(
	[shape_component_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_load_shape_interval]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[load_shape_interval] ADD  CONSTRAINT [pk_load_shape_interval] PRIMARY KEY CLUSTERED 
(
	[shape_interval_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_load_shape_template]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[load_shape_template] ADD  CONSTRAINT [pk_load_shape_template] PRIMARY KEY CLUSTERED 
(
	[load_shape_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_location]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[location] ADD  CONSTRAINT [pk_location] PRIMARY KEY CLUSTERED 
(
	[location_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_location_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[location_type] ADD  CONSTRAINT [pk_location_type] PRIMARY KEY CLUSTERED 
(
	[location_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_lookup_category]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lookup_category] ADD  CONSTRAINT [pk_lookup_category] PRIMARY KEY CLUSTERED 
(
	[category_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_lookup_value]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lookup_value] ADD  CONSTRAINT [pk_lookup_value] PRIMARY KEY CLUSTERED 
(
	[lookup_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_margin_account]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[margin_account] ADD  CONSTRAINT [pk_margin_account] PRIMARY KEY CLUSTERED 
(
	[margin_account_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__margin_a__54278E95BD3CB7BB]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[margin_agreement] ADD PRIMARY KEY CLUSTERED 
(
	[margin_agreement_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_margin_agreement_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[margin_agreement_type] ADD  CONSTRAINT [pk_margin_agreement_type] PRIMARY KEY CLUSTERED 
(
	[margin_agreement_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_market]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[market] ADD  CONSTRAINT [pk_market] PRIMARY KEY CLUSTERED 
(
	[market_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_metal_assay_component_rule]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[metal_assay_component_rule] ADD  CONSTRAINT [pk_metal_assay_component_rule] PRIMARY KEY CLUSTERED 
(
	[rule_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_metal_brand]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[metal_brand] ADD  CONSTRAINT [pk_metal_brand] PRIMARY KEY CLUSTERED 
(
	[metal_brand_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_metal_shape]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[metal_shape] ADD  CONSTRAINT [pk_metal_shape] PRIMARY KEY CLUSTERED 
(
	[metal_shape_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_metal_warrant]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[metal_warrant] ADD  CONSTRAINT [pk_metal_warrant] PRIMARY KEY CLUSTERED 
(
	[warrant_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_mot_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[mot_type] ADD  CONSTRAINT [pk_mot_type] PRIMARY KEY CLUSTERED 
(
	[mot_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_netting]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[netting_agreement] ADD  CONSTRAINT [pk_netting] PRIMARY KEY CLUSTERED 
(
	[netting_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_netting_agreement_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[netting_agreement_type] ADD  CONSTRAINT [pk_netting_agreement_type] PRIMARY KEY CLUSTERED 
(
	[netting_agreement_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_parent_company_guarantee]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[parent_company_guarantee] ADD  CONSTRAINT [pk_parent_company_guarantee] PRIMARY KEY CLUSTERED 
(
	[pcg_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_payment_calendar_assignment]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[payment_calendar_assignment] ADD  CONSTRAINT [pk_payment_calendar_assignment] PRIMARY KEY CLUSTERED 
(
	[assignment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_payment_method]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[payment_method] ADD  CONSTRAINT [pk_payment_method] PRIMARY KEY CLUSTERED 
(
	[payment_method_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_payment_term]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[payment_term] ADD  CONSTRAINT [pk_payment_term] PRIMARY KEY CLUSTERED 
(
	[payment_term_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_period]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[period] ADD  CONSTRAINT [pk_period] PRIMARY KEY CLUSTERED 
(
	[period_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pipeline]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline] ADD  CONSTRAINT [pk_pipeline] PRIMARY KEY CLUSTERED 
(
	[pipeline_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pipeline_cycle]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline_cycle] ADD  CONSTRAINT [pk_pipeline_cycle] PRIMARY KEY CLUSTERED 
(
	[cycle_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pipeline_point]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline_point] ADD  CONSTRAINT [pk_pipeline_point] PRIMARY KEY CLUSTERED 
(
	[point_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pipeline_segment]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline_segment] ADD  CONSTRAINT [pk_pipeline_segment] PRIMARY KEY CLUSTERED 
(
	[segment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pipeline_tariff]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline_tariff] ADD  CONSTRAINT [pk_pipeline_tariff] PRIMARY KEY CLUSTERED 
(
	[tariff_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_power_ancillary_service_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[power_ancillary_service_type] ADD  CONSTRAINT [pk_power_ancillary_service_type] PRIMARY KEY CLUSTERED 
(
	[service_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_power_pnode]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[power_pnode] ADD  CONSTRAINT [pk_power_pnode] PRIMARY KEY CLUSTERED 
(
	[pnode_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_power_product_detail]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[power_product_detail] ADD  CONSTRAINT [pk_power_product_detail] PRIMARY KEY CLUSTERED 
(
	[product_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_price_index]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[price_index] ADD  CONSTRAINT [pk_price_index] PRIMARY KEY CLUSTERED 
(
	[price_index_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pis]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[price_index_source] ADD  CONSTRAINT [pk_pis] PRIMARY KEY CLUSTERED 
(
	[pis_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_price_source]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[price_source] ADD  CONSTRAINT [pk_price_source] PRIMARY KEY CLUSTERED 
(
	[price_source_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pricing_rule]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pricing_rule] ADD  CONSTRAINT [pk_pricing_rule] PRIMARY KEY CLUSTERED 
(
	[pricing_rule_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [dbo].[pricing_rule] SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[pricing_rule_history]))
GO
/****** Object:  Index [pk_ptet]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pricing_trigger_event_type] ADD  CONSTRAINT [pk_ptet] PRIMARY KEY CLUSTERED 
(
	[trigger_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pricing_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pricing_type] ADD  CONSTRAINT [pk_pricing_type] PRIMARY KEY CLUSTERED 
(
	[pricing_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pwr]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pricing_window_rule] ADD  CONSTRAINT [pk_pwr] PRIMARY KEY CLUSTERED 
(
	[window_rule_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_product]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[product] ADD  CONSTRAINT [pk_product] PRIMARY KEY CLUSTERED 
(
	[product_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_pst]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[product_spec_template] ADD  CONSTRAINT [pk_pst] PRIMARY KEY CLUSTERED 
(
	[template_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_railcar]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[railcar] ADD  CONSTRAINT [pk_railcar] PRIMARY KEY CLUSTERED 
(
	[railcar_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_reg_obligation]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[regulatory_obligation] ADD  CONSTRAINT [pk_reg_obligation] PRIMARY KEY CLUSTERED 
(
	[obligation_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_rrt]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[regulatory_report_type] ADD  CONSTRAINT [pk_rrt] PRIMARY KEY CLUSTERED 
(
	[report_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_reporting_group]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[reporting_group] ADD  CONSTRAINT [pk_reporting_group] PRIMARY KEY CLUSTERED 
(
	[reporting_group_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__rin_acco__46A222CDDAA48C90]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[rin_account] ADD PRIMARY KEY CLUSTERED 
(
	[account_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__rin_fuel__D54EE9B4BD2369CB]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[rin_fuel_category] ADD PRIMARY KEY CLUSTERED 
(
	[category_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__rin_obli__06A6B24856FCCEC6]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[rin_obligation] ADD PRIMARY KEY CLUSTERED 
(
	[obligation_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_sfr]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[screen_field_registry] ADD  CONSTRAINT [pk_sfr] PRIMARY KEY CLUSTERED 
(
	[field_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_settlement_cal]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[settlement_calendar] ADD  CONSTRAINT [pk_settlement_cal] PRIMARY KEY CLUSTERED 
(
	[sc_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [PK__settleme__3314638EAAA2E1E3]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[settlement_price] ADD PRIMARY KEY CLUSTERED 
(
	[settlement_price_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_settlement_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[settlement_type] ADD  CONSTRAINT [pk_settlement_type] PRIMARY KEY CLUSTERED 
(
	[settlement_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_storage_facility]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[storage_facility] ADD  CONSTRAINT [pk_storage_facility] PRIMARY KEY CLUSTERED 
(
	[facility_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_storage_facility_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[storage_facility_type] ADD  CONSTRAINT [pk_storage_facility_type] PRIMARY KEY CLUSTERED 
(
	[storage_facility_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_tank]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[tank] ADD  CONSTRAINT [pk_tank] PRIMARY KEY CLUSTERED 
(
	[tank_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_tax_registration]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[tax_registration] ADD  CONSTRAINT [pk_tax_registration] PRIMARY KEY CLUSTERED 
(
	[tax_reg_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_tax_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[tax_type] ADD  CONSTRAINT [pk_tax_type] PRIMARY KEY CLUSTERED 
(
	[tax_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_trade_repository]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[trade_repository] ADD  CONSTRAINT [pk_trade_repository] PRIMARY KEY CLUSTERED 
(
	[repository_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_trader]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[trader] ADD  CONSTRAINT [pk_trader] PRIMARY KEY CLUSTERED 
(
	[trader_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_transmission_right_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transmission_right_type] ADD  CONSTRAINT [pk_transmission_right_type] PRIMARY KEY CLUSTERED 
(
	[right_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_transmission_zone]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transmission_zone] ADD  CONSTRAINT [pk_transmission_zone] PRIMARY KEY CLUSTERED 
(
	[zone_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_tdt]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transport_document_type] ADD  CONSTRAINT [pk_tdt] PRIMARY KEY CLUSTERED 
(
	[doc_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_transport_operator]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transport_operator] ADD  CONSTRAINT [pk_transport_operator] PRIMARY KEY CLUSTERED 
(
	[operator_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_transport_route]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transport_route] ADD  CONSTRAINT [pk_transport_route] PRIMARY KEY CLUSTERED 
(
	[route_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_truck]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[truck] ADD  CONSTRAINT [pk_truck] PRIMARY KEY CLUSTERED 
(
	[truck_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_uom]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[unit_of_measure] ADD  CONSTRAINT [pk_uom] PRIMARY KEY CLUSTERED 
(
	[uom_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_uom_conversion]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[uom_conversion] ADD  CONSTRAINT [pk_uom_conversion] PRIMARY KEY CLUSTERED 
(
	[conversion_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_uom_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[uom_type] ADD  CONSTRAINT [pk_uom_type] PRIMARY KEY CLUSTERED 
(
	[uom_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_user_role]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[user_role] ADD  CONSTRAINT [pk_user_role] PRIMARY KEY CLUSTERED 
(
	[role_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_valuation_frequency_type]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[valuation_frequency_type] ADD  CONSTRAINT [pk_valuation_frequency_type] PRIMARY KEY CLUSTERED 
(
	[valuation_frequency_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_vessel]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[vessel] ADD  CONSTRAINT [pk_vessel] PRIMARY KEY CLUSTERED 
(
	[vessel_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [pk_vessel_cert]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[vessel_certificate] ADD  CONSTRAINT [pk_vessel_cert] PRIMARY KEY CLUSTERED 
(
	[cert_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_address_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_address_entity] ON [dbo].[address]
(
	[entity_type] ASC,
	[entity_id] ASC,
	[address_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_address_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[address_type] ADD  CONSTRAINT [uq_address_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_address_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_address_type_active] ON [dbo].[address_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_acyl_commodity_country_year]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[agri_crop_year_lifecycle] ADD  CONSTRAINT [uq_acyl_commodity_country_year] UNIQUE NONCLUSTERED 
(
	[commodity_id] ASC,
	[country_id] ASC,
	[crop_year_label] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_acyl_commodity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_acyl_commodity] ON [dbo].[agri_crop_year_lifecycle]
(
	[commodity_id] ASC,
	[country_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_amds_grade_range]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[agri_moisture_discount_scale] ADD  CONSTRAINT [uq_amds_grade_range] UNIQUE NONCLUSTERED 
(
	[grade_standard_id] ASC,
	[moisture_pct_min] ASC,
	[moisture_pct_max] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_amds_grade]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_amds_grade] ON [dbo].[agri_moisture_discount_scale]
(
	[grade_standard_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_user_email]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[app_user] ADD  CONSTRAINT [uq_user_email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_user_username]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[app_user] ADD  CONSTRAINT [uq_user_username] UNIQUE NONCLUSTERED 
(
	[username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ba_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[balancing_authority] ADD  CONSTRAINT [uq_ba_code] UNIQUE NONCLUSTERED 
(
	[ba_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_balmo_product_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[balmo_product] ADD  CONSTRAINT [uq_balmo_product_code] UNIQUE NONCLUSTERED 
(
	[product_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_balmo_prod_code]    Script Date: 7/12/26 1:03:59PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [ix_balmo_prod_code] ON [dbo].[balmo_product]
(
	[product_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_balmo_prod_month]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_balmo_prod_month] ON [dbo].[balmo_product]
(
	[contract_month] ASC,
	[exchange] ASC,
	[contract_series] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_balmo_prod_status]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_balmo_prod_status] ON [dbo].[balmo_product]
(
	[status] ASC
)
WHERE ([status]='ACTIVE')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_bank_acct_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_bank_acct_entity] ON [dbo].[bank_account]
(
	[entity_type] ASC,
	[entity_id] ASC,
	[account_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_bank_account_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[bank_account_type] ADD  CONSTRAINT [uq_bank_account_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_bank_account_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_bank_account_type_active] ON [dbo].[bank_account_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_bg_number]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[bank_guarantee] ADD  CONSTRAINT [uq_bg_number] UNIQUE NONCLUSTERED 
(
	[bg_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_bg_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_bg_entity] ON [dbo].[bank_guarantee]
(
	[principal_entity_id] ASC,
	[bg_status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_bg_status]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_bg_status] ON [dbo].[bank_guarantee]
(
	[bg_status] ASC,
	[expiry_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_bolmo_reference]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[bolmo_agreement] ADD  CONSTRAINT [uq_bolmo_reference] UNIQUE NONCLUSTERED 
(
	[bolmo_reference] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_bolmo_cp]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_bolmo_cp] ON [dbo].[bolmo_agreement]
(
	[counterparty_id] ASC,
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_bolmo_ref]    Script Date: 7/12/26 1:03:59PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [ix_bolmo_ref] ON [dbo].[bolmo_agreement]
(
	[bolmo_reference] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_book_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[book] ADD  CONSTRAINT [uq_book_code] UNIQUE NONCLUSTERED 
(
	[book_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_book_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_book_entity] ON [dbo].[book]
(
	[legal_entity_id] ASC,
	[commodity_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_book_trader]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_book_trader] ON [dbo].[book]
(
	[responsible_trader_id] ASC
)
INCLUDE ( 	[book_code],
	[is_active]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_book_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[book_type] ADD  CONSTRAINT [uq_book_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_book_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_book_type_active] ON [dbo].[book_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_broker_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[broker] ADD  CONSTRAINT [uq_broker_code] UNIQUE NONCLUSTERED 
(
	[broker_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_bfa_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[broker_fee_agreement] ADD  CONSTRAINT [uq_bfa_code] UNIQUE NONCLUSTERED 
(
	[agreement_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_bfa_broker_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_bfa_broker_active] ON [dbo].[broker_fee_agreement]
(
	[broker_id] ASC,
	[is_active] ASC,
	[effective_from] ASC,
	[effective_to] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_bfa_commodity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_bfa_commodity] ON [dbo].[broker_fee_agreement]
(
	[commodity_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__carbon_r__EC0D591B1C5F8CB1]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[carbon_registry] ADD UNIQUE NONCLUSTERED 
(
	[registry_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__carbon_r__EC0D591B57BEBFF9]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[carbon_registry] ADD UNIQUE NONCLUSTERED 
(
	[registry_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_carbon_registry_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[carbon_registry_type] ADD  CONSTRAINT [uq_carbon_registry_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_carbon_registry_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_carbon_registry_type_active] ON [dbo].[carbon_registry_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_cpt_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[charter_party_type] ADD  CONSTRAINT [uq_cpt_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_coll_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_coll_entity] ON [dbo].[collateral]
(
	[legal_entity_id] ASC,
	[direction] ASC,
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_coll_expiry]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_coll_expiry] ON [dbo].[collateral]
(
	[maturity_date] ASC,
	[status] ASC
)
WHERE ([maturity_date] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_coll_secured]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_coll_secured] ON [dbo].[collateral]
(
	[secured_entity_type] ASC,
	[secured_entity_id] ASC,
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ct_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[collateral_type] ADD  CONSTRAINT [uq_ct_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_commodity_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[commodity] ADD  CONSTRAINT [uq_commodity_code] UNIQUE NONCLUSTERED 
(
	[commodity_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_commodity_family_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[commodity_family] ADD  CONSTRAINT [uq_commodity_family_code] UNIQUE NONCLUSTERED 
(
	[family_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_commodity_family_commodity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_commodity_family_commodity] ON [dbo].[commodity_family]
(
	[commodity_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_cgs_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[commodity_grade_standard] ADD  CONSTRAINT [uq_cgs_code] UNIQUE NONCLUSTERED 
(
	[product_id] ASC,
	[grade_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_cgs_product]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_cgs_product] ON [dbo].[commodity_grade_standard]
(
	[product_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_commodity_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[commodity_type] ADD  CONSTRAINT [uq_commodity_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_commodity_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_commodity_type_active] ON [dbo].[commodity_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_contact_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_contact_entity] ON [dbo].[contact]
(
	[entity_type] ASC,
	[entity_id] ASC,
	[contact_role] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_contact_role_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[contact_role] ADD  CONSTRAINT [uq_contact_role_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_contact_role_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_contact_role_active] ON [dbo].[contact_role]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_container_number]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[container] ADD  CONSTRAINT [uq_container_number] UNIQUE NONCLUSTERED 
(
	[container_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_cp_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[counterparty] ADD  CONSTRAINT [uq_cp_code] UNIQUE NONCLUSTERED 
(
	[cp_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_cp_lei]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[counterparty] ADD  CONSTRAINT [uq_cp_lei] UNIQUE NONCLUSTERED 
(
	[lei_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_cp_jurisdiction]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_cp_jurisdiction] ON [dbo].[counterparty]
(
	[jurisdiction_id] ASC
)
INCLUDE ( 	[cp_code],
	[legal_name]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_cp_kyc]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_cp_kyc] ON [dbo].[counterparty]
(
	[kyc_status] ASC,
	[is_active] ASC
)
INCLUDE ( 	[cp_code],
	[kyc_expiry_date]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_cp_type]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_cp_type] ON [dbo].[counterparty]
(
	[cp_type] ASC,
	[is_active] ASC
)
INCLUDE ( 	[cp_code],
	[legal_name]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_counterparty_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[counterparty_type] ADD  CONSTRAINT [uq_counterparty_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_counterparty_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_counterparty_type_active] ON [dbo].[counterparty_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_country_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[country] ADD  CONSTRAINT [uq_country_code] UNIQUE NONCLUSTERED 
(
	[country_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_country_region]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_country_region] ON [dbo].[country]
(
	[region] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_cp_comm_terms]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[cp_commercial_terms] ADD  CONSTRAINT [uq_cp_comm_terms] UNIQUE NONCLUSTERED 
(
	[counterparty_id] ASC,
	[legal_entity_id] ASC,
	[commodity_type] ASC,
	[effective_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_cp_gtc]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[cp_gtc_agreement] ADD  CONSTRAINT [uq_cp_gtc] UNIQUE NONCLUSTERED 
(
	[counterparty_id] ASC,
	[legal_entity_id] ASC,
	[gtc_version_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [IX_credit_limit_cp_type]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [IX_credit_limit_cp_type] ON [dbo].[credit_limit]
(
	[counterparty_id] ASC,
	[limit_type] ASC,
	[status] ASC
)
INCLUDE ( 	[limit_amount],
	[used_amount],
	[limit_currency_id]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_credit_limit_status_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[credit_limit_status_type] ADD  CONSTRAINT [uq_credit_limit_status_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_credit_limit_status_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_credit_limit_status_type_active] ON [dbo].[credit_limit_status_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_credit_limit_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[credit_limit_type] ADD  CONSTRAINT [uq_credit_limit_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_credit_limit_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_credit_limit_type_active] ON [dbo].[credit_limit_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_credit_agency_rtg]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[credit_rating] ADD  CONSTRAINT [uq_credit_agency_rtg] UNIQUE NONCLUSTERED 
(
	[agency] ASC,
	[rating] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_credit_term_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[credit_term] ADD  CONSTRAINT [uq_credit_term_code] UNIQUE NONCLUSTERED 
(
	[term_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_currency_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[currency] ADD  CONSTRAINT [uq_currency_code] UNIQUE NONCLUSTERED 
(
	[currency_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_deal_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[deal_type] ADD  CONSTRAINT [uq_deal_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_deal_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_deal_type_active] ON [dbo].[deal_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_ddr_vessel_type]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_ddr_vessel_type] ON [dbo].[demurrage_dispatch_rate]
(
	[vessel_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_desk_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[desk] ADD  CONSTRAINT [uq_desk_code] UNIQUE NONCLUSTERED 
(
	[desk_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_doc_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_doc_entity] ON [dbo].[document_store]
(
	[entity_type] ASC,
	[entity_id] ASC,
	[document_type] ASC,
	[is_current] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_obligation]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[emission_obligation] ADD  CONSTRAINT [uq_obligation] UNIQUE NONCLUSTERED 
(
	[legal_entity_id] ASC,
	[scheme_id] ASC,
	[obligation_year] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_emission_obligation_status_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[emission_obligation_status] ADD  CONSTRAINT [uq_emission_obligation_status_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_emission_obligation_status_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_emission_obligation_status_active] ON [dbo].[emission_obligation_status]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__emission__AF6EE73F5668B6ED]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[emission_scheme] ADD UNIQUE NONCLUSTERED 
(
	[scheme_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__emission__AF6EE73FAE9EE837]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[emission_scheme] ADD UNIQUE NONCLUSTERED 
(
	[scheme_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_emission_scheme_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[emission_scheme_type] ADD  CONSTRAINT [uq_emission_scheme_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_emission_scheme_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_emission_scheme_type_active] ON [dbo].[emission_scheme_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ef_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[energy_footprint] ADD  CONSTRAINT [uq_ef_code] UNIQUE NONCLUSTERED 
(
	[footprint_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_ef_type]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_ef_type] ON [dbo].[energy_footprint]
(
	[footprint_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_efs_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[energy_footprint_site] ADD  CONSTRAINT [uq_efs_code] UNIQUE NONCLUSTERED 
(
	[energy_footprint_id] ASC,
	[site_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_efs_footprint]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_efs_footprint] ON [dbo].[energy_footprint_site]
(
	[energy_footprint_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__environm__AE1A8CC448268F62]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[environmental_product] ADD UNIQUE NONCLUSTERED 
(
	[product_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__environm__AE1A8CC4B26115D9]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[environmental_product] ADD UNIQUE NONCLUSTERED 
(
	[product_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_environmental_product_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[environmental_product_type] ADD  CONSTRAINT [uq_environmental_product_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_environmental_product_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_environmental_product_type_active] ON [dbo].[environmental_product_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_event_category_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[event_category] ADD  CONSTRAINT [uq_event_category_code] UNIQUE NONCLUSTERED 
(
	[category_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_event_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[event_type] ADD  CONSTRAINT [uq_event_code] UNIQUE NONCLUSTERED 
(
	[event_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_et_category]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_et_category] ON [dbo].[event_type]
(
	[category_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_et_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_et_entity] ON [dbo].[event_type]
(
	[entity_type] ASC,
	[severity] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_exchange_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[exchange] ADD  CONSTRAINT [uq_exchange_code] UNIQUE NONCLUSTERED 
(
	[exchange_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_exchange_country]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_exchange_country] ON [dbo].[exchange]
(
	[country_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_exchange_mic]    Script Date: 7/12/26 1:03:59PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [uq_exchange_mic] ON [dbo].[exchange]
(
	[mic_code] ASC
)
WHERE ([mic_code] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_es_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[external_system] ADD  CONSTRAINT [uq_es_code] UNIQUE NONCLUSTERED 
(
	[system_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_fpp_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[field_permission_profile] ADD  CONSTRAINT [uq_fpp_code] UNIQUE NONCLUSTERED 
(
	[profile_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_fpr_profile_field]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[field_permission_rule] ADD  CONSTRAINT [uq_fpr_profile_field] UNIQUE NONCLUSTERED 
(
	[profile_id] ASC,
	[field_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ft_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[formula_template] ADD  CONSTRAINT [uq_ft_code] UNIQUE NONCLUSTERED 
(
	[template_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_fri_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[freight_rate_index] ADD  CONSTRAINT [uq_fri_code] UNIQUE NONCLUSTERED 
(
	[index_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_fx_period_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[fx_period] ADD  CONSTRAINT [uq_fx_period_code] UNIQUE NONCLUSTERED 
(
	[period_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_fx_period_offset]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_fx_period_offset] ON [dbo].[fx_period]
(
	[period_type] ASC,
	[days_offset] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_fx_rate]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[fx_rate] ADD  CONSTRAINT [uq_fx_rate] UNIQUE NONCLUSTERED 
(
	[from_currency_id] ASC,
	[to_currency_id] ASC,
	[rate_date] ASC,
	[fx_period_id] ASC,
	[rate_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_fx_rate_date]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_fx_rate_date] ON [dbo].[fx_rate]
(
	[rate_date] ASC,
	[from_currency_id] ASC,
	[to_currency_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_fx_rate_valuation_lookup]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_fx_rate_valuation_lookup] ON [dbo].[fx_rate]
(
	[from_currency_id] ASC,
	[to_currency_id] ASC,
	[rate_date] ASC,
	[fx_period_id] ASC
)
INCLUDE ( 	[maturity_date],
	[rate],
	[rate_value_type]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ga_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[generation_asset] ADD  CONSTRAINT [uq_ga_code] UNIQUE NONCLUSTERED 
(
	[asset_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_ga_zone]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_ga_zone] ON [dbo].[generation_asset]
(
	[zone_id] ASC,
	[fuel_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__gl_accou__5C3BE50F9FE479A1]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[gl_account] ADD UNIQUE NONCLUSTERED 
(
	[account_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__gl_accou__5C3BE50FD75FBB60]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[gl_account] ADD UNIQUE NONCLUSTERED 
(
	[account_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_governing_law_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[governing_law_type] ADD  CONSTRAINT [uq_governing_law_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_governing_law_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_governing_law_type_active] ON [dbo].[governing_law_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_gtc_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[gtc] ADD  CONSTRAINT [uq_gtc_code] UNIQUE NONCLUSTERED 
(
	[gtc_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_gtc_version]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[gtc_version] ADD  CONSTRAINT [uq_gtc_version] UNIQUE NONCLUSTERED 
(
	[gtc_id] ASC,
	[version_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_holiday_cal_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[holiday_calendar] ADD  CONSTRAINT [uq_holiday_cal_code] UNIQUE NONCLUSTERED 
(
	[calendar_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_incoterm_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[incoterm] ADD  CONSTRAINT [uq_incoterm_code] UNIQUE NONCLUSTERED 
(
	[code] ASC,
	[version_year] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_insp_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[inspection_type] ADD  CONSTRAINT [uq_insp_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_policy_number]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[insurance_policy] ADD  CONSTRAINT [uq_policy_number] UNIQUE NONCLUSTERED 
(
	[provider_id] ASC,
	[policy_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_ipol_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_ipol_entity] ON [dbo].[insurance_policy]
(
	[legal_entity_id] ASC,
	[policy_type] ASC,
	[policy_status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_ipol_expiry]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_ipol_expiry] ON [dbo].[insurance_policy]
(
	[expiry_date] ASC,
	[policy_status] ASC
)
WHERE ([expiry_date] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ip_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[insurance_provider] ADD  CONSTRAINT [uq_ip_code] UNIQUE NONCLUSTERED 
(
	[provider_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_itr_source_dest]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[intercompany_transfer_rule] ADD  CONSTRAINT [uq_itr_source_dest] UNIQUE NONCLUSTERED 
(
	[source_legal_entity_id] ASC,
	[destination_legal_entity_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_itr_source]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_itr_source] ON [dbo].[intercompany_transfer_rule]
(
	[source_legal_entity_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ic_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[interconnector] ADD  CONSTRAINT [uq_ic_code] UNIQUE NONCLUSTERED 
(
	[interconnector_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_ic_zones]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_ic_zones] ON [dbo].[interconnector]
(
	[from_zone_id] ASC,
	[to_zone_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_iri_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[interest_rate_index] ADD  CONSTRAINT [uq_iri_code] UNIQUE NONCLUSTERED 
(
	[index_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_kyc_status_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[kyc_status] ADD  CONSTRAINT [uq_kyc_status_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_kyc_status_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_kyc_status_active] ON [dbo].[kyc_status]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_let_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[laytime_exception_type] ADD  CONSTRAINT [uq_let_code] UNIQUE NONCLUSTERED 
(
	[exception_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ltt_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[laytime_term_template] ADD  CONSTRAINT [uq_ltt_code] UNIQUE NONCLUSTERED 
(
	[term_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_lc_status_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lc_status_type] ADD  CONSTRAINT [uq_lc_status_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_lc_status_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_lc_status_type_active] ON [dbo].[lc_status_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_lc_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lc_type] ADD  CONSTRAINT [uq_lc_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_lc_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_lc_type_active] ON [dbo].[lc_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_legal_entity_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[legal_entity] ADD  CONSTRAINT [uq_legal_entity_code] UNIQUE NONCLUSTERED 
(
	[entity_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_legal_entity_lei]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[legal_entity] ADD  CONSTRAINT [uq_legal_entity_lei] UNIQUE NONCLUSTERED 
(
	[lei_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_legal_entity_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[legal_entity_type] ADD  CONSTRAINT [uq_legal_entity_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_legal_entity_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_legal_entity_type_active] ON [dbo].[legal_entity_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_lc_reference]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[letter_of_credit] ADD  CONSTRAINT [uq_lc_reference] UNIQUE NONCLUSTERED 
(
	[lc_reference] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [IX_lc_cp_status]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [IX_lc_cp_status] ON [dbo].[letter_of_credit]
(
	[counterparty_id] ASC,
	[status] ASC
)
INCLUDE ( 	[lc_amount],
	[drawdown_amount],
	[expiry_date]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [IX_lc_expiry]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [IX_lc_expiry] ON [dbo].[letter_of_credit]
(
	[expiry_date] ASC,
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_lbor_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lng_boil_off_rule] ADD  CONSTRAINT [uq_lbor_code] UNIQUE NONCLUSTERED 
(
	[rule_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_lbor_facility]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_lbor_facility] ON [dbo].[lng_boil_off_rule]
(
	[facility_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_lbor_vessel]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_lbor_vessel] ON [dbo].[lng_boil_off_rule]
(
	[vessel_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_ltd_facility]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lng_terminal_detail] ADD  CONSTRAINT [uq_ltd_facility] UNIQUE NONCLUSTERED 
(
	[facility_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_lsc_parent_child]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[load_shape_component] ADD  CONSTRAINT [uq_lsc_parent_child] UNIQUE NONCLUSTERED 
(
	[parent_load_shape_id] ASC,
	[child_load_shape_id] ASC,
	[sequence_no] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_lsc_parent]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_lsc_parent] ON [dbo].[load_shape_component]
(
	[parent_load_shape_id] ASC,
	[sequence_no] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_lsi_shape_day_interval]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[load_shape_interval] ADD  CONSTRAINT [uq_lsi_shape_day_interval] UNIQUE NONCLUSTERED 
(
	[load_shape_id] ASC,
	[day_type] ASC,
	[interval_no] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_lsi_shape]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_lsi_shape] ON [dbo].[load_shape_interval]
(
	[load_shape_id] ASC,
	[day_type] ASC,
	[interval_no] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_lst_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[load_shape_template] ADD  CONSTRAINT [uq_lst_code] UNIQUE NONCLUSTERED 
(
	[shape_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_location_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[location] ADD  CONSTRAINT [uq_location_code] UNIQUE NONCLUSTERED 
(
	[location_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_location_commodity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_location_commodity] ON [dbo].[location]
(
	[commodity_type] ASC,
	[country_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_location_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[location_type] ADD  CONSTRAINT [uq_location_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_lookup_category_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lookup_category] ADD  CONSTRAINT [uq_lookup_category_code] UNIQUE NONCLUSTERED 
(
	[category_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_lookup_category_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_lookup_category_active] ON [dbo].[lookup_category]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_lookup_cat_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[lookup_value] ADD  CONSTRAINT [uq_lookup_cat_code] UNIQUE NONCLUSTERED 
(
	[category_id] ASC,
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_lookup_value_category]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_lookup_value_category] ON [dbo].[lookup_value]
(
	[category_id] ASC,
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ma]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[margin_account] ADD  CONSTRAINT [uq_ma] UNIQUE NONCLUSTERED 
(
	[legal_entity_id] ASC,
	[market_id] ASC,
	[account_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_margin_agreement_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[margin_agreement] ADD  CONSTRAINT [uq_margin_agreement_code] UNIQUE NONCLUSTERED 
(
	[agreement_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [IX_margin_agreement_cp]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [IX_margin_agreement_cp] ON [dbo].[margin_agreement]
(
	[counterparty_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_margin_agreement_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[margin_agreement_type] ADD  CONSTRAINT [uq_margin_agreement_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_margin_agreement_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_margin_agreement_type_active] ON [dbo].[margin_agreement_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_market_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[market] ADD  CONSTRAINT [uq_market_code] UNIQUE NONCLUSTERED 
(
	[market_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_market_commodity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_market_commodity] ON [dbo].[market]
(
	[commodity_id] ASC,
	[market_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_market_exchange]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_market_exchange] ON [dbo].[market]
(
	[exchange_id] ASC,
	[is_active] ASC
)
WHERE ([exchange_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_marc_product_element]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[metal_assay_component_rule] ADD  CONSTRAINT [uq_marc_product_element] UNIQUE NONCLUSTERED 
(
	[product_id] ASC,
	[element_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_marc_product]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_marc_product] ON [dbo].[metal_assay_component_rule]
(
	[product_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_mb_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[metal_brand] ADD  CONSTRAINT [uq_mb_code] UNIQUE NONCLUSTERED 
(
	[commodity_family_id] ASC,
	[brand_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_mb_family]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_mb_family] ON [dbo].[metal_brand]
(
	[commodity_family_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_metal_shape_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[metal_shape] ADD  CONSTRAINT [uq_metal_shape_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_metal_shape_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_metal_shape_active] ON [dbo].[metal_shape]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_metal_warrant_num]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[metal_warrant] ADD  CONSTRAINT [uq_metal_warrant_num] UNIQUE NONCLUSTERED 
(
	[warrant_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_mw_facility]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_mw_facility] ON [dbo].[metal_warrant]
(
	[facility_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_mw_holder]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_mw_holder] ON [dbo].[metal_warrant]
(
	[holder_counterparty_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_mot_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[mot_type] ADD  CONSTRAINT [uq_mot_code] UNIQUE NONCLUSTERED 
(
	[mot_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_netting]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[netting_agreement] ADD  CONSTRAINT [uq_netting] UNIQUE NONCLUSTERED 
(
	[legal_entity_id] ASC,
	[counterparty_id] ASC,
	[agreement_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_netting_agreement_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[netting_agreement_type] ADD  CONSTRAINT [uq_netting_agreement_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_netting_agreement_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_netting_agreement_type_active] ON [dbo].[netting_agreement_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pcg_reference]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[parent_company_guarantee] ADD  CONSTRAINT [uq_pcg_reference] UNIQUE NONCLUSTERED 
(
	[pcg_reference] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_pcg_beneficiary]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pcg_beneficiary] ON [dbo].[parent_company_guarantee]
(
	[beneficiary_entity_type] ASC,
	[beneficiary_entity_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_pcg_guarantor]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pcg_guarantor] ON [dbo].[parent_company_guarantee]
(
	[guarantor_entity_type] ASC,
	[guarantor_entity_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_pcg_principal]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pcg_principal] ON [dbo].[parent_company_guarantee]
(
	[principal_entity_type] ASC,
	[principal_entity_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_pcg_status]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pcg_status] ON [dbo].[parent_company_guarantee]
(
	[pcg_status] ASC,
	[expiry_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_pca_term_ccy_loc]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[payment_calendar_assignment] ADD  CONSTRAINT [uq_pca_term_ccy_loc] UNIQUE NONCLUSTERED 
(
	[payment_term_id] ASC,
	[currency_id] ASC,
	[location_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pca_term_ccy]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pca_term_ccy] ON [dbo].[payment_calendar_assignment]
(
	[payment_term_id] ASC,
	[currency_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_payment_method_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[payment_method] ADD  CONSTRAINT [uq_payment_method_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_payment_method_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_payment_method_active] ON [dbo].[payment_method]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_payment_term_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[payment_term] ADD  CONSTRAINT [uq_payment_term_code] UNIQUE NONCLUSTERED 
(
	[term_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_period_code_comm]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[period] ADD  CONSTRAINT [uq_period_code_comm] UNIQUE NONCLUSTERED 
(
	[period_code] ASC,
	[commodity_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_period_comm_type]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_period_comm_type] ON [dbo].[period]
(
	[commodity_type] ASC,
	[period_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_period_dates]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_period_dates] ON [dbo].[period]
(
	[period_start] ASC,
	[period_end] ASC,
	[commodity_type] ASC
)
WHERE ([period_start] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_period_risk]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_period_risk] ON [dbo].[period]
(
	[is_risk_period] ASC,
	[commodity_type] ASC,
	[is_active] ASC
)
WHERE ([is_risk_period]=(1))
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_period_rolling]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_period_rolling] ON [dbo].[period]
(
	[is_rolling] ASC,
	[commodity_type] ASC,
	[is_active] ASC
)
WHERE ([is_rolling]=(1))
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_period_trading]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_period_trading] ON [dbo].[period]
(
	[is_trading_period] ASC,
	[commodity_type] ASC,
	[is_active] ASC
)
WHERE ([is_trading_period]=(1))
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pipeline_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline] ADD  CONSTRAINT [uq_pipeline_code] UNIQUE NONCLUSTERED 
(
	[pipeline_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pc_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline_cycle] ADD  CONSTRAINT [uq_pc_code] UNIQUE NONCLUSTERED 
(
	[pipeline_id] ASC,
	[cycle_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_pc_pipeline]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pc_pipeline] ON [dbo].[pipeline_cycle]
(
	[pipeline_id] ASC,
	[cycle_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pc_product]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pc_product] ON [dbo].[pipeline_cycle]
(
	[product_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pp_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline_point] ADD  CONSTRAINT [uq_pp_code] UNIQUE NONCLUSTERED 
(
	[pipeline_id] ASC,
	[point_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pp_location]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pp_location] ON [dbo].[pipeline_point]
(
	[location_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_pp_pipeline]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pp_pipeline] ON [dbo].[pipeline_point]
(
	[pipeline_id] ASC,
	[point_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ps_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline_segment] ADD  CONSTRAINT [uq_ps_code] UNIQUE NONCLUSTERED 
(
	[pipeline_id] ASC,
	[segment_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pt]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pipeline_tariff] ADD  CONSTRAINT [uq_pt] UNIQUE NONCLUSTERED 
(
	[pipeline_id] ASC,
	[from_point_id] ASC,
	[to_point_id] ASC,
	[tariff_type] ASC,
	[capacity_type] ASC,
	[effective_from] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_past_ba_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[power_ancillary_service_type] ADD  CONSTRAINT [uq_past_ba_code] UNIQUE NONCLUSTERED 
(
	[balancing_authority_id] ASC,
	[service_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_past_ba]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_past_ba] ON [dbo].[power_ancillary_service_type]
(
	[balancing_authority_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pnode_ba_name]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[power_pnode] ADD  CONSTRAINT [uq_pnode_ba_name] UNIQUE NONCLUSTERED 
(
	[balancing_authority_id] ASC,
	[pnode_market_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pnode_ba]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pnode_ba] ON [dbo].[power_pnode]
(
	[balancing_authority_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_ppd_product]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[power_product_detail] ADD  CONSTRAINT [uq_ppd_product] UNIQUE NONCLUSTERED 
(
	[product_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_price_index_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[price_index] ADD  CONSTRAINT [uq_price_index_code] UNIQUE NONCLUSTERED 
(
	[index_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pis]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[price_index_source] ADD  CONSTRAINT [uq_pis] UNIQUE NONCLUSTERED 
(
	[price_index_id] ASC,
	[price_source_id] ASC,
	[source_role] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_pis_index]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pis_index] ON [dbo].[price_index_source]
(
	[price_index_id] ASC,
	[is_active] ASC,
	[source_role] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pis_source]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pis_source] ON [dbo].[price_index_source]
(
	[price_source_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_price_source_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[price_source] ADD  CONSTRAINT [uq_price_source_code] UNIQUE NONCLUSTERED 
(
	[source_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pr_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pricing_rule] ADD  CONSTRAINT [uq_pr_code] UNIQUE NONCLUSTERED 
(
	[rule_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pr_incoterm]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pr_incoterm] ON [dbo].[pricing_rule]
(
	[incoterm_id] ASC,
	[is_active] ASC
)
WHERE ([incoterm_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pr_index]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pr_index] ON [dbo].[pricing_rule]
(
	[price_index_id] ASC,
	[is_active] ASC
)
WHERE ([price_index_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pr_market]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pr_market] ON [dbo].[pricing_rule]
(
	[market_id] ASC,
	[is_active] ASC
)
WHERE ([market_id] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pr_product]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pr_product] ON [dbo].[pricing_rule]
(
	[product_id] ASC,
	[is_active] ASC,
	[is_default] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_ptet_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pricing_trigger_event_type] ADD  CONSTRAINT [uq_ptet_code] UNIQUE NONCLUSTERED 
(
	[trigger_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_ptet_category]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_ptet_category] ON [dbo].[pricing_trigger_event_type]
(
	[trigger_category] ASC,
	[is_active] ASC
)
INCLUDE ( 	[trigger_code],
	[trigger_name]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pricing_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pricing_type] ADD  CONSTRAINT [uq_pricing_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pwr_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[pricing_window_rule] ADD  CONSTRAINT [uq_pwr_code] UNIQUE NONCLUSTERED 
(
	[rule_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_pwr_commodity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pwr_commodity] ON [dbo].[pricing_window_rule]
(
	[commodity_type] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_product_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[product] ADD  CONSTRAINT [uq_product_code] UNIQUE NONCLUSTERED 
(
	[product_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_product_commodity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_product_commodity] ON [dbo].[product]
(
	[commodity_id] ASC,
	[is_active] ASC
)
INCLUDE ( 	[product_code],
	[product_name]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_pst_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[product_spec_template] ADD  CONSTRAINT [uq_pst_code] UNIQUE NONCLUSTERED 
(
	[product_id] ASC,
	[template_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_pst_product]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_pst_product] ON [dbo].[product_spec_template]
(
	[product_id] ASC,
	[is_default] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_railcar_number]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[railcar] ADD  CONSTRAINT [uq_railcar_number] UNIQUE NONCLUSTERED 
(
	[car_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_ro]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[regulatory_obligation] ADD  CONSTRAINT [uq_ro] UNIQUE NONCLUSTERED 
(
	[legal_entity_id] ASC,
	[report_type_id] ASC,
	[effective_from] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_ro_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_ro_entity] ON [dbo].[regulatory_obligation]
(
	[legal_entity_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_rrt_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[regulatory_report_type] ADD  CONSTRAINT [uq_rrt_code] UNIQUE NONCLUSTERED 
(
	[report_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_reporting_group_name]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[reporting_group] ADD  CONSTRAINT [uq_reporting_group_name] UNIQUE NONCLUSTERED 
(
	[classification_type_id] ASC,
	[group_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_reporting_group_type]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_reporting_group_type] ON [dbo].[reporting_group]
(
	[classification_type_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__rin_acco__5C3BE50F989DC33E]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[rin_account] ADD UNIQUE NONCLUSTERED 
(
	[account_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__rin_acco__5C3BE50FE523B22E]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[rin_account] ADD UNIQUE NONCLUSTERED 
(
	[account_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__rin_fuel__26A172797704B8CA]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[rin_fuel_category] ADD UNIQUE NONCLUSTERED 
(
	[d_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [UQ__rin_fuel__26A17279C752B57A]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[rin_fuel_category] ADD UNIQUE NONCLUSTERED 
(
	[d_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_rin_obligation]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[rin_obligation] ADD  CONSTRAINT [uq_rin_obligation] UNIQUE NONCLUSTERED 
(
	[legal_entity_id] ASC,
	[compliance_year] ASC,
	[d_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_sfr_key]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[screen_field_registry] ADD  CONSTRAINT [uq_sfr_key] UNIQUE NONCLUSTERED 
(
	[screen_code] ASC,
	[field_key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_settlement_cal]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[settlement_calendar] ADD  CONSTRAINT [uq_settlement_cal] UNIQUE NONCLUSTERED 
(
	[product_id] ASC,
	[calendar_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_settlement_price]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[settlement_price] ADD  CONSTRAINT [uq_settlement_price] UNIQUE NONCLUSTERED 
(
	[exchange] ASC,
	[contract_ticker] ASC,
	[settle_date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_sp_exchange_date]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_sp_exchange_date] ON [dbo].[settlement_price]
(
	[exchange] ASC,
	[settle_date] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_sp_ticker_date]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_sp_ticker_date] ON [dbo].[settlement_price]
(
	[contract_ticker] ASC,
	[settle_date] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_settlement_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[settlement_type] ADD  CONSTRAINT [uq_settlement_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_settlement_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_settlement_type_active] ON [dbo].[settlement_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_facility_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[storage_facility] ADD  CONSTRAINT [uq_facility_code] UNIQUE NONCLUSTERED 
(
	[facility_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_storage_facility_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[storage_facility_type] ADD  CONSTRAINT [uq_storage_facility_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_storage_facility_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_storage_facility_type_active] ON [dbo].[storage_facility_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_tank_number]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[tank] ADD  CONSTRAINT [uq_tank_number] UNIQUE NONCLUSTERED 
(
	[facility_id] ASC,
	[tank_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_tank_commodity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_tank_commodity] ON [dbo].[tank]
(
	[commodity_type] ASC,
	[tank_status] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_tank_facility]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_tank_facility] ON [dbo].[tank]
(
	[facility_id] ASC,
	[tank_status] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_tax_reg]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[tax_registration] ADD  CONSTRAINT [uq_tax_reg] UNIQUE NONCLUSTERED 
(
	[entity_type] ASC,
	[entity_id] ASC,
	[tax_type] ASC,
	[jurisdiction_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_tax_reg_entity]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_tax_reg_entity] ON [dbo].[tax_registration]
(
	[entity_type] ASC,
	[entity_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_tax_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[tax_type] ADD  CONSTRAINT [uq_tax_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_tax_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_tax_type_active] ON [dbo].[tax_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_tr_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[trade_repository] ADD  CONSTRAINT [uq_tr_code] UNIQUE NONCLUSTERED 
(
	[repository_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_trader_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[trader] ADD  CONSTRAINT [uq_trader_code] UNIQUE NONCLUSTERED 
(
	[trader_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [uq_trader_user]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[trader] ADD  CONSTRAINT [uq_trader_user] UNIQUE NONCLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_trt_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transmission_right_type] ADD  CONSTRAINT [uq_trt_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_tz_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transmission_zone] ADD  CONSTRAINT [uq_tz_code] UNIQUE NONCLUSTERED 
(
	[balancing_authority_id] ASC,
	[zone_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_tz_ba]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_tz_ba] ON [dbo].[transmission_zone]
(
	[balancing_authority_id] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_tdt_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transport_document_type] ADD  CONSTRAINT [uq_tdt_code] UNIQUE NONCLUSTERED 
(
	[doc_type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_operator_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transport_operator] ADD  CONSTRAINT [uq_operator_code] UNIQUE NONCLUSTERED 
(
	[operator_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_route_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[transport_route] ADD  CONSTRAINT [uq_route_code] UNIQUE NONCLUSTERED 
(
	[route_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_tr_route]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_tr_route] ON [dbo].[transport_route]
(
	[origin_location_id] ASC,
	[dest_location_id] ASC,
	[mot_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_truck_reg]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[truck] ADD  CONSTRAINT [uq_truck_reg] UNIQUE NONCLUSTERED 
(
	[registration_no] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_uom_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[unit_of_measure] ADD  CONSTRAINT [uq_uom_code] UNIQUE NONCLUSTERED 
(
	[uom_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_uom_conversion]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[uom_conversion] ADD  CONSTRAINT [uq_uom_conversion] UNIQUE NONCLUSTERED 
(
	[from_uom_id] ASC,
	[to_uom_id] ASC,
	[commodity_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_uom_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[uom_type] ADD  CONSTRAINT [uq_uom_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_uom_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_uom_type_active] ON [dbo].[uom_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_user_role_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[user_role] ADD  CONSTRAINT [uq_user_role_code] UNIQUE NONCLUSTERED 
(
	[role_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_valuation_frequency_type_code]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[valuation_frequency_type] ADD  CONSTRAINT [uq_valuation_frequency_type_code] UNIQUE NONCLUSTERED 
(
	[type_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
/****** Object:  Index [ix_valuation_frequency_type_active]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_valuation_frequency_type_active] ON [dbo].[valuation_frequency_type]
(
	[is_active] ASC,
	[sort_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_vessel_imo]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[vessel] ADD  CONSTRAINT [uq_vessel_imo] UNIQUE NONCLUSTERED 
(
	[imo_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [uq_vessel_mmsi]    Script Date: 7/12/26 1:03:59PM ******/
ALTER TABLE [dbo].[vessel] ADD  CONSTRAINT [uq_vessel_mmsi] UNIQUE NONCLUSTERED 
(
	[mmsi] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_vessel_type]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_vessel_type] ON [dbo].[vessel]
(
	[vessel_type] ASC,
	[vetting_status] ASC,
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_vessel_vetting]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_vessel_vetting] ON [dbo].[vessel]
(
	[vetting_expiry] ASC,
	[vetting_status] ASC
)
WHERE ([vetting_expiry] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_vc_expiry]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_vc_expiry] ON [dbo].[vessel_certificate]
(
	[expiry_date] ASC,
	[cert_type] ASC,
	[is_current] ASC
)
WHERE ([expiry_date] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
/****** Object:  Index [ix_vc_vessel]    Script Date: 7/12/26 1:03:59PM ******/
CREATE NONCLUSTERED INDEX [ix_vc_vessel] ON [dbo].[vessel_certificate]
(
	[vessel_id] ASC,
	[cert_type] ASC,
	[is_current] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [dbo].[address] ADD  DEFAULT ((0)) FOR [is_primary]
GO
ALTER TABLE [dbo].[address] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[address] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[address] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[address_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[address_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[address_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[address_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[agri_crop_year_lifecycle] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[agri_crop_year_lifecycle] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[agri_crop_year_lifecycle] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[app_user] ADD  DEFAULT ((0)) FOR [mfa_enabled]
GO
ALTER TABLE [dbo].[app_user] ADD  DEFAULT ((0)) FOR [failed_login_count]
GO
ALTER TABLE [dbo].[app_user] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[app_user] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[app_user] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[app_user] ADD  CONSTRAINT [df_au_vf]  DEFAULT (sysutcdatetime()) FOR [valid_from]
GO
ALTER TABLE [dbo].[app_user] ADD  CONSTRAINT [df_au_vt]  DEFAULT (CONVERT([datetime2],'9999-12-31 23:59:59.9999999')) FOR [valid_to]
GO
ALTER TABLE [dbo].[balancing_authority] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[balancing_authority] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[balancing_authority] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[balmo_product] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[balmo_product] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[balmo_product] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[balmo_product] ADD  CONSTRAINT [df_balmo_product_tick_currency_id]  DEFAULT ((1)) FOR [tick_currency_id]
GO
ALTER TABLE [dbo].[bank_account] ADD  DEFAULT ((0)) FOR [is_primary]
GO
ALTER TABLE [dbo].[bank_account] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[bank_account] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[bank_account] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[bank_account_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[bank_account_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[bank_account_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[bank_account_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[bank_guarantee] ADD  DEFAULT ((30)) FOR [claim_period_days]
GO
ALTER TABLE [dbo].[bank_guarantee] ADD  DEFAULT ('ISSUED') FOR [bg_status]
GO
ALTER TABLE [dbo].[bank_guarantee] ADD  DEFAULT ((0)) FOR [amount_called]
GO
ALTER TABLE [dbo].[bank_guarantee] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[bank_guarantee] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[bolmo_agreement] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[bolmo_agreement] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[bolmo_agreement] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[bolmo_agreement] ADD  CONSTRAINT [df_bolmo_agreement_currency_id]  DEFAULT ((1)) FOR [currency_id]
GO
ALTER TABLE [dbo].[book] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[book] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[book] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[book] ADD  CONSTRAINT [df_bk_vf]  DEFAULT (sysutcdatetime()) FOR [valid_from]
GO
ALTER TABLE [dbo].[book] ADD  CONSTRAINT [df_bk_vt]  DEFAULT (CONVERT([datetime2],'9999-12-31 23:59:59.9999999')) FOR [valid_to]
GO
ALTER TABLE [dbo].[book] ADD  CONSTRAINT [df_book_base_currency_id]  DEFAULT ((1)) FOR [base_currency_id]
GO
ALTER TABLE [dbo].[book_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[book_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[book_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[book_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[broker] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[broker] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[broker] ADD  DEFAULT ('VOICE') FOR [broker_type]
GO
ALTER TABLE [dbo].[broker_fee_agreement] ADD  DEFAULT ('MONTHLY') FOR [pay_period]
GO
ALTER TABLE [dbo].[broker_fee_agreement] ADD  DEFAULT ((30)) FOR [payment_due_days]
GO
ALTER TABLE [dbo].[broker_fee_agreement] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[broker_fee_agreement] ADD  DEFAULT (getutcdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[broker_fee_agreement] ADD  CONSTRAINT [df_broker_fee_agreement_fee_currency_id]  DEFAULT ((1)) FOR [fee_currency_id]
GO
ALTER TABLE [dbo].[carbon_registry] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[carbon_registry] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[carbon_registry] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[carbon_registry_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[carbon_registry_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[carbon_registry_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[carbon_registry_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[charter_party_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[charter_party_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[charter_party_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[collateral] ADD  DEFAULT ((0)) FOR [haircut_pct]
GO
ALTER TABLE [dbo].[collateral] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[collateral] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[collateral] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[collateral_type] ADD  DEFAULT ((0)) FOR [standard_haircut_pct]
GO
ALTER TABLE [dbo].[collateral_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[commodity] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[commodity_family] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[commodity_family] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[commodity_family] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[commodity_grade_standard] ADD  DEFAULT ((0)) FOR [is_par_grade]
GO
ALTER TABLE [dbo].[commodity_grade_standard] ADD  DEFAULT ((0)) FOR [price_adjustment_per_uom]
GO
ALTER TABLE [dbo].[commodity_grade_standard] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[commodity_grade_standard] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[commodity_grade_standard] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[commodity_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[commodity_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[commodity_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[commodity_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[contact] ADD  DEFAULT ((0)) FOR [is_primary]
GO
ALTER TABLE [dbo].[contact] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[contact] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[contact] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[contact_role] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[contact_role] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[contact_role] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[contact_role] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[container] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[container] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[counterparty] ADD  DEFAULT ((2)) FOR [settlement_days]
GO
ALTER TABLE [dbo].[counterparty] ADD  DEFAULT ((0)) FOR [is_intercompany]
GO
ALTER TABLE [dbo].[counterparty] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[counterparty] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[counterparty] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[counterparty] ADD  CONSTRAINT [df_cp_vf]  DEFAULT (sysutcdatetime()) FOR [valid_from]
GO
ALTER TABLE [dbo].[counterparty] ADD  CONSTRAINT [df_cp_vt]  DEFAULT (CONVERT([datetime2],'9999-12-31 23:59:59.9999999')) FOR [valid_to]
GO
ALTER TABLE [dbo].[counterparty] ADD  DEFAULT ((0)) FOR [parent_ind]
GO
ALTER TABLE [dbo].[counterparty] ADD  CONSTRAINT [df_counterparty_credit_limit_currency_id]  DEFAULT ((1)) FOR [credit_limit_currency_id]
GO
ALTER TABLE [dbo].[counterparty_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[counterparty_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[counterparty_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[counterparty_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[country] ADD  DEFAULT ('COMPLIANT') FOR [fatf_status]
GO
ALTER TABLE [dbo].[country] ADD  DEFAULT ('CLEAR') FOR [sanction_status]
GO
ALTER TABLE [dbo].[country] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[cp_commercial_terms] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[cp_commercial_terms] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[cp_commercial_terms] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[cp_gtc_agreement] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[cp_gtc_agreement] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ((0)) FOR [used_amount]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ('ALL') FOR [commodity_type]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ('DIRECT') FOR [limit_basis]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ((0)) FOR [collateral_offset]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ((80)) FOR [warning_threshold_pct]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ((95)) FOR [critical_threshold_pct]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ('ALERT_ONLY') FOR [breach_action]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ((1)) FOR [alert_internal]
GO
ALTER TABLE [dbo].[credit_limit] ADD  DEFAULT ((0)) FOR [alert_counterparty]
GO
ALTER TABLE [dbo].[credit_limit] ADD  CONSTRAINT [df_credit_limit_limit_currency_id]  DEFAULT ((1)) FOR [limit_currency_id]
GO
ALTER TABLE [dbo].[credit_limit_status_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[credit_limit_status_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[credit_limit_status_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[credit_limit_status_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[credit_limit_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[credit_limit_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[credit_limit_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[credit_limit_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[credit_rating] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[credit_term] ADD  DEFAULT ((0)) FOR [credit_period_days]
GO
ALTER TABLE [dbo].[credit_term] ADD  DEFAULT ((0)) FOR [netting_eligible]
GO
ALTER TABLE [dbo].[credit_term] ADD  DEFAULT ((0)) FOR [requires_isda]
GO
ALTER TABLE [dbo].[credit_term] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[credit_term] ADD  CONSTRAINT [df_credit_term_margin_call_currency_id]  DEFAULT ((1)) FOR [margin_call_currency_id]
GO
ALTER TABLE [dbo].[currency] ADD  DEFAULT ((2)) FOR [decimal_places]
GO
ALTER TABLE [dbo].[currency] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[deal_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[deal_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[deal_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[deal_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[desk] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[desk] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[document_store] ADD  DEFAULT ((1)) FOR [is_current]
GO
ALTER TABLE [dbo].[document_store] ADD  DEFAULT ((0)) FOR [is_confidential]
GO
ALTER TABLE [dbo].[document_store] ADD  DEFAULT (sysutcdatetime()) FOR [uploaded_at]
GO
ALTER TABLE [dbo].[emission_obligation] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[emission_obligation] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[emission_obligation_status] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[emission_obligation_status] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[emission_obligation_status] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[emission_obligation_status] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[emission_scheme] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[emission_scheme] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[emission_scheme] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[emission_scheme_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[emission_scheme_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[emission_scheme_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[emission_scheme_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[energy_footprint] ADD  DEFAULT ((0)) FOR [is_aggregated_dispatch]
GO
ALTER TABLE [dbo].[energy_footprint] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[energy_footprint] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[energy_footprint] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[energy_footprint_site] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[energy_footprint_site] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[energy_footprint_site] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[environmental_product] ADD  DEFAULT ('tCO2e') FOR [unit_of_measure]
GO
ALTER TABLE [dbo].[environmental_product] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[environmental_product] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[environmental_product] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[environmental_product_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[environmental_product_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[environmental_product_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[environmental_product_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[event_category] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[event_type] ADD  DEFAULT ('INFO') FOR [severity]
GO
ALTER TABLE [dbo].[event_type] ADD  DEFAULT ((0)) FOR [requires_action]
GO
ALTER TABLE [dbo].[event_type] ADD  DEFAULT ((0)) FOR [requires_approval]
GO
ALTER TABLE [dbo].[event_type] ADD  DEFAULT ((1)) FOR [triggers_notification]
GO
ALTER TABLE [dbo].[event_type] ADD  DEFAULT ((0)) FOR [is_reportable]
GO
ALTER TABLE [dbo].[event_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[exchange] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[exchange] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[exchange] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[external_system] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[external_system] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[external_system] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[field_permission_profile] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[field_permission_profile] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[field_permission_profile] ADD  DEFAULT ('SYSTEM') FOR [created_by]
GO
ALTER TABLE [dbo].[field_permission_profile] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[field_permission_profile] ADD  DEFAULT ('SYSTEM') FOR [updated_by]
GO
ALTER TABLE [dbo].[field_permission_rule] ADD  DEFAULT ('EDIT') FOR [field_permission]
GO
ALTER TABLE [dbo].[formula_template] ADD  DEFAULT ((0)) FOR [fx_conversion_required]
GO
ALTER TABLE [dbo].[formula_template] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[formula_template] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[freight_rate_index] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[freight_rate_index] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[freight_rate_index] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[fx_period] ADD  DEFAULT ((0)) FOR [days_offset]
GO
ALTER TABLE [dbo].[fx_period] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[fx_period] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[fx_period] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[fx_rate] ADD  DEFAULT ('EOD') FOR [rate_type]
GO
ALTER TABLE [dbo].[fx_rate] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[generation_asset] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[generation_asset] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[generation_asset] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[gl_account] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[gl_account] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[gl_account] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[gl_account] ADD  DEFAULT ('DEBIT') FOR [normal_balance]
GO
ALTER TABLE [dbo].[gl_account] ADD  DEFAULT ((0)) FOR [is_control_account]
GO
ALTER TABLE [dbo].[governing_law_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[governing_law_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[governing_law_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[governing_law_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[gtc] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[gtc] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[gtc_version] ADD  DEFAULT ((0)) FOR [is_current]
GO
ALTER TABLE [dbo].[gtc_version] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[holiday_calendar] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[incoterm] ADD  DEFAULT ((2020)) FOR [version_year]
GO
ALTER TABLE [dbo].[incoterm] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[inspection_type] ADD  DEFAULT ((0)) FOR [is_mandatory]
GO
ALTER TABLE [dbo].[inspection_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[insurance_policy] ADD  DEFAULT ((0)) FOR [deductible]
GO
ALTER TABLE [dbo].[insurance_policy] ADD  DEFAULT ('ACTIVE') FOR [policy_status]
GO
ALTER TABLE [dbo].[insurance_policy] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[insurance_policy] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[insurance_provider] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[insurance_provider] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[intercompany_transfer_rule] ADD  DEFAULT ((0)) FOR [automatic_booking_enabled]
GO
ALTER TABLE [dbo].[intercompany_transfer_rule] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[intercompany_transfer_rule] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[intercompany_transfer_rule] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[interconnector] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[interconnector] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[interconnector] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[interest_rate_index] ADD  DEFAULT ('ACT_360') FOR [day_count_convention]
GO
ALTER TABLE [dbo].[interest_rate_index] ADD  DEFAULT ('SIMPLE') FOR [compounding]
GO
ALTER TABLE [dbo].[interest_rate_index] ADD  DEFAULT ((0)) FOR [fixing_lag_days]
GO
ALTER TABLE [dbo].[interest_rate_index] ADD  DEFAULT ((0)) FOR [is_rfrr]
GO
ALTER TABLE [dbo].[interest_rate_index] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[kyc_status] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[kyc_status] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[kyc_status] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[kyc_status] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[laytime_exception_type] ADD  DEFAULT ((1)) FOR [default_counts_against_laytime]
GO
ALTER TABLE [dbo].[laytime_exception_type] ADD  DEFAULT ((0)) FOR [is_weather_related]
GO
ALTER TABLE [dbo].[laytime_exception_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[laytime_exception_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[laytime_exception_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[laytime_term_template] ADD  DEFAULT ((0)) FOR [is_reversible]
GO
ALTER TABLE [dbo].[laytime_term_template] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[laytime_term_template] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[laytime_term_template] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[laytime_term_template] ADD  DEFAULT ((0)) FOR [nor_wipon_allowed]
GO
ALTER TABLE [dbo].[laytime_term_template] ADD  DEFAULT ((0)) FOR [nor_wibon_allowed]
GO
ALTER TABLE [dbo].[laytime_term_template] ADD  DEFAULT ((0)) FOR [nor_wifpon_allowed]
GO
ALTER TABLE [dbo].[laytime_term_template] ADD  DEFAULT ((0)) FOR [nor_wccon_allowed]
GO
ALTER TABLE [dbo].[laytime_term_template] ADD  CONSTRAINT [df_ltt_nor_turn_time]  DEFAULT ((360)) FOR [notice_of_readiness_turn_time_mins]
GO
ALTER TABLE [dbo].[lc_status_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[lc_status_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[lc_status_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[lc_status_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[lc_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[lc_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[lc_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[lc_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[legal_entity] ADD  DEFAULT ((1)) FOR [is_internal]
GO
ALTER TABLE [dbo].[legal_entity] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[legal_entity] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[legal_entity] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[legal_entity] ADD  CONSTRAINT [df_le_vf]  DEFAULT (sysutcdatetime()) FOR [valid_from]
GO
ALTER TABLE [dbo].[legal_entity] ADD  CONSTRAINT [df_le_vt]  DEFAULT (CONVERT([datetime2],'9999-12-31 23:59:59.9999999')) FOR [valid_to]
GO
ALTER TABLE [dbo].[legal_entity] ADD  DEFAULT ((0)) FOR [parent_ind]
GO
ALTER TABLE [dbo].[legal_entity] ADD  CONSTRAINT [df_legal_entity_base_currency_id]  DEFAULT ((1)) FOR [base_currency_id]
GO
ALTER TABLE [dbo].[legal_entity_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[legal_entity_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[legal_entity_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[legal_entity_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[letter_of_credit] ADD  DEFAULT ((0)) FOR [drawdown_amount]
GO
ALTER TABLE [dbo].[letter_of_credit] ADD  DEFAULT ((0)) FOR [is_evergreen]
GO
ALTER TABLE [dbo].[letter_of_credit] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[letter_of_credit] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[letter_of_credit] ADD  CONSTRAINT [df_letter_of_credit_lc_currency_id]  DEFAULT ((1)) FOR [lc_currency_id]
GO
ALTER TABLE [dbo].[lng_boil_off_rule] ADD  DEFAULT ((0)) FOR [is_forcing_boil_off_allowed]
GO
ALTER TABLE [dbo].[lng_boil_off_rule] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[lng_boil_off_rule] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[lng_boil_off_rule] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[lng_terminal_detail] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[lng_terminal_detail] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[load_shape_component] ADD  DEFAULT ((1)) FOR [weight_factor]
GO
ALTER TABLE [dbo].[load_shape_component] ADD  DEFAULT ((1)) FOR [sequence_no]
GO
ALTER TABLE [dbo].[load_shape_component] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[load_shape_component] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[load_shape_interval] ADD  DEFAULT ('ALL') FOR [day_type]
GO
ALTER TABLE [dbo].[load_shape_interval] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[load_shape_interval] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[load_shape_template] ADD  DEFAULT ('WEEKDAYS') FOR [applicable_days]
GO
ALTER TABLE [dbo].[load_shape_template] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[load_shape_template] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[load_shape_template] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[load_shape_template] ADD  CONSTRAINT [df_lst_interval_minutes]  DEFAULT ((60)) FOR [interval_minutes]
GO
ALTER TABLE [dbo].[load_shape_template] ADD  CONSTRAINT [df_lst_is_composite]  DEFAULT ((0)) FOR [is_composite]
GO
ALTER TABLE [dbo].[location] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[location] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[location_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[lookup_category] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[lookup_category] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[lookup_category] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[lookup_category] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[lookup_value] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[lookup_value] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[margin_account] ADD  DEFAULT ('HOUSE') FOR [account_type]
GO
ALTER TABLE [dbo].[margin_account] ADD  DEFAULT ((0)) FOR [initial_margin]
GO
ALTER TABLE [dbo].[margin_account] ADD  DEFAULT ((0)) FOR [variation_margin]
GO
ALTER TABLE [dbo].[margin_account] ADD  DEFAULT ((0)) FOR [excess_margin]
GO
ALTER TABLE [dbo].[margin_account] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[margin_account] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[margin_agreement] ADD  DEFAULT ((0)) FOR [threshold_amount]
GO
ALTER TABLE [dbo].[margin_agreement] ADD  DEFAULT ((0)) FOR [cp_threshold_amount]
GO
ALTER TABLE [dbo].[margin_agreement] ADD  DEFAULT ((0)) FOR [mta_amount]
GO
ALTER TABLE [dbo].[margin_agreement] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[margin_agreement] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[margin_agreement] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[margin_agreement] ADD  CONSTRAINT [df_margin_agreement_threshold_currency_id]  DEFAULT ((1)) FOR [threshold_currency_id]
GO
ALTER TABLE [dbo].[margin_agreement] ADD  CONSTRAINT [df_margin_agreement_cp_threshold_currency_id]  DEFAULT ((1)) FOR [cp_threshold_currency_id]
GO
ALTER TABLE [dbo].[margin_agreement] ADD  CONSTRAINT [df_margin_agreement_mta_currency_id]  DEFAULT ((1)) FOR [mta_currency_id]
GO
ALTER TABLE [dbo].[margin_agreement_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[margin_agreement_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[margin_agreement_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[margin_agreement_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[market] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[market] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[market] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[metal_assay_component_rule] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[metal_assay_component_rule] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[metal_assay_component_rule] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[metal_brand] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[metal_brand] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[metal_brand] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[metal_shape] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[metal_shape] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[metal_shape] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[metal_shape] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[metal_warrant] ADD  DEFAULT ((0)) FOR [is_pledged_collateral]
GO
ALTER TABLE [dbo].[metal_warrant] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[metal_warrant] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[metal_warrant] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[mot_type] ADD  DEFAULT ((1)) FOR [requires_physical_asset]
GO
ALTER TABLE [dbo].[mot_type] ADD  DEFAULT ((1)) FOR [requires_routing]
GO
ALTER TABLE [dbo].[mot_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[netting_agreement] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[netting_agreement] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[netting_agreement_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[netting_agreement_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[netting_agreement_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[netting_agreement_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[parent_company_guarantee] ADD  DEFAULT ((0)) FOR [is_evergreen]
GO
ALTER TABLE [dbo].[parent_company_guarantee] ADD  DEFAULT ('DRAFT') FOR [pcg_status]
GO
ALTER TABLE [dbo].[parent_company_guarantee] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[parent_company_guarantee] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[parent_company_guarantee] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[payment_calendar_assignment] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[payment_calendar_assignment] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[payment_calendar_assignment] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[payment_method] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[payment_method] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[payment_method] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[payment_method] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[payment_term] ADD  DEFAULT ((0)) FOR [offset_days]
GO
ALTER TABLE [dbo].[payment_term] ADD  DEFAULT ('CALENDAR') FOR [days_basis]
GO
ALTER TABLE [dbo].[payment_term] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[payment_term] ADD  DEFAULT ('INVOICE_DATE') FOR [base_date_event]
GO
ALTER TABLE [dbo].[payment_term] ADD  DEFAULT ((0)) FOR [month_offset]
GO
ALTER TABLE [dbo].[payment_term] ADD  DEFAULT ('MOD_FOLLOWING') FOR [business_day_convention]
GO
ALTER TABLE [dbo].[payment_term] ADD  DEFAULT ((0)) FOR [is_default]
GO
ALTER TABLE [dbo].[payment_term] ADD  DEFAULT ((0)) FOR [invoice_lead_days]
GO
ALTER TABLE [dbo].[period] ADD  DEFAULT ((0)) FOR [is_rolling]
GO
ALTER TABLE [dbo].[period] ADD  DEFAULT ((1)) FOR [is_trading_period]
GO
ALTER TABLE [dbo].[period] ADD  DEFAULT ((1)) FOR [is_risk_period]
GO
ALTER TABLE [dbo].[period] ADD  DEFAULT ((0)) FOR [is_settlement_period]
GO
ALTER TABLE [dbo].[period] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[period] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[pipeline] ADD  DEFAULT ('UNIDIRECTIONAL') FOR [flow_direction]
GO
ALTER TABLE [dbo].[pipeline] ADD  DEFAULT ((0)) FOR [is_cross_border]
GO
ALTER TABLE [dbo].[pipeline] ADD  DEFAULT ((1)) FOR [is_fungible]
GO
ALTER TABLE [dbo].[pipeline] ADD  DEFAULT ((0)) FOR [batch_scheduling]
GO
ALTER TABLE [dbo].[pipeline] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pipeline] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[pipeline] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[pipeline_cycle] ADD  DEFAULT ('WEEKDAYS') FOR [applies_to_days]
GO
ALTER TABLE [dbo].[pipeline_cycle] ADD  DEFAULT ((1)) FOR [cycle_priority]
GO
ALTER TABLE [dbo].[pipeline_cycle] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pipeline_cycle] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[pipeline_point] ADD  DEFAULT ('BOTH') FOR [flow_direction]
GO
ALTER TABLE [dbo].[pipeline_point] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pipeline_segment] ADD  DEFAULT ('IN_SERVICE') FOR [operational_status]
GO
ALTER TABLE [dbo].[pipeline_segment] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pipeline_tariff] ADD  DEFAULT ('ENTRY_EXIT') FOR [capacity_type]
GO
ALTER TABLE [dbo].[pipeline_tariff] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pipeline_tariff] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[power_ancillary_service_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[power_ancillary_service_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[power_ancillary_service_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[power_pnode] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[power_pnode] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[power_pnode] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[power_product_detail] ADD  DEFAULT ((0)) FOR [is_ancillary_service]
GO
ALTER TABLE [dbo].[power_product_detail] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[power_product_detail] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[price_index] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[price_index_source] ADD  DEFAULT ((1.0)) FOR [price_multiplier]
GO
ALTER TABLE [dbo].[price_index_source] ADD  DEFAULT ((0.0)) FOR [price_offset]
GO
ALTER TABLE [dbo].[price_index_source] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[price_index_source] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[price_index_source] ADD  DEFAULT ((1)) FOR [calculation_sequence]
GO
ALTER TABLE [dbo].[price_source] ADD  DEFAULT ('API') FOR [delivery_method]
GO
ALTER TABLE [dbo].[price_source] ADD  DEFAULT ('EOD') FOR [frequency]
GO
ALTER TABLE [dbo].[price_source] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[price_source] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[price_source] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ((0)) FOR [fx_conversion_required]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ((2)) FOR [price_decimal_places]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ((3)) FOR [quantity_decimal_places]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ((2)) FOR [value_decimal_places]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ('STANDARD') FOR [rounding_convention]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ((0)) FOR [invoice_timing_days]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ('BUSINESS') FOR [invoice_timing_basis]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ((0)) FOR [requires_final_invoice]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ((0)) FOR [is_default]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ('2020-01-01') FOR [effective_from]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  CONSTRAINT [df_pr_vf]  DEFAULT (sysutcdatetime()) FOR [valid_from_sys]
GO
ALTER TABLE [dbo].[pricing_rule] ADD  CONSTRAINT [df_pr_vt]  DEFAULT (CONVERT([datetime2],'9999-12-31 23:59:59.9999999')) FOR [valid_to_sys]
GO
ALTER TABLE [dbo].[pricing_trigger_event_type] ADD  DEFAULT ((0)) FOR [requires_physical_confirmation]
GO
ALTER TABLE [dbo].[pricing_trigger_event_type] ADD  DEFAULT ((0)) FOR [is_fallback_type]
GO
ALTER TABLE [dbo].[pricing_trigger_event_type] ADD  DEFAULT ((0)) FOR [is_system_generated]
GO
ALTER TABLE [dbo].[pricing_trigger_event_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pricing_type] ADD  DEFAULT ((0)) FOR [requires_index]
GO
ALTER TABLE [dbo].[pricing_type] ADD  DEFAULT ((0)) FOR [requires_formula]
GO
ALTER TABLE [dbo].[pricing_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pricing_window_rule] ADD  DEFAULT ((0)) FOR [days_before]
GO
ALTER TABLE [dbo].[pricing_window_rule] ADD  DEFAULT ((0)) FOR [days_after]
GO
ALTER TABLE [dbo].[pricing_window_rule] ADD  DEFAULT ('BUSINESS') FOR [day_count_type]
GO
ALTER TABLE [dbo].[pricing_window_rule] ADD  DEFAULT ((1)) FOR [min_fixings_required]
GO
ALTER TABLE [dbo].[pricing_window_rule] ADD  DEFAULT ('PRIOR_DAY') FOR [missing_fixing_rule]
GO
ALTER TABLE [dbo].[pricing_window_rule] ADD  DEFAULT ('SIMPLE') FOR [averaging_method]
GO
ALTER TABLE [dbo].[pricing_window_rule] ADD  DEFAULT ((2)) FOR [price_rounding_dp]
GO
ALTER TABLE [dbo].[pricing_window_rule] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pricing_window_rule] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[product] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[product] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[product] ADD  DEFAULT ((0)) FOR [is_exchange_traded]
GO
ALTER TABLE [dbo].[product] ADD  DEFAULT ((1)) FOR [is_otc]
GO
ALTER TABLE [dbo].[product] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[product] ADD  DEFAULT ((0)) FOR [is_blend]
GO
ALTER TABLE [dbo].[product_spec_template] ADD  DEFAULT ((0)) FOR [is_default]
GO
ALTER TABLE [dbo].[product_spec_template] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[product_spec_template] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[product_spec_template] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[railcar] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[railcar] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[regulatory_obligation] ADD  DEFAULT ('FULL') FOR [obligation_type]
GO
ALTER TABLE [dbo].[regulatory_obligation] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[regulatory_obligation] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[regulatory_report_type] ADD  DEFAULT ((1)) FOR [is_mandatory]
GO
ALTER TABLE [dbo].[regulatory_report_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[reporting_group] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[reporting_group] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[reporting_group] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[rin_account] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[rin_account] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[rin_account] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[rin_fuel_category] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[rin_fuel_category] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[rin_fuel_category] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[rin_obligation] ADD  DEFAULT ((0)) FOR [retired_quantity]
GO
ALTER TABLE [dbo].[rin_obligation] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[rin_obligation] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[screen_field_registry] ADD  DEFAULT ((0)) FOR [is_required_field]
GO
ALTER TABLE [dbo].[screen_field_registry] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[screen_field_registry] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[settlement_calendar] ADD  DEFAULT ((1)) FOR [priority]
GO
ALTER TABLE [dbo].[settlement_calendar] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[settlement_price] ADD  CONSTRAINT [df_sp_confirmed]  DEFAULT ((0)) FOR [is_confirmed]
GO
ALTER TABLE [dbo].[settlement_price] ADD  CONSTRAINT [df_sp_source]  DEFAULT ('MANUAL') FOR [source]
GO
ALTER TABLE [dbo].[settlement_price] ADD  CONSTRAINT [df_sp_created]  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[settlement_price] ADD  CONSTRAINT [df_sp_updated]  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[settlement_price] ADD  CONSTRAINT [df_settlement_price_tick_currency_id]  DEFAULT ((1)) FOR [tick_currency_id]
GO
ALTER TABLE [dbo].[settlement_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[settlement_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[settlement_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[settlement_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[storage_facility] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[storage_facility_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[storage_facility_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[storage_facility_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[storage_facility_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[tank] ADD  DEFAULT ((0)) FOR [is_heated]
GO
ALTER TABLE [dbo].[tank] ADD  DEFAULT ((1)) FOR [has_metering]
GO
ALTER TABLE [dbo].[tank] ADD  DEFAULT ('IN_SERVICE') FOR [tank_status]
GO
ALTER TABLE [dbo].[tank] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tank] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[tank] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[tax_registration] ADD  DEFAULT ((0)) FOR [is_primary]
GO
ALTER TABLE [dbo].[tax_registration] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tax_registration] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[tax_registration] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[tax_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[tax_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[tax_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[tax_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[trade_repository] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[trader] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[trader] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[trader] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[trader] ADD  CONSTRAINT [df_trader_limit_currency_id]  DEFAULT ((1)) FOR [limit_currency_id]
GO
ALTER TABLE [dbo].[transmission_right_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[transmission_right_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[transmission_right_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[transmission_zone] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[transmission_zone] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[transmission_zone] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[transport_document_type] ADD  DEFAULT ((0)) FOR [is_mandatory]
GO
ALTER TABLE [dbo].[transport_document_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[transport_operator] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[transport_operator] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[transport_operator] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[transport_route] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[transport_route] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[truck] ADD  DEFAULT ((0)) FOR [adr_certified]
GO
ALTER TABLE [dbo].[truck] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[truck] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[unit_of_measure] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[uom_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[uom_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[uom_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[uom_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[user_role] ADD  DEFAULT ('CUSTOM') FOR [role_type]
GO
ALTER TABLE [dbo].[user_role] ADD  DEFAULT ('DRAFT') FOR [status]
GO
ALTER TABLE [dbo].[user_role] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[user_role] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[user_role] ADD  DEFAULT ('SYSTEM') FOR [created_by]
GO
ALTER TABLE [dbo].[user_role] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[user_role] ADD  DEFAULT ('SYSTEM') FOR [updated_by]
GO
ALTER TABLE [dbo].[valuation_frequency_type] ADD  DEFAULT ((0)) FOR [sort_order]
GO
ALTER TABLE [dbo].[valuation_frequency_type] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[valuation_frequency_type] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[valuation_frequency_type] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[vessel] ADD  DEFAULT ('PENDING') FOR [vetting_status]
GO
ALTER TABLE [dbo].[vessel] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[vessel] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[vessel] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[vessel_certificate] ADD  DEFAULT ((1)) FOR [is_current]
GO
ALTER TABLE [dbo].[vessel_certificate] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[address]  WITH CHECK ADD  CONSTRAINT [fk_address_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[address] CHECK CONSTRAINT [fk_address_country]
GO
ALTER TABLE [dbo].[address]  WITH CHECK ADD  CONSTRAINT [fk_address_type_id] FOREIGN KEY([address_type])
REFERENCES [dbo].[address_type] ([address_type_id])
GO
ALTER TABLE [dbo].[address] CHECK CONSTRAINT [fk_address_type_id]
GO
ALTER TABLE [dbo].[agri_crop_year_lifecycle]  WITH CHECK ADD  CONSTRAINT [fk_acyl_commodity] FOREIGN KEY([commodity_id])
REFERENCES [dbo].[commodity] ([commodity_id])
GO
ALTER TABLE [dbo].[agri_crop_year_lifecycle] CHECK CONSTRAINT [fk_acyl_commodity]
GO
ALTER TABLE [dbo].[agri_crop_year_lifecycle]  WITH CHECK ADD  CONSTRAINT [fk_acyl_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[agri_crop_year_lifecycle] CHECK CONSTRAINT [fk_acyl_country]
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale]  WITH CHECK ADD  CONSTRAINT [fk_amds_currency] FOREIGN KEY([discount_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale] CHECK CONSTRAINT [fk_amds_currency]
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale]  WITH CHECK ADD  CONSTRAINT [fk_amds_grade] FOREIGN KEY([grade_standard_id])
REFERENCES [dbo].[commodity_grade_standard] ([grade_standard_id])
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale] CHECK CONSTRAINT [fk_amds_grade]
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale]  WITH CHECK ADD  CONSTRAINT [fk_amds_uom] FOREIGN KEY([discount_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale] CHECK CONSTRAINT [fk_amds_uom]
GO
ALTER TABLE [dbo].[app_user]  WITH CHECK ADD  CONSTRAINT [fk_user_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[app_user] CHECK CONSTRAINT [fk_user_entity]
GO
ALTER TABLE [dbo].[balancing_authority]  WITH CHECK ADD  CONSTRAINT [fk_ba_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[balancing_authority] CHECK CONSTRAINT [fk_ba_country]
GO
ALTER TABLE [dbo].[balmo_product]  WITH CHECK ADD  CONSTRAINT [fk_balmo_product_uom] FOREIGN KEY([uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[balmo_product] CHECK CONSTRAINT [fk_balmo_product_uom]
GO
ALTER TABLE [dbo].[balmo_product]  WITH CHECK ADD  CONSTRAINT [fk_balmo_tick_ccy] FOREIGN KEY([tick_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[balmo_product] CHECK CONSTRAINT [fk_balmo_tick_ccy]
GO
ALTER TABLE [dbo].[bank_account]  WITH CHECK ADD  CONSTRAINT [fk_bank_account_type_id] FOREIGN KEY([account_type])
REFERENCES [dbo].[bank_account_type] ([bank_account_type_id])
GO
ALTER TABLE [dbo].[bank_account] CHECK CONSTRAINT [fk_bank_account_type_id]
GO
ALTER TABLE [dbo].[bank_account]  WITH CHECK ADD  CONSTRAINT [fk_bank_address] FOREIGN KEY([bank_address_id])
REFERENCES [dbo].[address] ([address_id])
GO
ALTER TABLE [dbo].[bank_account] CHECK CONSTRAINT [fk_bank_address]
GO
ALTER TABLE [dbo].[bank_account]  WITH CHECK ADD  CONSTRAINT [fk_bank_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[bank_account] CHECK CONSTRAINT [fk_bank_currency]
GO
ALTER TABLE [dbo].[bank_guarantee]  WITH CHECK ADD  CONSTRAINT [fk_bg_bank] FOREIGN KEY([issuing_bank_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[bank_guarantee] CHECK CONSTRAINT [fk_bg_bank]
GO
ALTER TABLE [dbo].[bank_guarantee]  WITH CHECK ADD  CONSTRAINT [fk_bg_beneficiary] FOREIGN KEY([beneficiary_cp_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[bank_guarantee] CHECK CONSTRAINT [fk_bg_beneficiary]
GO
ALTER TABLE [dbo].[bank_guarantee]  WITH CHECK ADD  CONSTRAINT [fk_bg_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[bank_guarantee] CHECK CONSTRAINT [fk_bg_currency]
GO
ALTER TABLE [dbo].[bank_guarantee]  WITH CHECK ADD  CONSTRAINT [fk_bg_doc] FOREIGN KEY([document_store_id])
REFERENCES [dbo].[document_store] ([document_id])
GO
ALTER TABLE [dbo].[bank_guarantee] CHECK CONSTRAINT [fk_bg_doc]
GO
ALTER TABLE [dbo].[bank_guarantee]  WITH CHECK ADD  CONSTRAINT [fk_bg_principal] FOREIGN KEY([principal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[bank_guarantee] CHECK CONSTRAINT [fk_bg_principal]
GO
ALTER TABLE [dbo].[bolmo_agreement]  WITH CHECK ADD  CONSTRAINT [fk_bolmo_agreement_uom] FOREIGN KEY([uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[bolmo_agreement] CHECK CONSTRAINT [fk_bolmo_agreement_uom]
GO
ALTER TABLE [dbo].[bolmo_agreement]  WITH CHECK ADD  CONSTRAINT [fk_bolmo_counterparty] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[bolmo_agreement] CHECK CONSTRAINT [fk_bolmo_counterparty]
GO
ALTER TABLE [dbo].[bolmo_agreement]  WITH CHECK ADD  CONSTRAINT [fk_bolmo_currency_code] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[bolmo_agreement] CHECK CONSTRAINT [fk_bolmo_currency_code]
GO
ALTER TABLE [dbo].[bolmo_agreement]  WITH CHECK ADD  CONSTRAINT [fk_bolmo_delivery_location] FOREIGN KEY([delivery_location_id])
REFERENCES [dbo].[location] ([location_id])
GO
ALTER TABLE [dbo].[bolmo_agreement] CHECK CONSTRAINT [fk_bolmo_delivery_location]
GO
ALTER TABLE [dbo].[bolmo_agreement]  WITH CHECK ADD  CONSTRAINT [fk_bolmo_legal_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[bolmo_agreement] CHECK CONSTRAINT [fk_bolmo_legal_entity]
GO
ALTER TABLE [dbo].[book]  WITH CHECK ADD  CONSTRAINT [fk_book_base_ccy] FOREIGN KEY([base_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[book] CHECK CONSTRAINT [fk_book_base_ccy]
GO
ALTER TABLE [dbo].[book]  WITH CHECK ADD  CONSTRAINT [fk_book_book_type] FOREIGN KEY([book_type])
REFERENCES [dbo].[book_type] ([book_type_id])
GO
ALTER TABLE [dbo].[book] CHECK CONSTRAINT [fk_book_book_type]
GO
ALTER TABLE [dbo].[book]  WITH CHECK ADD  CONSTRAINT [fk_book_commodity_type] FOREIGN KEY([commodity_type])
REFERENCES [dbo].[commodity_type] ([commodity_type_id])
GO
ALTER TABLE [dbo].[book] CHECK CONSTRAINT [fk_book_commodity_type]
GO
ALTER TABLE [dbo].[book]  WITH CHECK ADD  CONSTRAINT [fk_book_desk] FOREIGN KEY([desk_id])
REFERENCES [dbo].[desk] ([desk_id])
GO
ALTER TABLE [dbo].[book] CHECK CONSTRAINT [fk_book_desk]
GO
ALTER TABLE [dbo].[book]  WITH CHECK ADD  CONSTRAINT [fk_book_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[book] CHECK CONSTRAINT [fk_book_entity]
GO
ALTER TABLE [dbo].[book]  WITH CHECK ADD  CONSTRAINT [fk_book_trader] FOREIGN KEY([responsible_trader_id])
REFERENCES [dbo].[trader] ([trader_id])
GO
ALTER TABLE [dbo].[book] CHECK CONSTRAINT [fk_book_trader]
GO
ALTER TABLE [dbo].[book]  WITH CHECK ADD  CONSTRAINT [fk_book_type_id] FOREIGN KEY([book_type_id])
REFERENCES [dbo].[book_type] ([book_type_id])
GO
ALTER TABLE [dbo].[book] CHECK CONSTRAINT [fk_book_type_id]
GO
ALTER TABLE [dbo].[broker]  WITH CHECK ADD  CONSTRAINT [fk_broker_commission_uom] FOREIGN KEY([commission_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[broker] CHECK CONSTRAINT [fk_broker_commission_uom]
GO
ALTER TABLE [dbo].[broker]  WITH CHECK ADD  CONSTRAINT [fk_broker_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[broker] CHECK CONSTRAINT [fk_broker_country]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [fk_bfa_broker] FOREIGN KEY([broker_id])
REFERENCES [dbo].[broker] ([broker_id])
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [fk_bfa_broker]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [fk_bfa_fee_ccy] FOREIGN KEY([fee_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [fk_bfa_fee_ccy]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [fk_bfa_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [fk_bfa_product]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [fk_broker_fee_agreement_uom] FOREIGN KEY([uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [fk_broker_fee_agreement_uom]
GO
ALTER TABLE [dbo].[carbon_registry]  WITH CHECK ADD  CONSTRAINT [fk_cr_registry_type] FOREIGN KEY([registry_type])
REFERENCES [dbo].[carbon_registry_type] ([carbon_registry_type_id])
GO
ALTER TABLE [dbo].[carbon_registry] CHECK CONSTRAINT [fk_cr_registry_type]
GO
ALTER TABLE [dbo].[collateral]  WITH CHECK ADD  CONSTRAINT [fk_coll_bg] FOREIGN KEY([bg_id])
REFERENCES [dbo].[bank_guarantee] ([bg_id])
GO
ALTER TABLE [dbo].[collateral] CHECK CONSTRAINT [fk_coll_bg]
GO
ALTER TABLE [dbo].[collateral]  WITH CHECK ADD  CONSTRAINT [fk_coll_cp] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[collateral] CHECK CONSTRAINT [fk_coll_cp]
GO
ALTER TABLE [dbo].[collateral]  WITH CHECK ADD  CONSTRAINT [fk_coll_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[collateral] CHECK CONSTRAINT [fk_coll_currency]
GO
ALTER TABLE [dbo].[collateral]  WITH CHECK ADD  CONSTRAINT [fk_coll_doc] FOREIGN KEY([document_store_id])
REFERENCES [dbo].[document_store] ([document_id])
GO
ALTER TABLE [dbo].[collateral] CHECK CONSTRAINT [fk_coll_doc]
GO
ALTER TABLE [dbo].[collateral]  WITH CHECK ADD  CONSTRAINT [fk_coll_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[collateral] CHECK CONSTRAINT [fk_coll_entity]
GO
ALTER TABLE [dbo].[collateral]  WITH CHECK ADD  CONSTRAINT [fk_coll_type] FOREIGN KEY([collateral_type_id])
REFERENCES [dbo].[collateral_type] ([collateral_type_id])
GO
ALTER TABLE [dbo].[collateral] CHECK CONSTRAINT [fk_coll_type]
GO
ALTER TABLE [dbo].[commodity]  WITH CHECK ADD  CONSTRAINT [fk_commodity_default_ccy] FOREIGN KEY([default_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[commodity] CHECK CONSTRAINT [fk_commodity_default_ccy]
GO
ALTER TABLE [dbo].[commodity]  WITH CHECK ADD  CONSTRAINT [fk_commodity_default_uom] FOREIGN KEY([default_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[commodity] CHECK CONSTRAINT [fk_commodity_default_uom]
GO
ALTER TABLE [dbo].[commodity_family]  WITH CHECK ADD  CONSTRAINT [fk_cf_commodity] FOREIGN KEY([commodity_id])
REFERENCES [dbo].[commodity] ([commodity_id])
GO
ALTER TABLE [dbo].[commodity_family] CHECK CONSTRAINT [fk_cf_commodity]
GO
ALTER TABLE [dbo].[commodity_grade_standard]  WITH CHECK ADD  CONSTRAINT [fk_cgs_adjustment_ccy] FOREIGN KEY([adjustment_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[commodity_grade_standard] CHECK CONSTRAINT [fk_cgs_adjustment_ccy]
GO
ALTER TABLE [dbo].[commodity_grade_standard]  WITH CHECK ADD  CONSTRAINT [fk_cgs_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[commodity_grade_standard] CHECK CONSTRAINT [fk_cgs_product]
GO
ALTER TABLE [dbo].[commodity_grade_standard]  WITH CHECK ADD  CONSTRAINT [fk_grade_standard_uom] FOREIGN KEY([adjustment_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[commodity_grade_standard] CHECK CONSTRAINT [fk_grade_standard_uom]
GO
ALTER TABLE [dbo].[contact]  WITH CHECK ADD  CONSTRAINT [fk_contact_role_id] FOREIGN KEY([contact_role])
REFERENCES [dbo].[contact_role] ([contact_role_id])
GO
ALTER TABLE [dbo].[contact] CHECK CONSTRAINT [fk_contact_role_id]
GO
ALTER TABLE [dbo].[container]  WITH CHECK ADD  CONSTRAINT [fk_cont_operator] FOREIGN KEY([operator_id])
REFERENCES [dbo].[transport_operator] ([operator_id])
GO
ALTER TABLE [dbo].[container] CHECK CONSTRAINT [fk_cont_operator]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [fk_counterparty_kyc_status_id] FOREIGN KEY([kyc_status])
REFERENCES [dbo].[kyc_status] ([kyc_status_id])
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [fk_counterparty_kyc_status_id]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [fk_counterparty_type_id] FOREIGN KEY([cp_type])
REFERENCES [dbo].[counterparty_type] ([counterparty_type_id])
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [fk_counterparty_type_id]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [fk_cp_credit_limit_ccy] FOREIGN KEY([credit_limit_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [fk_cp_credit_limit_ccy]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [fk_cp_credit_rating] FOREIGN KEY([credit_rating_id])
REFERENCES [dbo].[credit_rating] ([credit_rating_id])
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [fk_cp_credit_rating]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [fk_cp_currency] FOREIGN KEY([default_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [fk_cp_currency]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [fk_cp_entity] FOREIGN KEY([internal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [fk_cp_entity]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [fk_cp_jurisdiction] FOREIGN KEY([jurisdiction_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [fk_cp_jurisdiction]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [fk_cp_parent] FOREIGN KEY([parent_counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [fk_cp_parent]
GO
ALTER TABLE [dbo].[cp_commercial_terms]  WITH CHECK ADD  CONSTRAINT [fk_cpct_cp] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[cp_commercial_terms] CHECK CONSTRAINT [fk_cpct_cp]
GO
ALTER TABLE [dbo].[cp_commercial_terms]  WITH CHECK ADD  CONSTRAINT [fk_cpct_credit] FOREIGN KEY([credit_term_id])
REFERENCES [dbo].[credit_term] ([credit_term_id])
GO
ALTER TABLE [dbo].[cp_commercial_terms] CHECK CONSTRAINT [fk_cpct_credit]
GO
ALTER TABLE [dbo].[cp_commercial_terms]  WITH CHECK ADD  CONSTRAINT [fk_cpct_currency] FOREIGN KEY([default_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[cp_commercial_terms] CHECK CONSTRAINT [fk_cpct_currency]
GO
ALTER TABLE [dbo].[cp_commercial_terms]  WITH CHECK ADD  CONSTRAINT [fk_cpct_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[cp_commercial_terms] CHECK CONSTRAINT [fk_cpct_entity]
GO
ALTER TABLE [dbo].[cp_commercial_terms]  WITH CHECK ADD  CONSTRAINT [fk_cpct_incoterm] FOREIGN KEY([default_incoterm_id])
REFERENCES [dbo].[incoterm] ([incoterm_id])
GO
ALTER TABLE [dbo].[cp_commercial_terms] CHECK CONSTRAINT [fk_cpct_incoterm]
GO
ALTER TABLE [dbo].[cp_commercial_terms]  WITH CHECK ADD  CONSTRAINT [fk_cpct_payment] FOREIGN KEY([payment_term_id])
REFERENCES [dbo].[payment_term] ([payment_term_id])
GO
ALTER TABLE [dbo].[cp_commercial_terms] CHECK CONSTRAINT [fk_cpct_payment]
GO
ALTER TABLE [dbo].[cp_gtc_agreement]  WITH CHECK ADD  CONSTRAINT [fk_cpgtc_cp] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[cp_gtc_agreement] CHECK CONSTRAINT [fk_cpgtc_cp]
GO
ALTER TABLE [dbo].[cp_gtc_agreement]  WITH CHECK ADD  CONSTRAINT [fk_cpgtc_doc] FOREIGN KEY([document_store_id])
REFERENCES [dbo].[document_store] ([document_id])
GO
ALTER TABLE [dbo].[cp_gtc_agreement] CHECK CONSTRAINT [fk_cpgtc_doc]
GO
ALTER TABLE [dbo].[cp_gtc_agreement]  WITH CHECK ADD  CONSTRAINT [fk_cpgtc_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[cp_gtc_agreement] CHECK CONSTRAINT [fk_cpgtc_entity]
GO
ALTER TABLE [dbo].[cp_gtc_agreement]  WITH CHECK ADD  CONSTRAINT [fk_cpgtc_version] FOREIGN KEY([gtc_version_id])
REFERENCES [dbo].[gtc_version] ([gtc_version_id])
GO
ALTER TABLE [dbo].[cp_gtc_agreement] CHECK CONSTRAINT [fk_cpgtc_version]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [fk_cl_cp_country] FOREIGN KEY([cp_country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [fk_cl_cp_country]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [fk_cl_limit_ccy] FOREIGN KEY([limit_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [fk_cl_limit_ccy]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [fk_cl_parent_limit] FOREIGN KEY([parent_limit_id])
REFERENCES [dbo].[credit_limit] ([credit_limit_id])
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [fk_cl_parent_limit]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [fk_credit_limit_analyst] FOREIGN KEY([credit_analyst_user_id])
REFERENCES [dbo].[app_user] ([user_id])
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [fk_credit_limit_analyst]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [fk_credit_limit_cp] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [fk_credit_limit_cp]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [fk_credit_limit_status] FOREIGN KEY([status])
REFERENCES [dbo].[credit_limit_status_type] ([credit_limit_status_type_id])
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [fk_credit_limit_status]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [fk_credit_limit_type] FOREIGN KEY([limit_type])
REFERENCES [dbo].[credit_limit_type] ([credit_limit_type_id])
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [fk_credit_limit_type]
GO
ALTER TABLE [dbo].[credit_term]  WITH CHECK ADD  CONSTRAINT [fk_credit_term_margin_ccy] FOREIGN KEY([margin_call_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[credit_term] CHECK CONSTRAINT [fk_credit_term_margin_ccy]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate]  WITH CHECK ADD  CONSTRAINT [fk_ddr_commodity_type] FOREIGN KEY([commodity_type])
REFERENCES [dbo].[commodity_type] ([commodity_type_id])
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] CHECK CONSTRAINT [fk_ddr_commodity_type]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate]  WITH CHECK ADD  CONSTRAINT [fk_ddr_cp_type] FOREIGN KEY([charter_party_type_id])
REFERENCES [dbo].[charter_party_type] ([charter_party_type_id])
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] CHECK CONSTRAINT [fk_ddr_cp_type]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate]  WITH CHECK ADD  CONSTRAINT [fk_ddr_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] CHECK CONSTRAINT [fk_ddr_currency]
GO
ALTER TABLE [dbo].[desk]  WITH CHECK ADD  CONSTRAINT [fk_desk_commodity_type] FOREIGN KEY([commodity_type])
REFERENCES [dbo].[commodity_type] ([commodity_type_id])
GO
ALTER TABLE [dbo].[desk] CHECK CONSTRAINT [fk_desk_commodity_type]
GO
ALTER TABLE [dbo].[desk]  WITH CHECK ADD  CONSTRAINT [fk_desk_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[desk] CHECK CONSTRAINT [fk_desk_entity]
GO
ALTER TABLE [dbo].[desk]  WITH CHECK ADD  CONSTRAINT [fk_desk_head_trader] FOREIGN KEY([head_trader_id])
REFERENCES [dbo].[trader] ([trader_id])
GO
ALTER TABLE [dbo].[desk] CHECK CONSTRAINT [fk_desk_head_trader]
GO
ALTER TABLE [dbo].[emission_obligation]  WITH CHECK ADD FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[emission_obligation]  WITH CHECK ADD FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[emission_obligation]  WITH CHECK ADD FOREIGN KEY([scheme_id])
REFERENCES [dbo].[emission_scheme] ([scheme_id])
GO
ALTER TABLE [dbo].[emission_obligation]  WITH CHECK ADD FOREIGN KEY([scheme_id])
REFERENCES [dbo].[emission_scheme] ([scheme_id])
GO
ALTER TABLE [dbo].[emission_obligation]  WITH CHECK ADD  CONSTRAINT [fk_eo_status] FOREIGN KEY([status])
REFERENCES [dbo].[emission_obligation_status] ([emission_obligation_status_id])
GO
ALTER TABLE [dbo].[emission_obligation] CHECK CONSTRAINT [fk_eo_status]
GO
ALTER TABLE [dbo].[emission_scheme]  WITH CHECK ADD  CONSTRAINT [fk_es_scheme_type] FOREIGN KEY([scheme_type])
REFERENCES [dbo].[emission_scheme_type] ([emission_scheme_type_id])
GO
ALTER TABLE [dbo].[emission_scheme] CHECK CONSTRAINT [fk_es_scheme_type]
GO
ALTER TABLE [dbo].[energy_footprint]  WITH CHECK ADD  CONSTRAINT [fk_ef_ba] FOREIGN KEY([balancing_authority_id])
REFERENCES [dbo].[balancing_authority] ([balancing_authority_id])
GO
ALTER TABLE [dbo].[energy_footprint] CHECK CONSTRAINT [fk_ef_ba]
GO
ALTER TABLE [dbo].[energy_footprint]  WITH CHECK ADD  CONSTRAINT [fk_ef_load_shape] FOREIGN KEY([default_load_shape_id])
REFERENCES [dbo].[load_shape_template] ([load_shape_id])
GO
ALTER TABLE [dbo].[energy_footprint] CHECK CONSTRAINT [fk_ef_load_shape]
GO
ALTER TABLE [dbo].[energy_footprint]  WITH CHECK ADD  CONSTRAINT [fk_ef_operator] FOREIGN KEY([operator_counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[energy_footprint] CHECK CONSTRAINT [fk_ef_operator]
GO
ALTER TABLE [dbo].[energy_footprint]  WITH CHECK ADD  CONSTRAINT [fk_ef_owner] FOREIGN KEY([owner_counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[energy_footprint] CHECK CONSTRAINT [fk_ef_owner]
GO
ALTER TABLE [dbo].[energy_footprint]  WITH CHECK ADD  CONSTRAINT [fk_ef_zone] FOREIGN KEY([default_zone_id])
REFERENCES [dbo].[transmission_zone] ([zone_id])
GO
ALTER TABLE [dbo].[energy_footprint] CHECK CONSTRAINT [fk_ef_zone]
GO
ALTER TABLE [dbo].[energy_footprint_site]  WITH CHECK ADD  CONSTRAINT [fk_efs_footprint] FOREIGN KEY([energy_footprint_id])
REFERENCES [dbo].[energy_footprint] ([energy_footprint_id])
GO
ALTER TABLE [dbo].[energy_footprint_site] CHECK CONSTRAINT [fk_efs_footprint]
GO
ALTER TABLE [dbo].[energy_footprint_site]  WITH CHECK ADD  CONSTRAINT [fk_efs_generation_asset] FOREIGN KEY([generation_asset_id])
REFERENCES [dbo].[generation_asset] ([generation_asset_id])
GO
ALTER TABLE [dbo].[energy_footprint_site] CHECK CONSTRAINT [fk_efs_generation_asset]
GO
ALTER TABLE [dbo].[energy_footprint_site]  WITH CHECK ADD  CONSTRAINT [fk_efs_load_shape] FOREIGN KEY([site_load_shape_id])
REFERENCES [dbo].[load_shape_template] ([load_shape_id])
GO
ALTER TABLE [dbo].[energy_footprint_site] CHECK CONSTRAINT [fk_efs_load_shape]
GO
ALTER TABLE [dbo].[energy_footprint_site]  WITH CHECK ADD  CONSTRAINT [fk_efs_location] FOREIGN KEY([location_id])
REFERENCES [dbo].[location] ([location_id])
GO
ALTER TABLE [dbo].[energy_footprint_site] CHECK CONSTRAINT [fk_efs_location]
GO
ALTER TABLE [dbo].[energy_footprint_site]  WITH CHECK ADD  CONSTRAINT [fk_efs_zone] FOREIGN KEY([zone_id])
REFERENCES [dbo].[transmission_zone] ([zone_id])
GO
ALTER TABLE [dbo].[energy_footprint_site] CHECK CONSTRAINT [fk_efs_zone]
GO
ALTER TABLE [dbo].[environmental_product]  WITH CHECK ADD FOREIGN KEY([registry_id])
REFERENCES [dbo].[carbon_registry] ([registry_id])
GO
ALTER TABLE [dbo].[environmental_product]  WITH CHECK ADD FOREIGN KEY([registry_id])
REFERENCES [dbo].[carbon_registry] ([registry_id])
GO
ALTER TABLE [dbo].[environmental_product]  WITH CHECK ADD FOREIGN KEY([scheme_id])
REFERENCES [dbo].[emission_scheme] ([scheme_id])
GO
ALTER TABLE [dbo].[environmental_product]  WITH CHECK ADD FOREIGN KEY([scheme_id])
REFERENCES [dbo].[emission_scheme] ([scheme_id])
GO
ALTER TABLE [dbo].[environmental_product]  WITH CHECK ADD  CONSTRAINT [fk_ep_product_type] FOREIGN KEY([product_type])
REFERENCES [dbo].[environmental_product_type] ([environmental_product_type_id])
GO
ALTER TABLE [dbo].[environmental_product] CHECK CONSTRAINT [fk_ep_product_type]
GO
ALTER TABLE [dbo].[event_type]  WITH CHECK ADD  CONSTRAINT [fk_et_category] FOREIGN KEY([category_id])
REFERENCES [dbo].[event_category] ([category_id])
GO
ALTER TABLE [dbo].[event_type] CHECK CONSTRAINT [fk_et_category]
GO
ALTER TABLE [dbo].[exchange]  WITH CHECK ADD  CONSTRAINT [fk_exch_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[exchange] CHECK CONSTRAINT [fk_exch_currency]
GO
ALTER TABLE [dbo].[exchange]  WITH CHECK ADD  CONSTRAINT [fk_exchange_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[exchange] CHECK CONSTRAINT [fk_exchange_country]
GO
ALTER TABLE [dbo].[field_permission_rule]  WITH CHECK ADD  CONSTRAINT [fk_fpr_field] FOREIGN KEY([field_id])
REFERENCES [dbo].[screen_field_registry] ([field_id])
GO
ALTER TABLE [dbo].[field_permission_rule] CHECK CONSTRAINT [fk_fpr_field]
GO
ALTER TABLE [dbo].[field_permission_rule]  WITH CHECK ADD  CONSTRAINT [fk_fpr_profile] FOREIGN KEY([profile_id])
REFERENCES [dbo].[field_permission_profile] ([profile_id])
GO
ALTER TABLE [dbo].[field_permission_rule] CHECK CONSTRAINT [fk_fpr_profile]
GO
ALTER TABLE [dbo].[freight_rate_index]  WITH CHECK ADD  CONSTRAINT [fk_fri_commodity_type] FOREIGN KEY([commodity_type])
REFERENCES [dbo].[commodity_type] ([commodity_type_id])
GO
ALTER TABLE [dbo].[freight_rate_index] CHECK CONSTRAINT [fk_fri_commodity_type]
GO
ALTER TABLE [dbo].[freight_rate_index]  WITH CHECK ADD  CONSTRAINT [fk_fri_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[freight_rate_index] CHECK CONSTRAINT [fk_fri_currency]
GO
ALTER TABLE [dbo].[freight_rate_index]  WITH CHECK ADD  CONSTRAINT [fk_fri_uom] FOREIGN KEY([uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[freight_rate_index] CHECK CONSTRAINT [fk_fri_uom]
GO
ALTER TABLE [dbo].[fx_rate]  WITH CHECK ADD  CONSTRAINT [fk_fx_from] FOREIGN KEY([from_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[fx_rate] CHECK CONSTRAINT [fk_fx_from]
GO
ALTER TABLE [dbo].[fx_rate]  WITH CHECK ADD  CONSTRAINT [fk_fx_rate_period] FOREIGN KEY([fx_period_id])
REFERENCES [dbo].[fx_period] ([fx_period_id])
GO
ALTER TABLE [dbo].[fx_rate] CHECK CONSTRAINT [fk_fx_rate_period]
GO
ALTER TABLE [dbo].[fx_rate]  WITH CHECK ADD  CONSTRAINT [fk_fx_to] FOREIGN KEY([to_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[fx_rate] CHECK CONSTRAINT [fk_fx_to]
GO
ALTER TABLE [dbo].[generation_asset]  WITH CHECK ADD  CONSTRAINT [fk_ga_ba] FOREIGN KEY([balancing_authority_id])
REFERENCES [dbo].[balancing_authority] ([balancing_authority_id])
GO
ALTER TABLE [dbo].[generation_asset] CHECK CONSTRAINT [fk_ga_ba]
GO
ALTER TABLE [dbo].[generation_asset]  WITH CHECK ADD  CONSTRAINT [fk_ga_location] FOREIGN KEY([location_id])
REFERENCES [dbo].[location] ([location_id])
GO
ALTER TABLE [dbo].[generation_asset] CHECK CONSTRAINT [fk_ga_location]
GO
ALTER TABLE [dbo].[generation_asset]  WITH CHECK ADD  CONSTRAINT [fk_ga_owner] FOREIGN KEY([owner_counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[generation_asset] CHECK CONSTRAINT [fk_ga_owner]
GO
ALTER TABLE [dbo].[generation_asset]  WITH CHECK ADD  CONSTRAINT [fk_ga_zone] FOREIGN KEY([zone_id])
REFERENCES [dbo].[transmission_zone] ([zone_id])
GO
ALTER TABLE [dbo].[generation_asset] CHECK CONSTRAINT [fk_ga_zone]
GO
ALTER TABLE [dbo].[gl_account]  WITH CHECK ADD  CONSTRAINT [fk_gl_account_book] FOREIGN KEY([book_id])
REFERENCES [dbo].[book] ([book_id])
GO
ALTER TABLE [dbo].[gl_account] CHECK CONSTRAINT [fk_gl_account_book]
GO
ALTER TABLE [dbo].[gl_account]  WITH CHECK ADD  CONSTRAINT [fk_gl_account_ccy] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[gl_account] CHECK CONSTRAINT [fk_gl_account_ccy]
GO
ALTER TABLE [dbo].[gl_account]  WITH CHECK ADD  CONSTRAINT [fk_gl_account_commodity_type] FOREIGN KEY([commodity_type])
REFERENCES [dbo].[commodity_type] ([commodity_type_id])
GO
ALTER TABLE [dbo].[gl_account] CHECK CONSTRAINT [fk_gl_account_commodity_type]
GO
ALTER TABLE [dbo].[gl_account]  WITH CHECK ADD  CONSTRAINT [fk_gl_account_legal_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[gl_account] CHECK CONSTRAINT [fk_gl_account_legal_entity]
GO
ALTER TABLE [dbo].[gl_account]  WITH CHECK ADD  CONSTRAINT [fk_gl_account_parent] FOREIGN KEY([parent_account_id])
REFERENCES [dbo].[gl_account] ([account_id])
GO
ALTER TABLE [dbo].[gl_account] CHECK CONSTRAINT [fk_gl_account_parent]
GO
ALTER TABLE [dbo].[gl_account]  WITH CHECK ADD  CONSTRAINT [fk_gl_account_type] FOREIGN KEY([account_type])
REFERENCES [dbo].[lookup_value] ([lookup_id])
GO
ALTER TABLE [dbo].[gl_account] CHECK CONSTRAINT [fk_gl_account_type]
GO
ALTER TABLE [dbo].[gtc]  WITH CHECK ADD  CONSTRAINT [fk_gtc_jurisdiction] FOREIGN KEY([jurisdiction_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[gtc] CHECK CONSTRAINT [fk_gtc_jurisdiction]
GO
ALTER TABLE [dbo].[gtc_version]  WITH CHECK ADD  CONSTRAINT [fk_gtcv_doc] FOREIGN KEY([document_store_id])
REFERENCES [dbo].[document_store] ([document_id])
GO
ALTER TABLE [dbo].[gtc_version] CHECK CONSTRAINT [fk_gtcv_doc]
GO
ALTER TABLE [dbo].[gtc_version]  WITH CHECK ADD  CONSTRAINT [fk_gtcv_gtc] FOREIGN KEY([gtc_id])
REFERENCES [dbo].[gtc] ([gtc_id])
GO
ALTER TABLE [dbo].[gtc_version] CHECK CONSTRAINT [fk_gtcv_gtc]
GO
ALTER TABLE [dbo].[holiday_calendar]  WITH CHECK ADD  CONSTRAINT [fk_hc_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[holiday_calendar] CHECK CONSTRAINT [fk_hc_country]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [fk_ipol_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [fk_ipol_currency]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [fk_ipol_doc] FOREIGN KEY([document_store_id])
REFERENCES [dbo].[document_store] ([document_id])
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [fk_ipol_doc]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [fk_ipol_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [fk_ipol_entity]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [fk_ipol_prem_ccy] FOREIGN KEY([premium_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [fk_ipol_prem_ccy]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [fk_ipol_provider] FOREIGN KEY([provider_id])
REFERENCES [dbo].[insurance_provider] ([provider_id])
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [fk_ipol_provider]
GO
ALTER TABLE [dbo].[insurance_provider]  WITH CHECK ADD  CONSTRAINT [fk_insurance_provider_country_id] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[insurance_provider] CHECK CONSTRAINT [fk_insurance_provider_country_id]
GO
ALTER TABLE [dbo].[insurance_provider]  WITH CHECK ADD  CONSTRAINT [fk_ip_cp] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[insurance_provider] CHECK CONSTRAINT [fk_ip_cp]
GO
ALTER TABLE [dbo].[insurance_provider]  WITH CHECK ADD  CONSTRAINT [fk_ip_rating] FOREIGN KEY([credit_rating_id])
REFERENCES [dbo].[credit_rating] ([credit_rating_id])
GO
ALTER TABLE [dbo].[insurance_provider] CHECK CONSTRAINT [fk_ip_rating]
GO
ALTER TABLE [dbo].[intercompany_transfer_rule]  WITH CHECK ADD  CONSTRAINT [fk_itr_currency] FOREIGN KEY([markup_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[intercompany_transfer_rule] CHECK CONSTRAINT [fk_itr_currency]
GO
ALTER TABLE [dbo].[intercompany_transfer_rule]  WITH CHECK ADD  CONSTRAINT [fk_itr_dest] FOREIGN KEY([destination_legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[intercompany_transfer_rule] CHECK CONSTRAINT [fk_itr_dest]
GO
ALTER TABLE [dbo].[intercompany_transfer_rule]  WITH CHECK ADD  CONSTRAINT [fk_itr_source] FOREIGN KEY([source_legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[intercompany_transfer_rule] CHECK CONSTRAINT [fk_itr_source]
GO
ALTER TABLE [dbo].[interconnector]  WITH CHECK ADD  CONSTRAINT [fk_ic_from] FOREIGN KEY([from_zone_id])
REFERENCES [dbo].[transmission_zone] ([zone_id])
GO
ALTER TABLE [dbo].[interconnector] CHECK CONSTRAINT [fk_ic_from]
GO
ALTER TABLE [dbo].[interconnector]  WITH CHECK ADD  CONSTRAINT [fk_ic_to] FOREIGN KEY([to_zone_id])
REFERENCES [dbo].[transmission_zone] ([zone_id])
GO
ALTER TABLE [dbo].[interconnector] CHECK CONSTRAINT [fk_ic_to]
GO
ALTER TABLE [dbo].[interest_rate_index]  WITH CHECK ADD  CONSTRAINT [fk_iri_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[interest_rate_index] CHECK CONSTRAINT [fk_iri_currency]
GO
ALTER TABLE [dbo].[interest_rate_index]  WITH CHECK ADD  CONSTRAINT [fk_iri_replaces] FOREIGN KEY([replaces_index_id])
REFERENCES [dbo].[interest_rate_index] ([rate_index_id])
GO
ALTER TABLE [dbo].[interest_rate_index] CHECK CONSTRAINT [fk_iri_replaces]
GO
ALTER TABLE [dbo].[laytime_term_template]  WITH CHECK ADD  CONSTRAINT [fk_ltt_commodity_type] FOREIGN KEY([commodity_type])
REFERENCES [dbo].[commodity_type] ([commodity_type_id])
GO
ALTER TABLE [dbo].[laytime_term_template] CHECK CONSTRAINT [fk_ltt_commodity_type]
GO
ALTER TABLE [dbo].[legal_entity]  WITH CHECK ADD  CONSTRAINT [fk_le_currency] FOREIGN KEY([base_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[legal_entity] CHECK CONSTRAINT [fk_le_currency]
GO
ALTER TABLE [dbo].[legal_entity]  WITH CHECK ADD  CONSTRAINT [fk_le_incorporation_country] FOREIGN KEY([incorporation_country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[legal_entity] CHECK CONSTRAINT [fk_le_incorporation_country]
GO
ALTER TABLE [dbo].[legal_entity]  WITH CHECK ADD  CONSTRAINT [fk_le_jurisdiction] FOREIGN KEY([jurisdiction_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[legal_entity] CHECK CONSTRAINT [fk_le_jurisdiction]
GO
ALTER TABLE [dbo].[legal_entity]  WITH CHECK ADD  CONSTRAINT [fk_le_parent] FOREIGN KEY([parent_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[legal_entity] CHECK CONSTRAINT [fk_le_parent]
GO
ALTER TABLE [dbo].[legal_entity]  WITH CHECK ADD  CONSTRAINT [fk_legal_entity_type_id] FOREIGN KEY([entity_type])
REFERENCES [dbo].[legal_entity_type] ([legal_entity_type_id])
GO
ALTER TABLE [dbo].[legal_entity] CHECK CONSTRAINT [fk_legal_entity_type_id]
GO
ALTER TABLE [dbo].[letter_of_credit]  WITH CHECK ADD  CONSTRAINT [fk_lc_cp] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[letter_of_credit] CHECK CONSTRAINT [fk_lc_cp]
GO
ALTER TABLE [dbo].[letter_of_credit]  WITH CHECK ADD  CONSTRAINT [fk_lc_lc_ccy] FOREIGN KEY([lc_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[letter_of_credit] CHECK CONSTRAINT [fk_lc_lc_ccy]
GO
ALTER TABLE [dbo].[letter_of_credit]  WITH CHECK ADD  CONSTRAINT [fk_lc_le] FOREIGN KEY([beneficiary_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[letter_of_credit] CHECK CONSTRAINT [fk_lc_le]
GO
ALTER TABLE [dbo].[letter_of_credit]  WITH CHECK ADD  CONSTRAINT [fk_lc_status] FOREIGN KEY([status])
REFERENCES [dbo].[lc_status_type] ([lc_status_type_id])
GO
ALTER TABLE [dbo].[letter_of_credit] CHECK CONSTRAINT [fk_lc_status]
GO
ALTER TABLE [dbo].[letter_of_credit]  WITH CHECK ADD  CONSTRAINT [fk_lc_type] FOREIGN KEY([lc_type])
REFERENCES [dbo].[lc_type] ([lc_type_id])
GO
ALTER TABLE [dbo].[letter_of_credit] CHECK CONSTRAINT [fk_lc_type]
GO
ALTER TABLE [dbo].[lng_boil_off_rule]  WITH CHECK ADD  CONSTRAINT [fk_lbor_facility] FOREIGN KEY([facility_id])
REFERENCES [dbo].[storage_facility] ([facility_id])
GO
ALTER TABLE [dbo].[lng_boil_off_rule] CHECK CONSTRAINT [fk_lbor_facility]
GO
ALTER TABLE [dbo].[lng_boil_off_rule]  WITH CHECK ADD  CONSTRAINT [fk_lbor_vessel] FOREIGN KEY([vessel_id])
REFERENCES [dbo].[vessel] ([vessel_id])
GO
ALTER TABLE [dbo].[lng_boil_off_rule] CHECK CONSTRAINT [fk_lbor_vessel]
GO
ALTER TABLE [dbo].[lng_terminal_detail]  WITH CHECK ADD  CONSTRAINT [fk_ltd_facility] FOREIGN KEY([facility_id])
REFERENCES [dbo].[storage_facility] ([facility_id])
GO
ALTER TABLE [dbo].[lng_terminal_detail] CHECK CONSTRAINT [fk_ltd_facility]
GO
ALTER TABLE [dbo].[load_shape_component]  WITH CHECK ADD  CONSTRAINT [fk_lsc_child] FOREIGN KEY([child_load_shape_id])
REFERENCES [dbo].[load_shape_template] ([load_shape_id])
GO
ALTER TABLE [dbo].[load_shape_component] CHECK CONSTRAINT [fk_lsc_child]
GO
ALTER TABLE [dbo].[load_shape_component]  WITH CHECK ADD  CONSTRAINT [fk_lsc_parent] FOREIGN KEY([parent_load_shape_id])
REFERENCES [dbo].[load_shape_template] ([load_shape_id])
GO
ALTER TABLE [dbo].[load_shape_component] CHECK CONSTRAINT [fk_lsc_parent]
GO
ALTER TABLE [dbo].[load_shape_interval]  WITH CHECK ADD  CONSTRAINT [fk_lsi_shape] FOREIGN KEY([load_shape_id])
REFERENCES [dbo].[load_shape_template] ([load_shape_id])
GO
ALTER TABLE [dbo].[load_shape_interval] CHECK CONSTRAINT [fk_lsi_shape]
GO
ALTER TABLE [dbo].[location]  WITH CHECK ADD  CONSTRAINT [fk_loc_type] FOREIGN KEY([location_type_id])
REFERENCES [dbo].[location_type] ([location_type_id])
GO
ALTER TABLE [dbo].[location] CHECK CONSTRAINT [fk_loc_type]
GO
ALTER TABLE [dbo].[location]  WITH CHECK ADD  CONSTRAINT [fk_loc_uom] FOREIGN KEY([capacity_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[location] CHECK CONSTRAINT [fk_loc_uom]
GO
ALTER TABLE [dbo].[location]  WITH CHECK ADD  CONSTRAINT [fk_location_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[location] CHECK CONSTRAINT [fk_location_country]
GO
ALTER TABLE [dbo].[location_type]  WITH CHECK ADD  CONSTRAINT [fk_loctype_commodity_type] FOREIGN KEY([commodity_type])
REFERENCES [dbo].[commodity_type] ([commodity_type_id])
GO
ALTER TABLE [dbo].[location_type] CHECK CONSTRAINT [fk_loctype_commodity_type]
GO
ALTER TABLE [dbo].[lookup_value]  WITH CHECK ADD  CONSTRAINT [fk_lookup_value_category] FOREIGN KEY([category_id])
REFERENCES [dbo].[lookup_category] ([category_id])
GO
ALTER TABLE [dbo].[lookup_value] CHECK CONSTRAINT [fk_lookup_value_category]
GO
ALTER TABLE [dbo].[margin_account]  WITH CHECK ADD  CONSTRAINT [fk_ma_broker] FOREIGN KEY([clearing_broker_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[margin_account] CHECK CONSTRAINT [fk_ma_broker]
GO
ALTER TABLE [dbo].[margin_account]  WITH CHECK ADD  CONSTRAINT [fk_ma_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[margin_account] CHECK CONSTRAINT [fk_ma_currency]
GO
ALTER TABLE [dbo].[margin_account]  WITH CHECK ADD  CONSTRAINT [fk_ma_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[margin_account] CHECK CONSTRAINT [fk_ma_entity]
GO
ALTER TABLE [dbo].[margin_account]  WITH CHECK ADD  CONSTRAINT [fk_ma_market] FOREIGN KEY([market_id])
REFERENCES [dbo].[market] ([market_id])
GO
ALTER TABLE [dbo].[margin_account] CHECK CONSTRAINT [fk_ma_market]
GO
ALTER TABLE [dbo].[margin_agreement]  WITH CHECK ADD  CONSTRAINT [fk_ma_cp_threshold_ccy] FOREIGN KEY([cp_threshold_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[margin_agreement] CHECK CONSTRAINT [fk_ma_cp_threshold_ccy]
GO
ALTER TABLE [dbo].[margin_agreement]  WITH CHECK ADD  CONSTRAINT [fk_ma_indep_amt_ccy] FOREIGN KEY([independent_amount_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[margin_agreement] CHECK CONSTRAINT [fk_ma_indep_amt_ccy]
GO
ALTER TABLE [dbo].[margin_agreement]  WITH CHECK ADD  CONSTRAINT [fk_ma_mta_ccy] FOREIGN KEY([mta_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[margin_agreement] CHECK CONSTRAINT [fk_ma_mta_ccy]
GO
ALTER TABLE [dbo].[margin_agreement]  WITH CHECK ADD  CONSTRAINT [fk_ma_threshold_ccy] FOREIGN KEY([threshold_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[margin_agreement] CHECK CONSTRAINT [fk_ma_threshold_ccy]
GO
ALTER TABLE [dbo].[margin_agreement]  WITH CHECK ADD  CONSTRAINT [fk_margin_agr_cp] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[margin_agreement] CHECK CONSTRAINT [fk_margin_agr_cp]
GO
ALTER TABLE [dbo].[margin_agreement]  WITH CHECK ADD  CONSTRAINT [fk_margin_agr_type] FOREIGN KEY([agreement_type])
REFERENCES [dbo].[margin_agreement_type] ([margin_agreement_type_id])
GO
ALTER TABLE [dbo].[margin_agreement] CHECK CONSTRAINT [fk_margin_agr_type]
GO
ALTER TABLE [dbo].[margin_agreement]  WITH CHECK ADD  CONSTRAINT [fk_margin_gov_law] FOREIGN KEY([gov_law])
REFERENCES [dbo].[governing_law_type] ([governing_law_type_id])
GO
ALTER TABLE [dbo].[margin_agreement] CHECK CONSTRAINT [fk_margin_gov_law]
GO
ALTER TABLE [dbo].[margin_agreement]  WITH CHECK ADD  CONSTRAINT [fk_margin_val_freq] FOREIGN KEY([valuation_frequency])
REFERENCES [dbo].[valuation_frequency_type] ([valuation_frequency_type_id])
GO
ALTER TABLE [dbo].[margin_agreement] CHECK CONSTRAINT [fk_margin_val_freq]
GO
ALTER TABLE [dbo].[market]  WITH CHECK ADD  CONSTRAINT [fk_market_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[market] CHECK CONSTRAINT [fk_market_country]
GO
ALTER TABLE [dbo].[market]  WITH CHECK ADD  CONSTRAINT [fk_mkt_commodity] FOREIGN KEY([commodity_id])
REFERENCES [dbo].[commodity] ([commodity_id])
GO
ALTER TABLE [dbo].[market] CHECK CONSTRAINT [fk_mkt_commodity]
GO
ALTER TABLE [dbo].[market]  WITH CHECK ADD  CONSTRAINT [fk_mkt_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[market] CHECK CONSTRAINT [fk_mkt_currency]
GO
ALTER TABLE [dbo].[market]  WITH CHECK ADD  CONSTRAINT [fk_mkt_exchange] FOREIGN KEY([exchange_id])
REFERENCES [dbo].[exchange] ([exchange_id])
GO
ALTER TABLE [dbo].[market] CHECK CONSTRAINT [fk_mkt_exchange]
GO
ALTER TABLE [dbo].[market]  WITH CHECK ADD  CONSTRAINT [fk_mkt_uom] FOREIGN KEY([contract_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[market] CHECK CONSTRAINT [fk_mkt_uom]
GO
ALTER TABLE [dbo].[metal_assay_component_rule]  WITH CHECK ADD  CONSTRAINT [fk_marc_currency] FOREIGN KEY([penalty_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[metal_assay_component_rule] CHECK CONSTRAINT [fk_marc_currency]
GO
ALTER TABLE [dbo].[metal_assay_component_rule]  WITH CHECK ADD  CONSTRAINT [fk_marc_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[metal_assay_component_rule] CHECK CONSTRAINT [fk_marc_product]
GO
ALTER TABLE [dbo].[metal_assay_component_rule]  WITH CHECK ADD  CONSTRAINT [fk_marc_uom] FOREIGN KEY([penalty_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[metal_assay_component_rule] CHECK CONSTRAINT [fk_marc_uom]
GO
ALTER TABLE [dbo].[metal_brand]  WITH CHECK ADD  CONSTRAINT [fk_mb_commodity_family] FOREIGN KEY([commodity_family_id])
REFERENCES [dbo].[commodity_family] ([commodity_family_id])
GO
ALTER TABLE [dbo].[metal_brand] CHECK CONSTRAINT [fk_mb_commodity_family]
GO
ALTER TABLE [dbo].[metal_brand]  WITH CHECK ADD  CONSTRAINT [fk_mb_metal_form] FOREIGN KEY([metal_form])
REFERENCES [dbo].[metal_shape] ([metal_shape_id])
GO
ALTER TABLE [dbo].[metal_brand] CHECK CONSTRAINT [fk_mb_metal_form]
GO
ALTER TABLE [dbo].[metal_brand]  WITH CHECK ADD  CONSTRAINT [fk_metal_brand_country] FOREIGN KEY([country_of_origin_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[metal_brand] CHECK CONSTRAINT [fk_metal_brand_country]
GO
ALTER TABLE [dbo].[metal_warrant]  WITH CHECK ADD  CONSTRAINT [fk_mw_brand] FOREIGN KEY([metal_brand_id])
REFERENCES [dbo].[metal_brand] ([metal_brand_id])
GO
ALTER TABLE [dbo].[metal_warrant] CHECK CONSTRAINT [fk_mw_brand]
GO
ALTER TABLE [dbo].[metal_warrant]  WITH CHECK ADD  CONSTRAINT [fk_mw_facility] FOREIGN KEY([facility_id])
REFERENCES [dbo].[storage_facility] ([facility_id])
GO
ALTER TABLE [dbo].[metal_warrant] CHECK CONSTRAINT [fk_mw_facility]
GO
ALTER TABLE [dbo].[metal_warrant]  WITH CHECK ADD  CONSTRAINT [fk_mw_holder] FOREIGN KEY([holder_counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[metal_warrant] CHECK CONSTRAINT [fk_mw_holder]
GO
ALTER TABLE [dbo].[metal_warrant]  WITH CHECK ADD  CONSTRAINT [fk_mw_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[metal_warrant] CHECK CONSTRAINT [fk_mw_product]
GO
ALTER TABLE [dbo].[metal_warrant]  WITH CHECK ADD  CONSTRAINT [fk_mw_shape] FOREIGN KEY([metal_shape_id])
REFERENCES [dbo].[metal_shape] ([metal_shape_id])
GO
ALTER TABLE [dbo].[metal_warrant] CHECK CONSTRAINT [fk_mw_shape]
GO
ALTER TABLE [dbo].[netting_agreement]  WITH CHECK ADD  CONSTRAINT [fk_netting_agreement_type_id] FOREIGN KEY([agreement_type])
REFERENCES [dbo].[netting_agreement_type] ([netting_agreement_type_id])
GO
ALTER TABLE [dbo].[netting_agreement] CHECK CONSTRAINT [fk_netting_agreement_type_id]
GO
ALTER TABLE [dbo].[netting_agreement]  WITH CHECK ADD  CONSTRAINT [fk_netting_cp] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[netting_agreement] CHECK CONSTRAINT [fk_netting_cp]
GO
ALTER TABLE [dbo].[netting_agreement]  WITH CHECK ADD  CONSTRAINT [fk_netting_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[netting_agreement] CHECK CONSTRAINT [fk_netting_entity]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [fk_pcg_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [fk_pcg_currency]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [fk_pcg_document] FOREIGN KEY([document_store_id])
REFERENCES [dbo].[document_store] ([document_id])
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [fk_pcg_document]
GO
ALTER TABLE [dbo].[payment_calendar_assignment]  WITH CHECK ADD  CONSTRAINT [fk_pca_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[payment_calendar_assignment] CHECK CONSTRAINT [fk_pca_currency]
GO
ALTER TABLE [dbo].[payment_calendar_assignment]  WITH CHECK ADD  CONSTRAINT [fk_pca_location] FOREIGN KEY([location_id])
REFERENCES [dbo].[location] ([location_id])
GO
ALTER TABLE [dbo].[payment_calendar_assignment] CHECK CONSTRAINT [fk_pca_location]
GO
ALTER TABLE [dbo].[payment_calendar_assignment]  WITH CHECK ADD  CONSTRAINT [fk_pca_primary_cal] FOREIGN KEY([primary_holiday_calendar_id])
REFERENCES [dbo].[holiday_calendar] ([calendar_id])
GO
ALTER TABLE [dbo].[payment_calendar_assignment] CHECK CONSTRAINT [fk_pca_primary_cal]
GO
ALTER TABLE [dbo].[payment_calendar_assignment]  WITH CHECK ADD  CONSTRAINT [fk_pca_secondary_cal] FOREIGN KEY([secondary_holiday_calendar_id])
REFERENCES [dbo].[holiday_calendar] ([calendar_id])
GO
ALTER TABLE [dbo].[payment_calendar_assignment] CHECK CONSTRAINT [fk_pca_secondary_cal]
GO
ALTER TABLE [dbo].[payment_calendar_assignment]  WITH CHECK ADD  CONSTRAINT [fk_pca_term] FOREIGN KEY([payment_term_id])
REFERENCES [dbo].[payment_term] ([payment_term_id])
GO
ALTER TABLE [dbo].[payment_calendar_assignment] CHECK CONSTRAINT [fk_pca_term]
GO
ALTER TABLE [dbo].[payment_term]  WITH CHECK ADD  CONSTRAINT [fk_payment_term_method_id] FOREIGN KEY([payment_method])
REFERENCES [dbo].[payment_method] ([payment_method_id])
GO
ALTER TABLE [dbo].[payment_term] CHECK CONSTRAINT [fk_payment_term_method_id]
GO
ALTER TABLE [dbo].[payment_term]  WITH CHECK ADD  CONSTRAINT [fk_pt_calendar] FOREIGN KEY([calendar_id])
REFERENCES [dbo].[holiday_calendar] ([calendar_id])
GO
ALTER TABLE [dbo].[payment_term] CHECK CONSTRAINT [fk_pt_calendar]
GO
ALTER TABLE [dbo].[period]  WITH CHECK ADD  CONSTRAINT [fk_period_commodity_type] FOREIGN KEY([commodity_type])
REFERENCES [dbo].[commodity_type] ([commodity_type_id])
GO
ALTER TABLE [dbo].[period] CHECK CONSTRAINT [fk_period_commodity_type]
GO
ALTER TABLE [dbo].[period]  WITH CHECK ADD  CONSTRAINT [fk_period_gas_day_type] FOREIGN KEY([gas_day_type_lookup_id])
REFERENCES [dbo].[lookup_value] ([lookup_id])
GO
ALTER TABLE [dbo].[period] CHECK CONSTRAINT [fk_period_gas_day_type]
GO
ALTER TABLE [dbo].[period]  WITH CHECK ADD  CONSTRAINT [fk_period_load_type] FOREIGN KEY([load_type_lookup_id])
REFERENCES [dbo].[lookup_value] ([lookup_id])
GO
ALTER TABLE [dbo].[period] CHECK CONSTRAINT [fk_period_load_type]
GO
ALTER TABLE [dbo].[pipeline]  WITH CHECK ADD  CONSTRAINT [fk_pl_operator] FOREIGN KEY([operator_id])
REFERENCES [dbo].[transport_operator] ([operator_id])
GO
ALTER TABLE [dbo].[pipeline] CHECK CONSTRAINT [fk_pl_operator]
GO
ALTER TABLE [dbo].[pipeline]  WITH CHECK ADD  CONSTRAINT [fk_pl_owner] FOREIGN KEY([owner_operator_id])
REFERENCES [dbo].[transport_operator] ([operator_id])
GO
ALTER TABLE [dbo].[pipeline] CHECK CONSTRAINT [fk_pl_owner]
GO
ALTER TABLE [dbo].[pipeline]  WITH CHECK ADD  CONSTRAINT [fk_pl_uom] FOREIGN KEY([max_capacity_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[pipeline] CHECK CONSTRAINT [fk_pl_uom]
GO
ALTER TABLE [dbo].[pipeline_cycle]  WITH CHECK ADD  CONSTRAINT [fk_pc_calendar] FOREIGN KEY([calendar_id])
REFERENCES [dbo].[holiday_calendar] ([calendar_id])
GO
ALTER TABLE [dbo].[pipeline_cycle] CHECK CONSTRAINT [fk_pc_calendar]
GO
ALTER TABLE [dbo].[pipeline_cycle]  WITH CHECK ADD  CONSTRAINT [fk_pc_pipeline] FOREIGN KEY([pipeline_id])
REFERENCES [dbo].[pipeline] ([pipeline_id])
GO
ALTER TABLE [dbo].[pipeline_cycle] CHECK CONSTRAINT [fk_pc_pipeline]
GO
ALTER TABLE [dbo].[pipeline_cycle]  WITH CHECK ADD  CONSTRAINT [fk_pc_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[pipeline_cycle] CHECK CONSTRAINT [fk_pc_product]
GO
ALTER TABLE [dbo].[pipeline_point]  WITH CHECK ADD  CONSTRAINT [fk_pp_facility] FOREIGN KEY([facility_id])
REFERENCES [dbo].[storage_facility] ([facility_id])
GO
ALTER TABLE [dbo].[pipeline_point] CHECK CONSTRAINT [fk_pp_facility]
GO
ALTER TABLE [dbo].[pipeline_point]  WITH CHECK ADD  CONSTRAINT [fk_pp_interconnect] FOREIGN KEY([interconnect_pipeline_id])
REFERENCES [dbo].[pipeline] ([pipeline_id])
GO
ALTER TABLE [dbo].[pipeline_point] CHECK CONSTRAINT [fk_pp_interconnect]
GO
ALTER TABLE [dbo].[pipeline_point]  WITH CHECK ADD  CONSTRAINT [fk_pp_location] FOREIGN KEY([location_id])
REFERENCES [dbo].[location] ([location_id])
GO
ALTER TABLE [dbo].[pipeline_point] CHECK CONSTRAINT [fk_pp_location]
GO
ALTER TABLE [dbo].[pipeline_point]  WITH CHECK ADD  CONSTRAINT [fk_pp_pipeline] FOREIGN KEY([pipeline_id])
REFERENCES [dbo].[pipeline] ([pipeline_id])
GO
ALTER TABLE [dbo].[pipeline_point] CHECK CONSTRAINT [fk_pp_pipeline]
GO
ALTER TABLE [dbo].[pipeline_point]  WITH CHECK ADD  CONSTRAINT [fk_pp_uom] FOREIGN KEY([capacity_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[pipeline_point] CHECK CONSTRAINT [fk_pp_uom]
GO
ALTER TABLE [dbo].[pipeline_segment]  WITH CHECK ADD  CONSTRAINT [fk_ps_from] FOREIGN KEY([from_point_id])
REFERENCES [dbo].[pipeline_point] ([point_id])
GO
ALTER TABLE [dbo].[pipeline_segment] CHECK CONSTRAINT [fk_ps_from]
GO
ALTER TABLE [dbo].[pipeline_segment]  WITH CHECK ADD  CONSTRAINT [fk_ps_pipeline] FOREIGN KEY([pipeline_id])
REFERENCES [dbo].[pipeline] ([pipeline_id])
GO
ALTER TABLE [dbo].[pipeline_segment] CHECK CONSTRAINT [fk_ps_pipeline]
GO
ALTER TABLE [dbo].[pipeline_segment]  WITH CHECK ADD  CONSTRAINT [fk_ps_to] FOREIGN KEY([to_point_id])
REFERENCES [dbo].[pipeline_point] ([point_id])
GO
ALTER TABLE [dbo].[pipeline_segment] CHECK CONSTRAINT [fk_ps_to]
GO
ALTER TABLE [dbo].[pipeline_segment]  WITH CHECK ADD  CONSTRAINT [fk_ps_uom] FOREIGN KEY([capacity_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[pipeline_segment] CHECK CONSTRAINT [fk_ps_uom]
GO
ALTER TABLE [dbo].[pipeline_tariff]  WITH CHECK ADD  CONSTRAINT [fk_ptar_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[pipeline_tariff] CHECK CONSTRAINT [fk_ptar_currency]
GO
ALTER TABLE [dbo].[pipeline_tariff]  WITH CHECK ADD  CONSTRAINT [fk_ptar_from] FOREIGN KEY([from_point_id])
REFERENCES [dbo].[pipeline_point] ([point_id])
GO
ALTER TABLE [dbo].[pipeline_tariff] CHECK CONSTRAINT [fk_ptar_from]
GO
ALTER TABLE [dbo].[pipeline_tariff]  WITH CHECK ADD  CONSTRAINT [fk_ptar_pipeline] FOREIGN KEY([pipeline_id])
REFERENCES [dbo].[pipeline] ([pipeline_id])
GO
ALTER TABLE [dbo].[pipeline_tariff] CHECK CONSTRAINT [fk_ptar_pipeline]
GO
ALTER TABLE [dbo].[pipeline_tariff]  WITH CHECK ADD  CONSTRAINT [fk_ptar_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[pipeline_tariff] CHECK CONSTRAINT [fk_ptar_product]
GO
ALTER TABLE [dbo].[pipeline_tariff]  WITH CHECK ADD  CONSTRAINT [fk_ptar_to] FOREIGN KEY([to_point_id])
REFERENCES [dbo].[pipeline_point] ([point_id])
GO
ALTER TABLE [dbo].[pipeline_tariff] CHECK CONSTRAINT [fk_ptar_to]
GO
ALTER TABLE [dbo].[pipeline_tariff]  WITH CHECK ADD  CONSTRAINT [fk_ptar_uom] FOREIGN KEY([rate_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[pipeline_tariff] CHECK CONSTRAINT [fk_ptar_uom]
GO
ALTER TABLE [dbo].[power_ancillary_service_type]  WITH CHECK ADD  CONSTRAINT [fk_past_ba] FOREIGN KEY([balancing_authority_id])
REFERENCES [dbo].[balancing_authority] ([balancing_authority_id])
GO
ALTER TABLE [dbo].[power_ancillary_service_type] CHECK CONSTRAINT [fk_past_ba]
GO
ALTER TABLE [dbo].[power_pnode]  WITH CHECK ADD  CONSTRAINT [fk_pnode_ba] FOREIGN KEY([balancing_authority_id])
REFERENCES [dbo].[balancing_authority] ([balancing_authority_id])
GO
ALTER TABLE [dbo].[power_pnode] CHECK CONSTRAINT [fk_pnode_ba]
GO
ALTER TABLE [dbo].[power_pnode]  WITH CHECK ADD  CONSTRAINT [fk_pnode_zone] FOREIGN KEY([transmission_zone_id])
REFERENCES [dbo].[transmission_zone] ([zone_id])
GO
ALTER TABLE [dbo].[power_pnode] CHECK CONSTRAINT [fk_pnode_zone]
GO
ALTER TABLE [dbo].[power_product_detail]  WITH CHECK ADD  CONSTRAINT [fk_ppd_ba] FOREIGN KEY([default_balancing_authority_id])
REFERENCES [dbo].[balancing_authority] ([balancing_authority_id])
GO
ALTER TABLE [dbo].[power_product_detail] CHECK CONSTRAINT [fk_ppd_ba]
GO
ALTER TABLE [dbo].[power_product_detail]  WITH CHECK ADD  CONSTRAINT [fk_ppd_load_shape] FOREIGN KEY([default_load_shape_id])
REFERENCES [dbo].[load_shape_template] ([load_shape_id])
GO
ALTER TABLE [dbo].[power_product_detail] CHECK CONSTRAINT [fk_ppd_load_shape]
GO
ALTER TABLE [dbo].[power_product_detail]  WITH CHECK ADD  CONSTRAINT [fk_ppd_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[power_product_detail] CHECK CONSTRAINT [fk_ppd_product]
GO
ALTER TABLE [dbo].[power_product_detail]  WITH CHECK ADD  CONSTRAINT [fk_ppd_zone] FOREIGN KEY([default_zone_id])
REFERENCES [dbo].[transmission_zone] ([zone_id])
GO
ALTER TABLE [dbo].[power_product_detail] CHECK CONSTRAINT [fk_ppd_zone]
GO
ALTER TABLE [dbo].[price_index]  WITH CHECK ADD  CONSTRAINT [fk_pi_commodity] FOREIGN KEY([commodity_id])
REFERENCES [dbo].[commodity] ([commodity_id])
GO
ALTER TABLE [dbo].[price_index] CHECK CONSTRAINT [fk_pi_commodity]
GO
ALTER TABLE [dbo].[price_index]  WITH CHECK ADD  CONSTRAINT [fk_pi_currency] FOREIGN KEY([currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[price_index] CHECK CONSTRAINT [fk_pi_currency]
GO
ALTER TABLE [dbo].[price_index]  WITH CHECK ADD  CONSTRAINT [fk_pi_uom] FOREIGN KEY([uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[price_index] CHECK CONSTRAINT [fk_pi_uom]
GO
ALTER TABLE [dbo].[price_index_source]  WITH CHECK ADD  CONSTRAINT [fk_pis_index] FOREIGN KEY([price_index_id])
REFERENCES [dbo].[price_index] ([price_index_id])
GO
ALTER TABLE [dbo].[price_index_source] CHECK CONSTRAINT [fk_pis_index]
GO
ALTER TABLE [dbo].[price_index_source]  WITH CHECK ADD  CONSTRAINT [fk_pis_source] FOREIGN KEY([price_source_id])
REFERENCES [dbo].[price_source] ([price_source_id])
GO
ALTER TABLE [dbo].[price_index_source] CHECK CONSTRAINT [fk_pis_source]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_diff_ccy] FOREIGN KEY([differential_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_diff_ccy]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_fallback_trigger] FOREIGN KEY([fallback_trigger_id])
REFERENCES [dbo].[pricing_trigger_event_type] ([trigger_type_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_fallback_trigger]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_final_trigger] FOREIGN KEY([final_invoice_trigger_id])
REFERENCES [dbo].[pricing_trigger_event_type] ([trigger_type_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_final_trigger]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_formula] FOREIGN KEY([formula_template_id])
REFERENCES [dbo].[formula_template] ([template_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_formula]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_fx_index] FOREIGN KEY([fx_index_id])
REFERENCES [dbo].[price_index] ([price_index_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_fx_index]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_incoterm] FOREIGN KEY([incoterm_id])
REFERENCES [dbo].[incoterm] ([incoterm_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_incoterm]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_index] FOREIGN KEY([price_index_id])
REFERENCES [dbo].[price_index] ([price_index_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_index]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_index_ccy] FOREIGN KEY([index_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_index_ccy]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_inv_calendar] FOREIGN KEY([invoice_calendar_id])
REFERENCES [dbo].[holiday_calendar] ([calendar_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_inv_calendar]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_inv_trigger] FOREIGN KEY([invoice_trigger_id])
REFERENCES [dbo].[pricing_trigger_event_type] ([trigger_type_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_inv_trigger]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_market] FOREIGN KEY([market_id])
REFERENCES [dbo].[market] ([market_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_market]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_pricing_type] FOREIGN KEY([pricing_type_id])
REFERENCES [dbo].[pricing_type] ([pricing_type_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_pricing_type]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_primary_trigger] FOREIGN KEY([primary_trigger_id])
REFERENCES [dbo].[pricing_trigger_event_type] ([trigger_type_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_primary_trigger]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_product]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_trade_ccy] FOREIGN KEY([trade_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_trade_ccy]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [fk_pr_window] FOREIGN KEY([window_rule_id])
REFERENCES [dbo].[pricing_window_rule] ([window_rule_id])
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [fk_pr_window]
GO
ALTER TABLE [dbo].[pricing_window_rule]  WITH CHECK ADD  CONSTRAINT [fk_pwr_backup] FOREIGN KEY([backup_source_id])
REFERENCES [dbo].[price_source] ([price_source_id])
GO
ALTER TABLE [dbo].[pricing_window_rule] CHECK CONSTRAINT [fk_pwr_backup]
GO
ALTER TABLE [dbo].[pricing_window_rule]  WITH CHECK ADD  CONSTRAINT [fk_pwr_calendar] FOREIGN KEY([calendar_id])
REFERENCES [dbo].[holiday_calendar] ([calendar_id])
GO
ALTER TABLE [dbo].[pricing_window_rule] CHECK CONSTRAINT [fk_pwr_calendar]
GO
ALTER TABLE [dbo].[pricing_window_rule]  WITH CHECK ADD  CONSTRAINT [fk_pwr_market] FOREIGN KEY([market_id])
REFERENCES [dbo].[market] ([market_id])
GO
ALTER TABLE [dbo].[pricing_window_rule] CHECK CONSTRAINT [fk_pwr_market]
GO
ALTER TABLE [dbo].[product]  WITH CHECK ADD  CONSTRAINT [fk_prod_commodity] FOREIGN KEY([commodity_id])
REFERENCES [dbo].[commodity] ([commodity_id])
GO
ALTER TABLE [dbo].[product] CHECK CONSTRAINT [fk_prod_commodity]
GO
ALTER TABLE [dbo].[product]  WITH CHECK ADD  CONSTRAINT [fk_prod_currency] FOREIGN KEY([default_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[product] CHECK CONSTRAINT [fk_prod_currency]
GO
ALTER TABLE [dbo].[product]  WITH CHECK ADD  CONSTRAINT [fk_prod_incoterm] FOREIGN KEY([default_incoterm_id])
REFERENCES [dbo].[incoterm] ([incoterm_id])
GO
ALTER TABLE [dbo].[product] CHECK CONSTRAINT [fk_prod_incoterm]
GO
ALTER TABLE [dbo].[product]  WITH CHECK ADD  CONSTRAINT [fk_prod_pricing_type] FOREIGN KEY([default_pricing_type_id])
REFERENCES [dbo].[pricing_type] ([pricing_type_id])
GO
ALTER TABLE [dbo].[product] CHECK CONSTRAINT [fk_prod_pricing_type]
GO
ALTER TABLE [dbo].[product]  WITH CHECK ADD  CONSTRAINT [fk_prod_uom] FOREIGN KEY([default_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[product] CHECK CONSTRAINT [fk_prod_uom]
GO
ALTER TABLE [dbo].[product]  WITH CHECK ADD  CONSTRAINT [fk_product_commodity_family] FOREIGN KEY([commodity_family_id])
REFERENCES [dbo].[commodity_family] ([commodity_family_id])
GO
ALTER TABLE [dbo].[product] CHECK CONSTRAINT [fk_product_commodity_family]
GO
ALTER TABLE [dbo].[product]  WITH CHECK ADD  CONSTRAINT [fk_product_settlement_type_id] FOREIGN KEY([settlement_type])
REFERENCES [dbo].[settlement_type] ([settlement_type_id])
GO
ALTER TABLE [dbo].[product] CHECK CONSTRAINT [fk_product_settlement_type_id]
GO
ALTER TABLE [dbo].[product_spec_template]  WITH CHECK ADD  CONSTRAINT [fk_pst_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[product_spec_template] CHECK CONSTRAINT [fk_pst_product]
GO
ALTER TABLE [dbo].[railcar]  WITH CHECK ADD  CONSTRAINT [fk_railcar_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[railcar] CHECK CONSTRAINT [fk_railcar_country]
GO
ALTER TABLE [dbo].[railcar]  WITH CHECK ADD  CONSTRAINT [fk_rc_operator] FOREIGN KEY([operator_id])
REFERENCES [dbo].[transport_operator] ([operator_id])
GO
ALTER TABLE [dbo].[railcar] CHECK CONSTRAINT [fk_rc_operator]
GO
ALTER TABLE [dbo].[regulatory_obligation]  WITH CHECK ADD  CONSTRAINT [fk_ro_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[regulatory_obligation] CHECK CONSTRAINT [fk_ro_entity]
GO
ALTER TABLE [dbo].[regulatory_obligation]  WITH CHECK ADD  CONSTRAINT [fk_ro_rep_entity] FOREIGN KEY([reporting_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[regulatory_obligation] CHECK CONSTRAINT [fk_ro_rep_entity]
GO
ALTER TABLE [dbo].[regulatory_obligation]  WITH CHECK ADD  CONSTRAINT [fk_ro_report_type] FOREIGN KEY([report_type_id])
REFERENCES [dbo].[regulatory_report_type] ([report_type_id])
GO
ALTER TABLE [dbo].[regulatory_obligation] CHECK CONSTRAINT [fk_ro_report_type]
GO
ALTER TABLE [dbo].[regulatory_report_type]  WITH CHECK ADD  CONSTRAINT [fk_regulatory_report_type_jurisdiction_id] FOREIGN KEY([jurisdiction_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[regulatory_report_type] CHECK CONSTRAINT [fk_regulatory_report_type_jurisdiction_id]
GO
ALTER TABLE [dbo].[reporting_group]  WITH CHECK ADD  CONSTRAINT [fk_reporting_group_classification_type] FOREIGN KEY([classification_type_id])
REFERENCES [dbo].[lookup_value] ([lookup_id])
GO
ALTER TABLE [dbo].[reporting_group] CHECK CONSTRAINT [fk_reporting_group_classification_type]
GO
ALTER TABLE [dbo].[rin_account]  WITH CHECK ADD FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[rin_account]  WITH CHECK ADD FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[rin_obligation]  WITH CHECK ADD FOREIGN KEY([d_code])
REFERENCES [dbo].[rin_fuel_category] ([d_code])
GO
ALTER TABLE [dbo].[rin_obligation]  WITH CHECK ADD FOREIGN KEY([d_code])
REFERENCES [dbo].[rin_fuel_category] ([d_code])
GO
ALTER TABLE [dbo].[rin_obligation]  WITH CHECK ADD FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[rin_obligation]  WITH CHECK ADD FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[rin_obligation]  WITH CHECK ADD  CONSTRAINT [fk_rin_obl_status] FOREIGN KEY([status])
REFERENCES [dbo].[lookup_value] ([lookup_id])
GO
ALTER TABLE [dbo].[rin_obligation] CHECK CONSTRAINT [fk_rin_obl_status]
GO
ALTER TABLE [dbo].[settlement_calendar]  WITH CHECK ADD  CONSTRAINT [fk_sc_calendar] FOREIGN KEY([calendar_id])
REFERENCES [dbo].[holiday_calendar] ([calendar_id])
GO
ALTER TABLE [dbo].[settlement_calendar] CHECK CONSTRAINT [fk_sc_calendar]
GO
ALTER TABLE [dbo].[settlement_calendar]  WITH CHECK ADD  CONSTRAINT [fk_sc_product] FOREIGN KEY([product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[settlement_calendar] CHECK CONSTRAINT [fk_sc_product]
GO
ALTER TABLE [dbo].[settlement_price]  WITH CHECK ADD  CONSTRAINT [fk_settlement_price_uom] FOREIGN KEY([uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[settlement_price] CHECK CONSTRAINT [fk_settlement_price_uom]
GO
ALTER TABLE [dbo].[settlement_price]  WITH CHECK ADD  CONSTRAINT [fk_sp_tick_ccy] FOREIGN KEY([tick_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[settlement_price] CHECK CONSTRAINT [fk_sp_tick_ccy]
GO
ALTER TABLE [dbo].[storage_facility]  WITH CHECK ADD  CONSTRAINT [fk_fac_location] FOREIGN KEY([location_id])
REFERENCES [dbo].[location] ([location_id])
GO
ALTER TABLE [dbo].[storage_facility] CHECK CONSTRAINT [fk_fac_location]
GO
ALTER TABLE [dbo].[storage_facility]  WITH CHECK ADD  CONSTRAINT [fk_fac_uom] FOREIGN KEY([capacity_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[storage_facility] CHECK CONSTRAINT [fk_fac_uom]
GO
ALTER TABLE [dbo].[storage_facility]  WITH CHECK ADD  CONSTRAINT [fk_storage_facility_type_id] FOREIGN KEY([facility_type])
REFERENCES [dbo].[storage_facility_type] ([storage_facility_type_id])
GO
ALTER TABLE [dbo].[storage_facility] CHECK CONSTRAINT [fk_storage_facility_type_id]
GO
ALTER TABLE [dbo].[tank]  WITH CHECK ADD  CONSTRAINT [fk_tank_facility] FOREIGN KEY([facility_id])
REFERENCES [dbo].[storage_facility] ([facility_id])
GO
ALTER TABLE [dbo].[tank] CHECK CONSTRAINT [fk_tank_facility]
GO
ALTER TABLE [dbo].[tank]  WITH CHECK ADD  CONSTRAINT [fk_tank_heel_product] FOREIGN KEY([heel_product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[tank] CHECK CONSTRAINT [fk_tank_heel_product]
GO
ALTER TABLE [dbo].[tank]  WITH CHECK ADD  CONSTRAINT [fk_tank_product] FOREIGN KEY([primary_product_id])
REFERENCES [dbo].[product] ([product_id])
GO
ALTER TABLE [dbo].[tank] CHECK CONSTRAINT [fk_tank_product]
GO
ALTER TABLE [dbo].[tax_registration]  WITH CHECK ADD  CONSTRAINT [fk_tax_registration_type_id] FOREIGN KEY([tax_type])
REFERENCES [dbo].[tax_type] ([tax_type_id])
GO
ALTER TABLE [dbo].[tax_registration] CHECK CONSTRAINT [fk_tax_registration_type_id]
GO
ALTER TABLE [dbo].[tax_registration]  WITH CHECK ADD  CONSTRAINT [fk_taxreg_jurisdiction] FOREIGN KEY([jurisdiction_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[tax_registration] CHECK CONSTRAINT [fk_taxreg_jurisdiction]
GO
ALTER TABLE [dbo].[trade_repository]  WITH CHECK ADD  CONSTRAINT [fk_tr_cp] FOREIGN KEY([operator_cp_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[trade_repository] CHECK CONSTRAINT [fk_tr_cp]
GO
ALTER TABLE [dbo].[trade_repository]  WITH CHECK ADD  CONSTRAINT [fk_trade_repository_jurisdiction_id] FOREIGN KEY([jurisdiction_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[trade_repository] CHECK CONSTRAINT [fk_trade_repository_jurisdiction_id]
GO
ALTER TABLE [dbo].[trader]  WITH CHECK ADD  CONSTRAINT [fk_trader_approver] FOREIGN KEY([approver_trader_id])
REFERENCES [dbo].[trader] ([trader_id])
GO
ALTER TABLE [dbo].[trader] CHECK CONSTRAINT [fk_trader_approver]
GO
ALTER TABLE [dbo].[trader]  WITH CHECK ADD  CONSTRAINT [fk_trader_desk] FOREIGN KEY([desk_id])
REFERENCES [dbo].[desk] ([desk_id])
GO
ALTER TABLE [dbo].[trader] CHECK CONSTRAINT [fk_trader_desk]
GO
ALTER TABLE [dbo].[trader]  WITH CHECK ADD  CONSTRAINT [fk_trader_entity] FOREIGN KEY([legal_entity_id])
REFERENCES [dbo].[legal_entity] ([legal_entity_id])
GO
ALTER TABLE [dbo].[trader] CHECK CONSTRAINT [fk_trader_entity]
GO
ALTER TABLE [dbo].[trader]  WITH CHECK ADD  CONSTRAINT [fk_trader_limit_ccy] FOREIGN KEY([limit_currency_id])
REFERENCES [dbo].[currency] ([currency_id])
GO
ALTER TABLE [dbo].[trader] CHECK CONSTRAINT [fk_trader_limit_ccy]
GO
ALTER TABLE [dbo].[trader]  WITH CHECK ADD  CONSTRAINT [fk_trader_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[app_user] ([user_id])
GO
ALTER TABLE [dbo].[trader] CHECK CONSTRAINT [fk_trader_user]
GO
ALTER TABLE [dbo].[transmission_right_type]  WITH CHECK ADD  CONSTRAINT [fk_trt_ba] FOREIGN KEY([home_balancing_authority_id])
REFERENCES [dbo].[balancing_authority] ([balancing_authority_id])
GO
ALTER TABLE [dbo].[transmission_right_type] CHECK CONSTRAINT [fk_trt_ba]
GO
ALTER TABLE [dbo].[transmission_zone]  WITH CHECK ADD  CONSTRAINT [fk_tz_ba] FOREIGN KEY([balancing_authority_id])
REFERENCES [dbo].[balancing_authority] ([balancing_authority_id])
GO
ALTER TABLE [dbo].[transmission_zone] CHECK CONSTRAINT [fk_tz_ba]
GO
ALTER TABLE [dbo].[transmission_zone]  WITH CHECK ADD  CONSTRAINT [fk_tz_location] FOREIGN KEY([location_id])
REFERENCES [dbo].[location] ([location_id])
GO
ALTER TABLE [dbo].[transmission_zone] CHECK CONSTRAINT [fk_tz_location]
GO
ALTER TABLE [dbo].[transport_document_type]  WITH CHECK ADD  CONSTRAINT [fk_tdt_mot] FOREIGN KEY([mot_type_id])
REFERENCES [dbo].[mot_type] ([mot_type_id])
GO
ALTER TABLE [dbo].[transport_document_type] CHECK CONSTRAINT [fk_tdt_mot]
GO
ALTER TABLE [dbo].[transport_operator]  WITH CHECK ADD  CONSTRAINT [fk_to_counterparty] FOREIGN KEY([counterparty_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[transport_operator] CHECK CONSTRAINT [fk_to_counterparty]
GO
ALTER TABLE [dbo].[transport_operator]  WITH CHECK ADD  CONSTRAINT [fk_to_mot_type] FOREIGN KEY([mot_type_id])
REFERENCES [dbo].[mot_type] ([mot_type_id])
GO
ALTER TABLE [dbo].[transport_operator] CHECK CONSTRAINT [fk_to_mot_type]
GO
ALTER TABLE [dbo].[transport_operator]  WITH CHECK ADD  CONSTRAINT [fk_to_operator_type] FOREIGN KEY([operator_type])
REFERENCES [dbo].[lookup_value] ([lookup_id])
GO
ALTER TABLE [dbo].[transport_operator] CHECK CONSTRAINT [fk_to_operator_type]
GO
ALTER TABLE [dbo].[transport_operator]  WITH CHECK ADD  CONSTRAINT [fk_transport_op_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[transport_operator] CHECK CONSTRAINT [fk_transport_op_country]
GO
ALTER TABLE [dbo].[transport_route]  WITH CHECK ADD  CONSTRAINT [fk_tr_dest] FOREIGN KEY([dest_location_id])
REFERENCES [dbo].[location] ([location_id])
GO
ALTER TABLE [dbo].[transport_route] CHECK CONSTRAINT [fk_tr_dest]
GO
ALTER TABLE [dbo].[transport_route]  WITH CHECK ADD  CONSTRAINT [fk_tr_mot_type] FOREIGN KEY([mot_type_id])
REFERENCES [dbo].[mot_type] ([mot_type_id])
GO
ALTER TABLE [dbo].[transport_route] CHECK CONSTRAINT [fk_tr_mot_type]
GO
ALTER TABLE [dbo].[transport_route]  WITH CHECK ADD  CONSTRAINT [fk_tr_origin] FOREIGN KEY([origin_location_id])
REFERENCES [dbo].[location] ([location_id])
GO
ALTER TABLE [dbo].[transport_route] CHECK CONSTRAINT [fk_tr_origin]
GO
ALTER TABLE [dbo].[truck]  WITH CHECK ADD  CONSTRAINT [fk_truck_country] FOREIGN KEY([country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[truck] CHECK CONSTRAINT [fk_truck_country]
GO
ALTER TABLE [dbo].[truck]  WITH CHECK ADD  CONSTRAINT [fk_truck_operator] FOREIGN KEY([operator_id])
REFERENCES [dbo].[transport_operator] ([operator_id])
GO
ALTER TABLE [dbo].[truck] CHECK CONSTRAINT [fk_truck_operator]
GO
ALTER TABLE [dbo].[unit_of_measure]  WITH CHECK ADD  CONSTRAINT [fk_uom_category] FOREIGN KEY([uom_category])
REFERENCES [dbo].[uom_type] ([uom_type_id])
GO
ALTER TABLE [dbo].[unit_of_measure] CHECK CONSTRAINT [fk_uom_category]
GO
ALTER TABLE [dbo].[unit_of_measure]  WITH CHECK ADD  CONSTRAINT [fk_uom_commodity_type] FOREIGN KEY([commodity_type])
REFERENCES [dbo].[commodity_type] ([commodity_type_id])
GO
ALTER TABLE [dbo].[unit_of_measure] CHECK CONSTRAINT [fk_uom_commodity_type]
GO
ALTER TABLE [dbo].[uom_conversion]  WITH CHECK ADD  CONSTRAINT [fk_uomc_from] FOREIGN KEY([from_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[uom_conversion] CHECK CONSTRAINT [fk_uomc_from]
GO
ALTER TABLE [dbo].[uom_conversion]  WITH CHECK ADD  CONSTRAINT [fk_uomc_to] FOREIGN KEY([to_uom_id])
REFERENCES [dbo].[unit_of_measure] ([uom_id])
GO
ALTER TABLE [dbo].[uom_conversion] CHECK CONSTRAINT [fk_uomc_to]
GO
ALTER TABLE [dbo].[vessel]  WITH CHECK ADD  CONSTRAINT [fk_ves_charterer] FOREIGN KEY([charterer_cp_id])
REFERENCES [dbo].[counterparty] ([counterparty_id])
GO
ALTER TABLE [dbo].[vessel] CHECK CONSTRAINT [fk_ves_charterer]
GO
ALTER TABLE [dbo].[vessel]  WITH CHECK ADD  CONSTRAINT [fk_ves_manager] FOREIGN KEY([manager_operator_id])
REFERENCES [dbo].[transport_operator] ([operator_id])
GO
ALTER TABLE [dbo].[vessel] CHECK CONSTRAINT [fk_ves_manager]
GO
ALTER TABLE [dbo].[vessel]  WITH CHECK ADD  CONSTRAINT [fk_ves_owner] FOREIGN KEY([owner_operator_id])
REFERENCES [dbo].[transport_operator] ([operator_id])
GO
ALTER TABLE [dbo].[vessel] CHECK CONSTRAINT [fk_ves_owner]
GO
ALTER TABLE [dbo].[vessel]  WITH CHECK ADD  CONSTRAINT [fk_vessel_build_country] FOREIGN KEY([build_country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[vessel] CHECK CONSTRAINT [fk_vessel_build_country]
GO
ALTER TABLE [dbo].[vessel]  WITH CHECK ADD  CONSTRAINT [fk_vessel_flag_country] FOREIGN KEY([flag_country_id])
REFERENCES [dbo].[country] ([country_id])
GO
ALTER TABLE [dbo].[vessel] CHECK CONSTRAINT [fk_vessel_flag_country]
GO
ALTER TABLE [dbo].[vessel_certificate]  WITH CHECK ADD  CONSTRAINT [fk_vc_doc] FOREIGN KEY([document_store_id])
REFERENCES [dbo].[document_store] ([document_id])
GO
ALTER TABLE [dbo].[vessel_certificate] CHECK CONSTRAINT [fk_vc_doc]
GO
ALTER TABLE [dbo].[vessel_certificate]  WITH CHECK ADD  CONSTRAINT [fk_vc_vessel] FOREIGN KEY([vessel_id])
REFERENCES [dbo].[vessel] ([vessel_id])
GO
ALTER TABLE [dbo].[vessel_certificate] CHECK CONSTRAINT [fk_vc_vessel]
GO
ALTER TABLE [dbo].[address]  WITH CHECK ADD  CONSTRAINT [chk_addr_entity_type] CHECK  (([entity_type]='CONTACT' OR [entity_type]='STORAGE_FACILITY' OR [entity_type]='LOCATION' OR [entity_type]='COUNTERPARTY' OR [entity_type]='LEGAL_ENTITY'))
GO
ALTER TABLE [dbo].[address] CHECK CONSTRAINT [chk_addr_entity_type]
GO
ALTER TABLE [dbo].[agri_crop_year_lifecycle]  WITH CHECK ADD  CONSTRAINT [chk_acyl_harvest_dates] CHECK  (([harvest_end_date]>=[harvest_start_date]))
GO
ALTER TABLE [dbo].[agri_crop_year_lifecycle] CHECK CONSTRAINT [chk_acyl_harvest_dates]
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale]  WITH CHECK ADD  CONSTRAINT [chk_amds_range] CHECK  (([moisture_pct_max]>[moisture_pct_min]))
GO
ALTER TABLE [dbo].[agri_moisture_discount_scale] CHECK CONSTRAINT [chk_amds_range]
GO
ALTER TABLE [dbo].[balancing_authority]  WITH CHECK ADD  CONSTRAINT [chk_ba_market_type] CHECK  (([market_type]='OTHER' OR [market_type]='VERTICALLY_INTEGRATED' OR [market_type]='TSO' OR [market_type]='RTO' OR [market_type]='ISO'))
GO
ALTER TABLE [dbo].[balancing_authority] CHECK CONSTRAINT [chk_ba_market_type]
GO
ALTER TABLE [dbo].[balmo_product]  WITH CHECK ADD  CONSTRAINT [ck_balmo_pricing_win] CHECK  (([pricing_end_date]>=[pricing_start_date]))
GO
ALTER TABLE [dbo].[balmo_product] CHECK CONSTRAINT [ck_balmo_pricing_win]
GO
ALTER TABLE [dbo].[balmo_product]  WITH CHECK ADD  CONSTRAINT [ck_balmo_product_exch] CHECK  (([exchange]='ICE_US' OR [exchange]='ICE_EUROPE' OR [exchange]='CME_NYMEX'))
GO
ALTER TABLE [dbo].[balmo_product] CHECK CONSTRAINT [ck_balmo_product_exch]
GO
ALTER TABLE [dbo].[balmo_product]  WITH CHECK ADD  CONSTRAINT [ck_balmo_status] CHECK  (([status]='SUSPENDED' OR [status]='EXPIRED' OR [status]='ACTIVE'))
GO
ALTER TABLE [dbo].[balmo_product] CHECK CONSTRAINT [ck_balmo_status]
GO
ALTER TABLE [dbo].[bank_account]  WITH CHECK ADD  CONSTRAINT [chk_bank_entity_type] CHECK  (([entity_type]='COUNTERPARTY' OR [entity_type]='LEGAL_ENTITY'))
GO
ALTER TABLE [dbo].[bank_account] CHECK CONSTRAINT [chk_bank_entity_type]
GO
ALTER TABLE [dbo].[bank_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_bg_called] CHECK  (([amount_called]>=(0) AND [amount_called]<=[guarantee_amount]))
GO
ALTER TABLE [dbo].[bank_guarantee] CHECK CONSTRAINT [chk_bg_called]
GO
ALTER TABLE [dbo].[bank_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_bg_dates] CHECK  (([expiry_date]>[issue_date]))
GO
ALTER TABLE [dbo].[bank_guarantee] CHECK CONSTRAINT [chk_bg_dates]
GO
ALTER TABLE [dbo].[bank_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_bg_status] CHECK  (([bg_status]='DISCHARGED' OR [bg_status]='CANCELLED' OR [bg_status]='EXPIRED' OR [bg_status]='CALLED' OR [bg_status]='AMENDED' OR [bg_status]='ISSUED' OR [bg_status]='DRAFT'))
GO
ALTER TABLE [dbo].[bank_guarantee] CHECK CONSTRAINT [chk_bg_status]
GO
ALTER TABLE [dbo].[bank_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_bg_type] CHECK  (([bg_type]='STANDBY_LC' OR [bg_type]='BID_BOND' OR [bg_type]='ADVANCE_PAYMENT' OR [bg_type]='PAYMENT' OR [bg_type]='PERFORMANCE'))
GO
ALTER TABLE [dbo].[bank_guarantee] CHECK CONSTRAINT [chk_bg_type]
GO
ALTER TABLE [dbo].[bolmo_agreement]  WITH CHECK ADD  CONSTRAINT [ck_bolmo_net_qty] CHECK  (([net_quantity]>(0)))
GO
ALTER TABLE [dbo].[bolmo_agreement] CHECK CONSTRAINT [ck_bolmo_net_qty]
GO
ALTER TABLE [dbo].[bolmo_agreement]  WITH CHECK ADD  CONSTRAINT [ck_bolmo_status] CHECK  (([status]='CANCELLED' OR [status]='DISPUTED' OR [status]='COMPLETED' OR [status]='AGREED' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[bolmo_agreement] CHECK CONSTRAINT [ck_bolmo_status]
GO
ALTER TABLE [dbo].[broker]  WITH CHECK ADD  CONSTRAINT [chk_broker_type] CHECK  (([broker_type]='HYBRID' OR [broker_type]='ELECTRONIC' OR [broker_type]='VOICE'))
GO
ALTER TABLE [dbo].[broker] CHECK CONSTRAINT [chk_broker_type]
GO
ALTER TABLE [dbo].[broker]  WITH CHECK ADD  CONSTRAINT [ck_broker_commodity] CHECK  (([commodity_type]='ENVIRONMENTAL' OR [commodity_type]='RINS' OR [commodity_type]='FREIGHT' OR [commodity_type]='METALS' OR [commodity_type]='AGRICULTURAL' OR [commodity_type]='LNG' OR [commodity_type]='POWER' OR [commodity_type]='GAS' OR [commodity_type]='OIL'))
GO
ALTER TABLE [dbo].[broker] CHECK CONSTRAINT [ck_broker_commodity]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [chk_bfa_dates] CHECK  (([effective_to] IS NULL OR [effective_to]>=[effective_from]))
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [chk_bfa_dates]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [chk_bfa_fee_type] CHECK  (([fee_type]='FLAT_MONTHLY' OR [fee_type]='FLAT_PER_TRADE' OR [fee_type]='PCT_NOTIONAL' OR [fee_type]='PER_LOT'))
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [chk_bfa_fee_type]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [chk_bfa_min_max] CHECK  (([maximum_fee] IS NULL OR [minimum_fee] IS NULL OR [maximum_fee]>=[minimum_fee]))
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [chk_bfa_min_max]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [chk_bfa_pay_period] CHECK  (([pay_period]='ANNUAL' OR [pay_period]='SEMI_ANNUAL' OR [pay_period]='QUARTERLY' OR [pay_period]='MONTHLY' OR [pay_period]='PER_TRADE'))
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [chk_bfa_pay_period]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [chk_bfa_rate] CHECK  (([fee_rate]>=(0)))
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [chk_bfa_rate]
GO
ALTER TABLE [dbo].[broker_fee_agreement]  WITH CHECK ADD  CONSTRAINT [chk_bfa_trade_type] CHECK  (([trade_type] IS NULL OR ([trade_type]='FINANCIAL' OR [trade_type]='PHYSICAL')))
GO
ALTER TABLE [dbo].[broker_fee_agreement] CHECK CONSTRAINT [chk_bfa_trade_type]
GO
ALTER TABLE [dbo].[charter_party_type]  WITH CHECK ADD  CONSTRAINT [chk_cpt_duration] CHECK  (([duration_basis]='CONTRACT_PERIOD' OR [duration_basis]='BAREBOAT_PERIOD' OR [duration_basis]='TIME_PERIOD' OR [duration_basis]='SINGLE_VOYAGE'))
GO
ALTER TABLE [dbo].[charter_party_type] CHECK CONSTRAINT [chk_cpt_duration]
GO
ALTER TABLE [dbo].[charter_party_type]  WITH CHECK ADD  CONSTRAINT [chk_cpt_rate_basis] CHECK  (([rate_basis]='WORLDSCALE' OR [rate_basis]='PER_CBM' OR [rate_basis]='LUMPSUM' OR [rate_basis]='PER_TONNE' OR [rate_basis]='PER_DAY'))
GO
ALTER TABLE [dbo].[charter_party_type] CHECK CONSTRAINT [chk_cpt_rate_basis]
GO
ALTER TABLE [dbo].[collateral]  WITH CHECK ADD  CONSTRAINT [chk_coll_dir] CHECK  (([direction]='RECEIVED' OR [direction]='POSTED'))
GO
ALTER TABLE [dbo].[collateral] CHECK CONSTRAINT [chk_coll_dir]
GO
ALTER TABLE [dbo].[collateral]  WITH CHECK ADD  CONSTRAINT [chk_coll_entity] CHECK  (([secured_entity_type]='OTHER' OR [secured_entity_type]='LC' OR [secured_entity_type]='MARGIN_ACCOUNT' OR [secured_entity_type]='COUNTERPARTY'))
GO
ALTER TABLE [dbo].[collateral] CHECK CONSTRAINT [chk_coll_entity]
GO
ALTER TABLE [dbo].[collateral]  WITH CHECK ADD  CONSTRAINT [chk_coll_status] CHECK  (([status]='SUBSTITUTED' OR [status]='DEFAULTED' OR [status]='CALLED' OR [status]='RETURNED' OR [status]='ACTIVE'))
GO
ALTER TABLE [dbo].[collateral] CHECK CONSTRAINT [chk_coll_status]
GO
ALTER TABLE [dbo].[collateral_type]  WITH CHECK ADD  CONSTRAINT [chk_ct_class] CHECK  (([asset_class]='OTHER' OR [asset_class]='COMMODITY' OR [asset_class]='BANK_GUARANTEE' OR [asset_class]='LETTER_OF_CREDIT' OR [asset_class]='EQUITY' OR [asset_class]='CORPORATE_BOND' OR [asset_class]='GOVERNMENT_BOND' OR [asset_class]='CASH'))
GO
ALTER TABLE [dbo].[collateral_type] CHECK CONSTRAINT [chk_ct_class]
GO
ALTER TABLE [dbo].[commodity]  WITH CHECK ADD  CONSTRAINT [chk_commodity_subtype] CHECK  (([commodity_subtype]='OTHER' OR [commodity_subtype]='MINOR_METAL' OR [commodity_subtype]='FERROUS' OR [commodity_subtype]='PRECIOUS_METAL' OR [commodity_subtype]='BASE_METAL' OR [commodity_subtype]='DAIRY' OR [commodity_subtype]='LIVESTOCK' OR [commodity_subtype]='SOFTS' OR [commodity_subtype]='OILSEEDS' OR [commodity_subtype]='GRAINS' OR [commodity_subtype]='NUCLEAR' OR [commodity_subtype]='RENEWABLE' OR [commodity_subtype]='ELECTRICITY' OR [commodity_subtype]='BIOGAS' OR [commodity_subtype]='NGL_GAS' OR [commodity_subtype]='LPG' OR [commodity_subtype]='LNG' OR [commodity_subtype]='PIPELINE_GAS' OR [commodity_subtype]='PETROCHEMICAL' OR [commodity_subtype]='CONDENSATE' OR [commodity_subtype]='NGL' OR [commodity_subtype]='REFINED' OR [commodity_subtype]='CRUDE'))
GO
ALTER TABLE [dbo].[commodity] CHECK CONSTRAINT [chk_commodity_subtype]
GO
ALTER TABLE [dbo].[commodity_family]  WITH CHECK ADD  CONSTRAINT [chk_commodity_family_type] CHECK  (([family_type]='ELECTRICITY' OR [family_type]='GRAIN' OR [family_type]='PRECIOUS_METAL' OR [family_type]='BASE_METAL' OR [family_type]='LNG' OR [family_type]='PIPELINE_GAS' OR [family_type]='PETROCHEMICAL' OR [family_type]='REFINED' OR [family_type]='CRUDE'))
GO
ALTER TABLE [dbo].[commodity_family] CHECK CONSTRAINT [chk_commodity_family_type]
GO
ALTER TABLE [dbo].[container]  WITH CHECK ADD  CONSTRAINT [chk_cont_type] CHECK  (([container_type]='OTHER' OR [container_type]='STANDARD' OR [container_type]='REEFER' OR [container_type]='DRY_BULK' OR [container_type]='FLEXIBAG' OR [container_type]='ISO_TANK'))
GO
ALTER TABLE [dbo].[container] CHECK CONSTRAINT [chk_cont_type]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [chk_cp_no_self_parent] CHECK  (([parent_counterparty_id] IS NULL OR [parent_counterparty_id]<>[counterparty_id]))
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [chk_cp_no_self_parent]
GO
ALTER TABLE [dbo].[counterparty]  WITH CHECK ADD  CONSTRAINT [chk_cp_parent_ind_consistency] CHECK  (([parent_ind]=(0) AND [parent_counterparty_id] IS NULL OR [parent_ind]=(1) AND [parent_counterparty_id] IS NOT NULL))
GO
ALTER TABLE [dbo].[counterparty] CHECK CONSTRAINT [chk_cp_parent_ind_consistency]
GO
ALTER TABLE [dbo].[country]  WITH CHECK ADD  CONSTRAINT [chk_country_fatf] CHECK  (([fatf_status]='BLACK_LIST' OR [fatf_status]='GREY_LIST' OR [fatf_status]='COMPLIANT'))
GO
ALTER TABLE [dbo].[country] CHECK CONSTRAINT [chk_country_fatf]
GO
ALTER TABLE [dbo].[country]  WITH CHECK ADD  CONSTRAINT [chk_country_region] CHECK  (([region]='CIS' OR [region]='AFRICA' OR [region]='MIDDLE_EAST' OR [region]='ASIA_PACIFIC' OR [region]='AMERICAS' OR [region]='EUROPE'))
GO
ALTER TABLE [dbo].[country] CHECK CONSTRAINT [chk_country_region]
GO
ALTER TABLE [dbo].[country]  WITH CHECK ADD  CONSTRAINT [chk_country_sanction] CHECK  (([sanction_status]='UN_SANCTIONS' OR [sanction_status]='EU_SANCTIONS' OR [sanction_status]='OFAC' OR [sanction_status]='CLEAR'))
GO
ALTER TABLE [dbo].[country] CHECK CONSTRAINT [chk_country_sanction]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [ck_cl_breach_action] CHECK  (([breach_action]='BLOCK_ALL' OR [breach_action]='BLOCK_NEW_TRADES' OR [breach_action]='ALERT_ONLY'))
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [ck_cl_breach_action]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [ck_cl_commodity_type] CHECK  (([commodity_type]='OTHER' OR [commodity_type]='MULTI' OR [commodity_type]='ENVIRONMENTAL' OR [commodity_type]='RINS' OR [commodity_type]='FREIGHT' OR [commodity_type]='METALS' OR [commodity_type]='AGRICULTURAL' OR [commodity_type]='LNG' OR [commodity_type]='POWER' OR [commodity_type]='GAS' OR [commodity_type]='OIL' OR [commodity_type]='ALL'))
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [ck_cl_commodity_type]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [ck_cl_country_risk] CHECK  (([country_risk_rating] IS NULL OR ([country_risk_rating]='SEVERE' OR [country_risk_rating]='HIGH' OR [country_risk_rating]='MEDIUM' OR [country_risk_rating]='LOW')))
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [ck_cl_country_risk]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [ck_cl_limit_basis] CHECK  (([limit_basis]='ALLOCATED' OR [limit_basis]='DIRECT'))
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [ck_cl_limit_basis]
GO
ALTER TABLE [dbo].[credit_limit]  WITH CHECK ADD  CONSTRAINT [ck_cl_review_outcome] CHECK  (([last_review_outcome] IS NULL OR ([last_review_outcome]='ESCALATE' OR [last_review_outcome]='SUSPEND' OR [last_review_outcome]='DECREASE' OR [last_review_outcome]='INCREASE' OR [last_review_outcome]='MAINTAIN')))
GO
ALTER TABLE [dbo].[credit_limit] CHECK CONSTRAINT [ck_cl_review_outcome]
GO
ALTER TABLE [dbo].[credit_rating]  WITH CHECK ADD  CONSTRAINT [chk_credit_risk_cat] CHECK  (([risk_category]='UNRATED' OR [risk_category]='DEFAULT' OR [risk_category]='SPECULATIVE' OR [risk_category]='INVESTMENT_GRADE'))
GO
ALTER TABLE [dbo].[credit_rating] CHECK CONSTRAINT [chk_credit_risk_cat]
GO
ALTER TABLE [dbo].[credit_term]  WITH CHECK ADD  CONSTRAINT [chk_ct_collateral] CHECK  (([collateral_type]='OTHER' OR [collateral_type]='PLEDGE' OR [collateral_type]='BANK_GUARANTEE' OR [collateral_type]='PARENT_GUARANTEE' OR [collateral_type]='LETTER_OF_CREDIT' OR [collateral_type]='CASH' OR [collateral_type]='NONE'))
GO
ALTER TABLE [dbo].[credit_term] CHECK CONSTRAINT [chk_ct_collateral]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate]  WITH CHECK ADD  CONSTRAINT [chk_ddr_date_range] CHECK  (([effective_to] IS NULL OR [effective_to]>=[effective_from]))
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] CHECK CONSTRAINT [chk_ddr_date_range]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate]  WITH CHECK ADD  CONSTRAINT [chk_ddr_despatch_basis] CHECK  (([despatch_basis] IS NULL OR ([despatch_basis]='WORKING_TIME_SAVED_ONLY' OR [despatch_basis]='ALL_TIME_SAVED')))
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] CHECK CONSTRAINT [chk_ddr_despatch_basis]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate]  WITH CHECK ADD  CONSTRAINT [chk_ddr_dispatch_le_demurrage] CHECK  (([dispatch_rate_per_day] IS NULL OR [dispatch_rate_per_day]<=[demurrage_rate_per_day]))
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] CHECK CONSTRAINT [chk_ddr_dispatch_le_demurrage]
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate]  WITH CHECK ADD  CONSTRAINT [chk_ddr_positive] CHECK  (([demurrage_rate_per_day]>=(0)))
GO
ALTER TABLE [dbo].[demurrage_dispatch_rate] CHECK CONSTRAINT [chk_ddr_positive]
GO
ALTER TABLE [dbo].[document_store]  WITH CHECK ADD  CONSTRAINT [chk_doc_type] CHECK  (([document_type]='OTHER' OR [document_type]='REGULATORY_REPORT' OR [document_type]='STATEMENT' OR [document_type]='INVOICE' OR [document_type]='DEAL_CONFIRMATION' OR [document_type]='CREDIT_AGREEMENT' OR [document_type]='KYC' OR [document_type]='GTC_SIGNED' OR [document_type]='GTC'))
GO
ALTER TABLE [dbo].[document_store] CHECK CONSTRAINT [chk_doc_type]
GO
ALTER TABLE [dbo].[energy_footprint]  WITH CHECK ADD  CONSTRAINT [chk_ef_direction] CHECK  (([flow_direction]='BIDIRECTIONAL' OR [flow_direction]='LOAD' OR [flow_direction]='GENERATION'))
GO
ALTER TABLE [dbo].[energy_footprint] CHECK CONSTRAINT [chk_ef_direction]
GO
ALTER TABLE [dbo].[energy_footprint]  WITH CHECK ADD  CONSTRAINT [chk_ef_type] CHECK  (([footprint_type]='HYBRID' OR [footprint_type]='MICROGRID' OR [footprint_type]='DEMAND_RESPONSE' OR [footprint_type]='BATTERY_FLEET' OR [footprint_type]='EV_CHARGING_NETWORK' OR [footprint_type]='WIND_PORTFOLIO' OR [footprint_type]='SOLAR_PORTFOLIO'))
GO
ALTER TABLE [dbo].[energy_footprint] CHECK CONSTRAINT [chk_ef_type]
GO
ALTER TABLE [dbo].[energy_footprint_site]  WITH CHECK ADD  CONSTRAINT [chk_efs_capacity] CHECK  (([capacity_mw]>(0)))
GO
ALTER TABLE [dbo].[energy_footprint_site] CHECK CONSTRAINT [chk_efs_capacity]
GO
ALTER TABLE [dbo].[energy_footprint_site]  WITH CHECK ADD  CONSTRAINT [chk_efs_connector] CHECK  (([connector_standard]='MIXED' OR [connector_standard]='TYPE2' OR [connector_standard]='NACS' OR [connector_standard]='CHADEMO' OR [connector_standard]='CCS'))
GO
ALTER TABLE [dbo].[energy_footprint_site] CHECK CONSTRAINT [chk_efs_connector]
GO
ALTER TABLE [dbo].[energy_footprint_site]  WITH CHECK ADD  CONSTRAINT [chk_efs_decommission] CHECK  (([decommissioning_date] IS NULL OR [commissioning_date] IS NULL OR [decommissioning_date]>=[commissioning_date]))
GO
ALTER TABLE [dbo].[energy_footprint_site] CHECK CONSTRAINT [chk_efs_decommission]
GO
ALTER TABLE [dbo].[energy_footprint_site]  WITH CHECK ADD  CONSTRAINT [chk_efs_type] CHECK  (([site_type]='OTHER' OR [site_type]='CURTAILABLE_LOAD' OR [site_type]='BATTERY_UNIT' OR [site_type]='EV_DEPOT' OR [site_type]='EV_CHARGING_HUB' OR [site_type]='WIND_TURBINE_GROUP' OR [site_type]='ROOFTOP_SOLAR' OR [site_type]='SOLAR_ARRAY'))
GO
ALTER TABLE [dbo].[energy_footprint_site] CHECK CONSTRAINT [chk_efs_type]
GO
ALTER TABLE [dbo].[event_type]  WITH CHECK ADD  CONSTRAINT [chk_et_entity] CHECK  (([entity_type]='OTHER' OR [entity_type]='PIPELINE' OR [entity_type]='VESSEL' OR [entity_type]='COUNTERPARTY' OR [entity_type]='USER' OR [entity_type]='SYSTEM' OR [entity_type]='MARKET_DATA' OR [entity_type]='MARGIN' OR [entity_type]='CREDIT' OR [entity_type]='RISK' OR [entity_type]='PAYMENT' OR [entity_type]='INVOICE' OR [entity_type]='SETTLEMENT' OR [entity_type]='NOMINATION' OR [entity_type]='DELIVERY' OR [entity_type]='POSITION' OR [entity_type]='TRADE'))
GO
ALTER TABLE [dbo].[event_type] CHECK CONSTRAINT [chk_et_entity]
GO
ALTER TABLE [dbo].[event_type]  WITH CHECK ADD  CONSTRAINT [chk_et_severity] CHECK  (([severity]='BREACH' OR [severity]='CRITICAL' OR [severity]='ALERT' OR [severity]='WARNING' OR [severity]='INFO'))
GO
ALTER TABLE [dbo].[event_type] CHECK CONSTRAINT [chk_et_severity]
GO
ALTER TABLE [dbo].[exchange]  WITH CHECK ADD  CONSTRAINT [chk_exch_type] CHECK  (([exchange_type]='OTC_PLATFORM' OR [exchange_type]='DARK_POOL' OR [exchange_type]='ECN' OR [exchange_type]='EXCHANGE'))
GO
ALTER TABLE [dbo].[exchange] CHECK CONSTRAINT [chk_exch_type]
GO
ALTER TABLE [dbo].[external_system]  WITH CHECK ADD  CONSTRAINT [chk_es_conn] CHECK  (([connection_type]=NULL OR [connection_type]='MESSAGE_QUEUE' OR [connection_type]='MANUAL' OR [connection_type]='FILE' OR [connection_type]='SFTP' OR [connection_type]='API'))
GO
ALTER TABLE [dbo].[external_system] CHECK CONSTRAINT [chk_es_conn]
GO
ALTER TABLE [dbo].[external_system]  WITH CHECK ADD  CONSTRAINT [chk_es_type] CHECK  (([system_type]='OTHER' OR [system_type]='AIS_TRACKING' OR [system_type]='RISK' OR [system_type]='REGULATORY' OR [system_type]='BANK' OR [system_type]='SHIPPING' OR [system_type]='CTRM' OR [system_type]='ERP' OR [system_type]='MARKET_DATA'))
GO
ALTER TABLE [dbo].[external_system] CHECK CONSTRAINT [chk_es_type]
GO
ALTER TABLE [dbo].[field_permission_rule]  WITH CHECK ADD  CONSTRAINT [chk_fpr_permission] CHECK  (([field_permission]='HIDDEN' OR [field_permission]='VIEW' OR [field_permission]='EDIT'))
GO
ALTER TABLE [dbo].[field_permission_rule] CHECK CONSTRAINT [chk_fpr_permission]
GO
ALTER TABLE [dbo].[formula_template]  WITH CHECK ADD  CONSTRAINT [chk_ft_avg] CHECK  (([averaging_type]=NULL OR [averaging_type]='NONE' OR [averaging_type]='MONTHLY_AVERAGE' OR [averaging_type]='WEIGHTED_DAILY' OR [averaging_type]='DAILY'))
GO
ALTER TABLE [dbo].[formula_template] CHECK CONSTRAINT [chk_ft_avg]
GO
ALTER TABLE [dbo].[formula_template]  WITH CHECK ADD  CONSTRAINT [chk_ft_avg_period] CHECK  (([averaging_period_type]=NULL OR [averaging_period_type]='CUSTOM' OR [averaging_period_type]='FIXED_WINDOW' OR [averaging_period_type]='DELIVERY_MONTH' OR [averaging_period_type]='PRICING_PERIOD'))
GO
ALTER TABLE [dbo].[formula_template] CHECK CONSTRAINT [chk_ft_avg_period]
GO
ALTER TABLE [dbo].[formula_template]  WITH CHECK ADD  CONSTRAINT [chk_ft_fx] CHECK  (([fx_fixing_type]=NULL OR [fx_fixing_type]='FIXED' OR [fx_fixing_type]='AVERAGE' OR [fx_fixing_type]='SPOT'))
GO
ALTER TABLE [dbo].[formula_template] CHECK CONSTRAINT [chk_ft_fx]
GO
ALTER TABLE [dbo].[formula_template]  WITH CHECK ADD  CONSTRAINT [chk_ft_type] CHECK  (([formula_type]='FORMULA' OR [formula_type]='SPREAD' OR [formula_type]='BLEND' OR [formula_type]='WEIGHTED_AVERAGE' OR [formula_type]='AVERAGE' OR [formula_type]='DIFFERENTIAL' OR [formula_type]='INDEX'))
GO
ALTER TABLE [dbo].[formula_template] CHECK CONSTRAINT [chk_ft_type]
GO
ALTER TABLE [dbo].[freight_rate_index]  WITH CHECK ADD  CONSTRAINT [chk_fri_freq] CHECK  (([publication_frequency]=NULL OR [publication_frequency]='ANNUAL' OR [publication_frequency]='WEEKLY' OR [publication_frequency]='DAILY'))
GO
ALTER TABLE [dbo].[freight_rate_index] CHECK CONSTRAINT [chk_fri_freq]
GO
ALTER TABLE [dbo].[freight_rate_index]  WITH CHECK ADD  CONSTRAINT [chk_fri_pricing_rules] CHECK  ((NOT ([index_type]='ASSESSED' OR [index_type]='BALTIC') OR [currency_id] IS NOT NULL AND [uom_id] IS NOT NULL))
GO
ALTER TABLE [dbo].[freight_rate_index] CHECK CONSTRAINT [chk_fri_pricing_rules]
GO
ALTER TABLE [dbo].[freight_rate_index]  WITH CHECK ADD  CONSTRAINT [chk_fri_type] CHECK  (([index_type]='OTHER' OR [index_type]='ASSESSED' OR [index_type]='WORLDSCALE' OR [index_type]='BALTIC'))
GO
ALTER TABLE [dbo].[freight_rate_index] CHECK CONSTRAINT [chk_fri_type]
GO
ALTER TABLE [dbo].[fx_period]  WITH CHECK ADD  CONSTRAINT [ck_fx_period_type] CHECK  (([period_type]='DAILY_FORWARD' OR [period_type]='STANDARD_TENOR' OR [period_type]='SPOT'))
GO
ALTER TABLE [dbo].[fx_period] CHECK CONSTRAINT [ck_fx_period_type]
GO
ALTER TABLE [dbo].[fx_rate]  WITH CHECK ADD  CONSTRAINT [chk_fx_different] CHECK  (([from_currency_id]<>[to_currency_id]))
GO
ALTER TABLE [dbo].[fx_rate] CHECK CONSTRAINT [chk_fx_different]
GO
ALTER TABLE [dbo].[fx_rate]  WITH CHECK ADD  CONSTRAINT [chk_fx_rate_type] CHECK  (([rate_type]='MID' OR [rate_type]='FIXING' OR [rate_type]='SETTLEMENT' OR [rate_type]='INTRADAY' OR [rate_type]='EOD'))
GO
ALTER TABLE [dbo].[fx_rate] CHECK CONSTRAINT [chk_fx_rate_type]
GO
ALTER TABLE [dbo].[fx_rate]  WITH CHECK ADD  CONSTRAINT [ck_fx_rate_val_type] CHECK  (([rate_value_type]='POINTS' OR [rate_value_type]='OUTRIGHT'))
GO
ALTER TABLE [dbo].[fx_rate] CHECK CONSTRAINT [ck_fx_rate_val_type]
GO
ALTER TABLE [dbo].[generation_asset]  WITH CHECK ADD  CONSTRAINT [chk_ga_decommission] CHECK  (([decommissioning_date] IS NULL OR [commissioning_date] IS NULL OR [decommissioning_date]>=[commissioning_date]))
GO
ALTER TABLE [dbo].[generation_asset] CHECK CONSTRAINT [chk_ga_decommission]
GO
ALTER TABLE [dbo].[generation_asset]  WITH CHECK ADD  CONSTRAINT [chk_ga_fuel] CHECK  (([fuel_type]='OTHER' OR [fuel_type]='STORAGE' OR [fuel_type]='OIL' OR [fuel_type]='BIOMASS' OR [fuel_type]='SOLAR' OR [fuel_type]='WIND' OR [fuel_type]='HYDRO' OR [fuel_type]='NUCLEAR' OR [fuel_type]='COAL' OR [fuel_type]='GAS'))
GO
ALTER TABLE [dbo].[generation_asset] CHECK CONSTRAINT [chk_ga_fuel]
GO
ALTER TABLE [dbo].[gl_account]  WITH CHECK ADD  CONSTRAINT [ck_gl_account_normal_balance] CHECK  (([normal_balance]='CREDIT' OR [normal_balance]='DEBIT'))
GO
ALTER TABLE [dbo].[gl_account] CHECK CONSTRAINT [ck_gl_account_normal_balance]
GO
ALTER TABLE [dbo].[incoterm]  WITH CHECK ADD  CONSTRAINT [chk_incoterm_mode] CHECK  (([transport_mode]='SEA_INLAND_WATERWAY' OR [transport_mode]='ANY'))
GO
ALTER TABLE [dbo].[incoterm] CHECK CONSTRAINT [chk_incoterm_mode]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [chk_ipol_dates] CHECK  (([expiry_date]>[inception_date]))
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [chk_ipol_dates]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [chk_ipol_entity] CHECK  (([insured_entity_type]=NULL OR [insured_entity_type]='OTHER' OR [insured_entity_type]='LEGAL_ENTITY' OR [insured_entity_type]='STORAGE_FACILITY' OR [insured_entity_type]='COUNTERPARTY' OR [insured_entity_type]='CARGO' OR [insured_entity_type]='VESSEL'))
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [chk_ipol_entity]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [chk_ipol_freq] CHECK  (([premium_frequency]=NULL OR [premium_frequency]='PER_CARGO' OR [premium_frequency]='PER_VOYAGE' OR [premium_frequency]='MONTHLY' OR [premium_frequency]='QUARTERLY' OR [premium_frequency]='ANNUAL'))
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [chk_ipol_freq]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [chk_ipol_status] CHECK  (([policy_status]='CLAIM_IN_PROGRESS' OR [policy_status]='SUSPENDED' OR [policy_status]='CANCELLED' OR [policy_status]='EXPIRED' OR [policy_status]='ACTIVE'))
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [chk_ipol_status]
GO
ALTER TABLE [dbo].[insurance_policy]  WITH CHECK ADD  CONSTRAINT [chk_ipol_type] CHECK  (([policy_type]='OTHER' OR [policy_type]='STORAGE' OR [policy_type]='POLITICAL_RISK' OR [policy_type]='TRADE_CREDIT' OR [policy_type]='CARGO' OR [policy_type]='HULL' OR [policy_type]='PI'))
GO
ALTER TABLE [dbo].[insurance_policy] CHECK CONSTRAINT [chk_ipol_type]
GO
ALTER TABLE [dbo].[insurance_provider]  WITH CHECK ADD  CONSTRAINT [chk_ip_type] CHECK  (([provider_type]='REINSURER' OR [provider_type]='BROKER' OR [provider_type]='INSURER' OR [provider_type]='UNDERWRITER' OR [provider_type]='PI_CLUB'))
GO
ALTER TABLE [dbo].[insurance_provider] CHECK CONSTRAINT [chk_ip_type]
GO
ALTER TABLE [dbo].[intercompany_transfer_rule]  WITH CHECK ADD  CONSTRAINT [chk_itr_markup_type] CHECK  (([transfer_pricing_markup_type]='INDEX_OFFSET' OR [transfer_pricing_markup_type]='PERCENT' OR [transfer_pricing_markup_type]='FLAT'))
GO
ALTER TABLE [dbo].[intercompany_transfer_rule] CHECK CONSTRAINT [chk_itr_markup_type]
GO
ALTER TABLE [dbo].[intercompany_transfer_rule]  WITH CHECK ADD  CONSTRAINT [chk_itr_source_ne_dest] CHECK  (([source_legal_entity_id]<>[destination_legal_entity_id]))
GO
ALTER TABLE [dbo].[intercompany_transfer_rule] CHECK CONSTRAINT [chk_itr_source_ne_dest]
GO
ALTER TABLE [dbo].[interconnector]  WITH CHECK ADD  CONSTRAINT [chk_ic_direction] CHECK  (([direction_type]='BIDIRECTIONAL' OR [direction_type]='UNIDIRECTIONAL'))
GO
ALTER TABLE [dbo].[interconnector] CHECK CONSTRAINT [chk_ic_direction]
GO
ALTER TABLE [dbo].[interconnector]  WITH CHECK ADD  CONSTRAINT [chk_ic_no_self] CHECK  (([from_zone_id]<>[to_zone_id]))
GO
ALTER TABLE [dbo].[interconnector] CHECK CONSTRAINT [chk_ic_no_self]
GO
ALTER TABLE [dbo].[interest_rate_index]  WITH CHECK ADD  CONSTRAINT [chk_iri_comp] CHECK  (([compounding]='OVERNIGHT_COMPOUNDED' OR [compounding]='COMPOUNDED' OR [compounding]='SIMPLE'))
GO
ALTER TABLE [dbo].[interest_rate_index] CHECK CONSTRAINT [chk_iri_comp]
GO
ALTER TABLE [dbo].[interest_rate_index]  WITH CHECK ADD  CONSTRAINT [chk_iri_dcc] CHECK  (([day_count_convention]='ACT_365F' OR [day_count_convention]='30_360' OR [day_count_convention]='ACT_ACT' OR [day_count_convention]='ACT_365' OR [day_count_convention]='ACT_360'))
GO
ALTER TABLE [dbo].[interest_rate_index] CHECK CONSTRAINT [chk_iri_dcc]
GO
ALTER TABLE [dbo].[laytime_term_template]  WITH CHECK ADD  CONSTRAINT [chk_ltt_exclusion] CHECK  (([exclusion_basis]='FHEX' OR [exclusion_basis]='WWDSHEXUU' OR [exclusion_basis]='WWD' OR [exclusion_basis]='SHEXUU' OR [exclusion_basis]='SHEXEIU' OR [exclusion_basis]='SHEX' OR [exclusion_basis]='SHINC'))
GO
ALTER TABLE [dbo].[laytime_term_template] CHECK CONSTRAINT [chk_ltt_exclusion]
GO
ALTER TABLE [dbo].[legal_entity]  WITH CHECK ADD  CONSTRAINT [chk_le_no_self_parent] CHECK  (([parent_entity_id] IS NULL OR [parent_entity_id]<>[legal_entity_id]))
GO
ALTER TABLE [dbo].[legal_entity] CHECK CONSTRAINT [chk_le_no_self_parent]
GO
ALTER TABLE [dbo].[legal_entity]  WITH CHECK ADD  CONSTRAINT [chk_le_parent_ind_consistency] CHECK  (([parent_ind]=(0) AND [parent_entity_id] IS NULL OR [parent_ind]=(1) AND [parent_entity_id] IS NOT NULL))
GO
ALTER TABLE [dbo].[legal_entity] CHECK CONSTRAINT [chk_le_parent_ind_consistency]
GO
ALTER TABLE [dbo].[lng_boil_off_rule]  WITH CHECK ADD  CONSTRAINT [chk_lbor_effective_dates] CHECK  (([effective_to] IS NULL OR [effective_from] IS NULL OR [effective_to]>=[effective_from]))
GO
ALTER TABLE [dbo].[lng_boil_off_rule] CHECK CONSTRAINT [chk_lbor_effective_dates]
GO
ALTER TABLE [dbo].[lng_terminal_detail]  WITH CHECK ADD  CONSTRAINT [chk_ltd_cargo_range] CHECK  (([min_cargo_size_cbm] IS NULL OR [max_cargo_size_cbm] IS NULL OR [max_cargo_size_cbm]>=[min_cargo_size_cbm]))
GO
ALTER TABLE [dbo].[lng_terminal_detail] CHECK CONSTRAINT [chk_ltd_cargo_range]
GO
ALTER TABLE [dbo].[lng_terminal_detail]  WITH CHECK ADD  CONSTRAINT [chk_ltd_terminal_type] CHECK  (([terminal_type]='DUAL' OR [terminal_type]='FSRU' OR [terminal_type]='EXPORT_LIQUEFACTION' OR [terminal_type]='IMPORT_REGAS'))
GO
ALTER TABLE [dbo].[lng_terminal_detail] CHECK CONSTRAINT [chk_ltd_terminal_type]
GO
ALTER TABLE [dbo].[load_shape_component]  WITH CHECK ADD  CONSTRAINT [chk_lsc_month_from] CHECK  (([month_from] IS NULL OR [month_from]>=(1) AND [month_from]<=(12)))
GO
ALTER TABLE [dbo].[load_shape_component] CHECK CONSTRAINT [chk_lsc_month_from]
GO
ALTER TABLE [dbo].[load_shape_component]  WITH CHECK ADD  CONSTRAINT [chk_lsc_month_pair] CHECK  (([month_from] IS NULL AND [month_to] IS NULL OR [month_from] IS NOT NULL AND [month_to] IS NOT NULL))
GO
ALTER TABLE [dbo].[load_shape_component] CHECK CONSTRAINT [chk_lsc_month_pair]
GO
ALTER TABLE [dbo].[load_shape_component]  WITH CHECK ADD  CONSTRAINT [chk_lsc_month_to] CHECK  (([month_to] IS NULL OR [month_to]>=(1) AND [month_to]<=(12)))
GO
ALTER TABLE [dbo].[load_shape_component] CHECK CONSTRAINT [chk_lsc_month_to]
GO
ALTER TABLE [dbo].[load_shape_component]  WITH CHECK ADD  CONSTRAINT [chk_lsc_no_self] CHECK  (([parent_load_shape_id]<>[child_load_shape_id]))
GO
ALTER TABLE [dbo].[load_shape_component] CHECK CONSTRAINT [chk_lsc_no_self]
GO
ALTER TABLE [dbo].[load_shape_component]  WITH CHECK ADD  CONSTRAINT [chk_lsc_weight] CHECK  (([weight_factor]>(0)))
GO
ALTER TABLE [dbo].[load_shape_component] CHECK CONSTRAINT [chk_lsc_weight]
GO
ALTER TABLE [dbo].[load_shape_interval]  WITH CHECK ADD  CONSTRAINT [chk_lsi_day_type] CHECK  (([day_type]='HOLIDAY' OR [day_type]='SUNDAY' OR [day_type]='SATURDAY' OR [day_type]='FRIDAY' OR [day_type]='THURSDAY' OR [day_type]='WEDNESDAY' OR [day_type]='TUESDAY' OR [day_type]='MONDAY' OR [day_type]='WEEKENDS' OR [day_type]='WEEKDAYS' OR [day_type]='ALL'))
GO
ALTER TABLE [dbo].[load_shape_interval] CHECK CONSTRAINT [chk_lsi_day_type]
GO
ALTER TABLE [dbo].[load_shape_interval]  WITH CHECK ADD  CONSTRAINT [chk_lsi_factor] CHECK  (([interval_factor]>=(0)))
GO
ALTER TABLE [dbo].[load_shape_interval] CHECK CONSTRAINT [chk_lsi_factor]
GO
ALTER TABLE [dbo].[load_shape_interval]  WITH CHECK ADD  CONSTRAINT [chk_lsi_interval_no] CHECK  (([interval_no]>=(0) AND [interval_no]<=(95)))
GO
ALTER TABLE [dbo].[load_shape_interval] CHECK CONSTRAINT [chk_lsi_interval_no]
GO
ALTER TABLE [dbo].[load_shape_template]  WITH CHECK ADD  CONSTRAINT [chk_lst_days] CHECK  (([applicable_days]='SUNDAY' OR [applicable_days]='SATURDAY' OR [applicable_days]='FRIDAY' OR [applicable_days]='THURSDAY' OR [applicable_days]='WEDNESDAY' OR [applicable_days]='TUESDAY' OR [applicable_days]='MONDAY' OR [applicable_days]='WEEKENDS' OR [applicable_days]='WEEKDAYS' OR [applicable_days]='ALL'))
GO
ALTER TABLE [dbo].[load_shape_template] CHECK CONSTRAINT [chk_lst_days]
GO
ALTER TABLE [dbo].[load_shape_template]  WITH CHECK ADD  CONSTRAINT [chk_lst_hour_order] CHECK  (([start_hour] IS NULL OR [end_hour] IS NULL OR [end_hour]<>[start_hour]))
GO
ALTER TABLE [dbo].[load_shape_template] CHECK CONSTRAINT [chk_lst_hour_order]
GO
ALTER TABLE [dbo].[load_shape_template]  WITH CHECK ADD  CONSTRAINT [chk_lst_interval_minutes] CHECK  (([interval_minutes]=(60) OR [interval_minutes]=(30) OR [interval_minutes]=(15)))
GO
ALTER TABLE [dbo].[load_shape_template] CHECK CONSTRAINT [chk_lst_interval_minutes]
GO
ALTER TABLE [dbo].[load_shape_template]  WITH CHECK ADD  CONSTRAINT [chk_lst_type] CHECK  (([shape_type]='CUSTOM' OR [shape_type]='OFFPEAK' OR [shape_type]='PEAK' OR [shape_type]='BASELOAD'))
GO
ALTER TABLE [dbo].[load_shape_template] CHECK CONSTRAINT [chk_lst_type]
GO
ALTER TABLE [dbo].[margin_account]  WITH CHECK ADD  CONSTRAINT [chk_ma_acct_type] CHECK  (([account_type]='OMNIBUS' OR [account_type]='CLIENT' OR [account_type]='HOUSE'))
GO
ALTER TABLE [dbo].[margin_account] CHECK CONSTRAINT [chk_ma_acct_type]
GO
ALTER TABLE [dbo].[market]  WITH CHECK ADD  CONSTRAINT [chk_mkt_settle] CHECK  (([settlement_type]='BOTH' OR [settlement_type]='FINANCIAL' OR [settlement_type]='PHYSICAL'))
GO
ALTER TABLE [dbo].[market] CHECK CONSTRAINT [chk_mkt_settle]
GO
ALTER TABLE [dbo].[market]  WITH CHECK ADD  CONSTRAINT [chk_mkt_type] CHECK  (([market_type]='INTERNAL' OR [market_type]='BROKER' OR [market_type]='OTC_BILATERAL' OR [market_type]='OTC_CLEARED' OR [market_type]='EXCHANGE'))
GO
ALTER TABLE [dbo].[market] CHECK CONSTRAINT [chk_mkt_type]
GO
ALTER TABLE [dbo].[metal_assay_component_rule]  WITH CHECK ADD  CONSTRAINT [chk_marc_element_type] CHECK  (([element_type]='IMPURITY' OR [element_type]='PENALTY' OR [element_type]='PAYABLE'))
GO
ALTER TABLE [dbo].[metal_assay_component_rule] CHECK CONSTRAINT [chk_marc_element_type]
GO
ALTER TABLE [dbo].[metal_brand]  WITH CHECK ADD  CONSTRAINT [chk_mb_delisting] CHECK  (([delisting_date] IS NULL OR [approval_date] IS NULL OR [delisting_date]>=[approval_date]))
GO
ALTER TABLE [dbo].[metal_brand] CHECK CONSTRAINT [chk_mb_delisting]
GO
ALTER TABLE [dbo].[mot_type]  WITH CHECK ADD  CONSTRAINT [chk_mot_medium] CHECK  (([transport_medium]='VIRTUAL' OR [transport_medium]='AIR' OR [transport_medium]='PIPELINE' OR [transport_medium]='LAND' OR [transport_medium]='SEA'))
GO
ALTER TABLE [dbo].[mot_type] CHECK CONSTRAINT [chk_mot_medium]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_pcg_amount_called] CHECK  (([amount_called] IS NULL OR [amount_called]>=(0) AND [amount_called]<=[guarantee_amount]))
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [chk_pcg_amount_called]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_pcg_beneficiary_type] CHECK  (([beneficiary_entity_type]='COUNTERPARTY' OR [beneficiary_entity_type]='LEGAL_ENTITY'))
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [chk_pcg_beneficiary_type]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_pcg_dates] CHECK  (([expiry_date] IS NULL OR [expiry_date]>=[issue_date]))
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [chk_pcg_dates]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_pcg_direction] CHECK  (([direction]='ISSUED' OR [direction]='RECEIVED'))
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [chk_pcg_direction]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_pcg_evergreen_expiry] CHECK  (([is_evergreen]=(1) AND [expiry_date] IS NULL OR [is_evergreen]=(0) AND [expiry_date] IS NOT NULL))
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [chk_pcg_evergreen_expiry]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_pcg_guarantor_type] CHECK  (([guarantor_entity_type]='COUNTERPARTY' OR [guarantor_entity_type]='LEGAL_ENTITY'))
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [chk_pcg_guarantor_type]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_pcg_not_self_guarantee] CHECK  ((NOT ([guarantor_entity_type]=[principal_entity_type] AND [guarantor_entity_id]=[principal_entity_id])))
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [chk_pcg_not_self_guarantee]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_pcg_principal_type] CHECK  (([principal_entity_type]='COUNTERPARTY' OR [principal_entity_type]='LEGAL_ENTITY'))
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [chk_pcg_principal_type]
GO
ALTER TABLE [dbo].[parent_company_guarantee]  WITH CHECK ADD  CONSTRAINT [chk_pcg_status] CHECK  (([pcg_status]='CALLED' OR [pcg_status]='CANCELLED' OR [pcg_status]='EXPIRED' OR [pcg_status]='AMENDED' OR [pcg_status]='ISSUED' OR [pcg_status]='DRAFT'))
GO
ALTER TABLE [dbo].[parent_company_guarantee] CHECK CONSTRAINT [chk_pcg_status]
GO
ALTER TABLE [dbo].[payment_calendar_assignment]  WITH CHECK ADD  CONSTRAINT [chk_pca_cal_distinct] CHECK  (([secondary_holiday_calendar_id] IS NULL OR [secondary_holiday_calendar_id]<>[primary_holiday_calendar_id]))
GO
ALTER TABLE [dbo].[payment_calendar_assignment] CHECK CONSTRAINT [chk_pca_cal_distinct]
GO
ALTER TABLE [dbo].[payment_term]  WITH CHECK ADD  CONSTRAINT [chk_pt_base_event] CHECK  (([base_date_event]='SETTLEMENT_DATE' OR [base_date_event]='METER_READ_DATE' OR [base_date_event]='PRICING_DATE' OR [base_date_event]='OUTTURN_DATE' OR [base_date_event]='COMPLETION_OF_DISCHARGE' OR [base_date_event]='NOR_TENDERED' OR [base_date_event]='BL_DATE' OR [base_date_event]='END_OF_DELIVERY_MONTH' OR [base_date_event]='DELIVERY_DATE' OR [base_date_event]='TRADE_DATE' OR [base_date_event]='INVOICE_DATE'))
GO
ALTER TABLE [dbo].[payment_term] CHECK CONSTRAINT [chk_pt_base_event]
GO
ALTER TABLE [dbo].[payment_term]  WITH CHECK ADD  CONSTRAINT [chk_pt_bdc] CHECK  (([business_day_convention]='MOD_PRECEDING' OR [business_day_convention]='PRECEDING' OR [business_day_convention]='MOD_FOLLOWING' OR [business_day_convention]='FOLLOWING' OR [business_day_convention]='UNADJUSTED'))
GO
ALTER TABLE [dbo].[payment_term] CHECK CONSTRAINT [chk_pt_bdc]
GO
ALTER TABLE [dbo].[payment_term]  WITH CHECK ADD  CONSTRAINT [chk_pt_days_basis] CHECK  (([days_basis]='BUSINESS' OR [days_basis]='CALENDAR'))
GO
ALTER TABLE [dbo].[payment_term] CHECK CONSTRAINT [chk_pt_days_basis]
GO
ALTER TABLE [dbo].[period]  WITH CHECK ADD  CONSTRAINT [chk_period_date_order] CHECK  (([period_start] IS NULL OR [period_end] IS NULL OR [period_end]>=[period_start]))
GO
ALTER TABLE [dbo].[period] CHECK CONSTRAINT [chk_period_date_order]
GO
ALTER TABLE [dbo].[period]  WITH CHECK ADD  CONSTRAINT [chk_period_dates] CHECK  (([period_start] IS NULL AND [period_end] IS NULL OR [period_start] IS NOT NULL AND [period_end] IS NOT NULL))
GO
ALTER TABLE [dbo].[period] CHECK CONSTRAINT [chk_period_dates]
GO
ALTER TABLE [dbo].[period]  WITH CHECK ADD  CONSTRAINT [chk_period_roll_unit] CHECK  (([roll_unit]=NULL OR [roll_unit]='YEAR' OR [roll_unit]='QUARTER' OR [roll_unit]='MONTH' OR [roll_unit]='WEEK' OR [roll_unit]='DAY'))
GO
ALTER TABLE [dbo].[period] CHECK CONSTRAINT [chk_period_roll_unit]
GO
ALTER TABLE [dbo].[period]  WITH CHECK ADD  CONSTRAINT [chk_period_rolling] CHECK  (([is_rolling]=(0) OR [is_rolling]=(1) AND [roll_offset] IS NOT NULL AND [roll_unit] IS NOT NULL))
GO
ALTER TABLE [dbo].[period] CHECK CONSTRAINT [chk_period_rolling]
GO
ALTER TABLE [dbo].[period]  WITH CHECK ADD  CONSTRAINT [chk_period_type] CHECK  (([period_type]='CUSTOM' OR [period_type]='CROP_YEAR' OR [period_type]='YEAR' OR [period_type]='HALF_YEAR' OR [period_type]='SEASON' OR [period_type]='QUARTER' OR [period_type]='MONTH' OR [period_type]='WEEK' OR [period_type]='DAY' OR [period_type]='INTRADAY' OR [period_type]='SPOT'))
GO
ALTER TABLE [dbo].[period] CHECK CONSTRAINT [chk_period_type]
GO
ALTER TABLE [dbo].[pipeline]  WITH CHECK ADD  CONSTRAINT [chk_pl_commodity] CHECK  (([commodity_type]='OTHER' OR [commodity_type]='MULTI' OR [commodity_type]='GAS' OR [commodity_type]='OIL'))
GO
ALTER TABLE [dbo].[pipeline] CHECK CONSTRAINT [chk_pl_commodity]
GO
ALTER TABLE [dbo].[pipeline]  WITH CHECK ADD  CONSTRAINT [chk_pl_flow] CHECK  (([flow_direction]='VARIABLE' OR [flow_direction]='BIDIRECTIONAL' OR [flow_direction]='UNIDIRECTIONAL'))
GO
ALTER TABLE [dbo].[pipeline] CHECK CONSTRAINT [chk_pl_flow]
GO
ALTER TABLE [dbo].[pipeline]  WITH CHECK ADD  CONSTRAINT [chk_pl_type] CHECK  (([pipeline_type]='OTHER' OR [pipeline_type]='MULTI_PRODUCT' OR [pipeline_type]='LNG' OR [pipeline_type]='GAS_DISTRIBUTION' OR [pipeline_type]='GAS_TRANSMISSION' OR [pipeline_type]='PRODUCTS' OR [pipeline_type]='CRUDE'))
GO
ALTER TABLE [dbo].[pipeline] CHECK CONSTRAINT [chk_pl_type]
GO
ALTER TABLE [dbo].[pipeline_cycle]  WITH CHECK ADD  CONSTRAINT [chk_pc_days] CHECK  (([applies_to_days]='SUNDAY' OR [applies_to_days]='SATURDAY' OR [applies_to_days]='FRIDAY' OR [applies_to_days]='THURSDAY' OR [applies_to_days]='WEDNESDAY' OR [applies_to_days]='TUESDAY' OR [applies_to_days]='MONDAY' OR [applies_to_days]='WEEKENDS' OR [applies_to_days]='WEEKDAYS' OR [applies_to_days]='ALL'))
GO
ALTER TABLE [dbo].[pipeline_cycle] CHECK CONSTRAINT [chk_pc_days]
GO
ALTER TABLE [dbo].[pipeline_cycle]  WITH CHECK ADD  CONSTRAINT [chk_pc_type] CHECK  (([cycle_type]='ADHOC' OR [cycle_type]='MONTHLY' OR [cycle_type]='DAILY' OR [cycle_type]='INTRADAY'))
GO
ALTER TABLE [dbo].[pipeline_cycle] CHECK CONSTRAINT [chk_pc_type]
GO
ALTER TABLE [dbo].[pipeline_point]  WITH CHECK ADD  CONSTRAINT [chk_pp_flow] CHECK  (([flow_direction]='BOTH' OR [flow_direction]='EXIT_ONLY' OR [flow_direction]='ENTRY_ONLY'))
GO
ALTER TABLE [dbo].[pipeline_point] CHECK CONSTRAINT [chk_pp_flow]
GO
ALTER TABLE [dbo].[pipeline_point]  WITH CHECK ADD  CONSTRAINT [chk_pp_type] CHECK  (([point_type]='PRESSURE_REDUCE' OR [point_type]='COMPRESSOR' OR [point_type]='METERING' OR [point_type]='STORAGE_LINK' OR [point_type]='INTERCONNECT' OR [point_type]='EXIT' OR [point_type]='ENTRY'))
GO
ALTER TABLE [dbo].[pipeline_point] CHECK CONSTRAINT [chk_pp_type]
GO
ALTER TABLE [dbo].[pipeline_segment]  WITH CHECK ADD  CONSTRAINT [chk_ps_no_self] CHECK  (([from_point_id]<>[to_point_id]))
GO
ALTER TABLE [dbo].[pipeline_segment] CHECK CONSTRAINT [chk_ps_no_self]
GO
ALTER TABLE [dbo].[pipeline_segment]  WITH CHECK ADD  CONSTRAINT [chk_ps_opstatus] CHECK  (([operational_status]='DECOMMISSIONED' OR [operational_status]='OUTAGE' OR [operational_status]='MAINTENANCE' OR [operational_status]='REDUCED_CAPACITY' OR [operational_status]='IN_SERVICE'))
GO
ALTER TABLE [dbo].[pipeline_segment] CHECK CONSTRAINT [chk_ps_opstatus]
GO
ALTER TABLE [dbo].[pipeline_tariff]  WITH CHECK ADD  CONSTRAINT [chk_pt_cap_type] CHECK  (([capacity_type]='WITHIN_ZONE' OR [capacity_type]='ENTRY_EXIT' OR [capacity_type]='EXIT' OR [capacity_type]='ENTRY'))
GO
ALTER TABLE [dbo].[pipeline_tariff] CHECK CONSTRAINT [chk_pt_cap_type]
GO
ALTER TABLE [dbo].[pipeline_tariff]  WITH CHECK ADD  CONSTRAINT [chk_pt_season] CHECK  (([season]=NULL OR [season]='ALL' OR [season]='WINTER' OR [season]='SUMMER'))
GO
ALTER TABLE [dbo].[pipeline_tariff] CHECK CONSTRAINT [chk_pt_season]
GO
ALTER TABLE [dbo].[pipeline_tariff]  WITH CHECK ADD  CONSTRAINT [chk_pt_type] CHECK  (([tariff_type]='CONNECTION' OR [tariff_type]='COMMODITY' OR [tariff_type]='CAPACITY_BOOKING' OR [tariff_type]='INTERRUPTIBLE' OR [tariff_type]='FIRM'))
GO
ALTER TABLE [dbo].[pipeline_tariff] CHECK CONSTRAINT [chk_pt_type]
GO
ALTER TABLE [dbo].[power_pnode]  WITH CHECK ADD  CONSTRAINT [chk_pnode_type] CHECK  (([node_type]='ZONE' OR [node_type]='BUS' OR [node_type]='INTERFACE' OR [node_type]='HUB'))
GO
ALTER TABLE [dbo].[power_pnode] CHECK CONSTRAINT [chk_pnode_type]
GO
ALTER TABLE [dbo].[power_product_detail]  WITH CHECK ADD  CONSTRAINT [chk_ppd_settlement_point] CHECK  (([settlement_point_type]=NULL OR [settlement_point_type]='SYSTEM' OR [settlement_point_type]='HUB' OR [settlement_point_type]='ZONE' OR [settlement_point_type]='NODE'))
GO
ALTER TABLE [dbo].[power_product_detail] CHECK CONSTRAINT [chk_ppd_settlement_point]
GO
ALTER TABLE [dbo].[power_product_detail]  WITH CHECK ADD  CONSTRAINT [chk_ppd_voltage] CHECK  (([voltage_level]=NULL OR [voltage_level]='EXTRA_HIGH' OR [voltage_level]='HIGH' OR [voltage_level]='MEDIUM' OR [voltage_level]='LOW'))
GO
ALTER TABLE [dbo].[power_product_detail] CHECK CONSTRAINT [chk_ppd_voltage]
GO
ALTER TABLE [dbo].[price_index_source]  WITH CHECK ADD  CONSTRAINT [chk_pis_role] CHECK  (([source_role]='REFERENCE' OR [source_role]='BACKUP' OR [source_role]='SETTLEMENT' OR [source_role]='PRIMARY_MTM'))
GO
ALTER TABLE [dbo].[price_index_source] CHECK CONSTRAINT [chk_pis_role]
GO
ALTER TABLE [dbo].[price_source]  WITH CHECK ADD  CONSTRAINT [chk_ps_delivery] CHECK  (([delivery_method]='REAL_TIME_FEED' OR [delivery_method]='MANUAL' OR [delivery_method]='EMAIL' OR [delivery_method]='FTP' OR [delivery_method]='API'))
GO
ALTER TABLE [dbo].[price_source] CHECK CONSTRAINT [chk_ps_delivery]
GO
ALTER TABLE [dbo].[price_source]  WITH CHECK ADD  CONSTRAINT [chk_ps_freq] CHECK  (([frequency]='MANUAL' OR [frequency]='WEEKLY' OR [frequency]='EOD' OR [frequency]='INTRADAY' OR [frequency]='REAL_TIME'))
GO
ALTER TABLE [dbo].[price_source] CHECK CONSTRAINT [chk_ps_freq]
GO
ALTER TABLE [dbo].[price_source]  WITH CHECK ADD  CONSTRAINT [chk_ps_type] CHECK  (([source_type]='OTHER' OR [source_type]='INTERNAL' OR [source_type]='REUTERS' OR [source_type]='BLOOMBERG' OR [source_type]='BROKER' OR [source_type]='VENDOR' OR [source_type]='EXCHANGE'))
GO
ALTER TABLE [dbo].[price_source] CHECK CONSTRAINT [chk_ps_type]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [chk_pr_fb_basis] CHECK  (([fallback_deadline_basis]=NULL OR [fallback_deadline_basis]='INVOICE_DATE' OR [fallback_deadline_basis]='BUSINESS' OR [fallback_deadline_basis]='CALENDAR'))
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [chk_pr_fb_basis]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [chk_pr_fx] CHECK  (([fx_fixing_type]=NULL OR [fx_fixing_type]='ECB_FIXING' OR [fx_fixing_type]='FIXED' OR [fx_fixing_type]='AVERAGE' OR [fx_fixing_type]='SPOT'))
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [chk_pr_fx]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [chk_pr_inv_basis] CHECK  (([invoice_timing_basis]='BUSINESS' OR [invoice_timing_basis]='CALENDAR'))
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [chk_pr_inv_basis]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [chk_pr_late] CHECK  (([late_pricing_rule]=NULL OR [late_pricing_rule]='ESCALATE' OR [late_pricing_rule]='ESTIMATED' OR [late_pricing_rule]='PROVISIONAL' OR [late_pricing_rule]='SUSPEND_INVOICE'))
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [chk_pr_late]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [chk_pr_prov] CHECK  (([provisional_basis]=NULL OR [provisional_basis]='AGREED_ESTIMATE' OR [provisional_basis]='BUDGET_PRICE' OR [provisional_basis]='LAST_KNOWN_FIXING' OR [provisional_basis]='PRIOR_MONTH_AVG'))
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [chk_pr_prov]
GO
ALTER TABLE [dbo].[pricing_rule]  WITH CHECK ADD  CONSTRAINT [chk_pr_round] CHECK  (([rounding_convention]='DOWN' OR [rounding_convention]='UP' OR [rounding_convention]='TRUNCATE' OR [rounding_convention]='BANKER' OR [rounding_convention]='STANDARD'))
GO
ALTER TABLE [dbo].[pricing_rule] CHECK CONSTRAINT [chk_pr_round]
GO
ALTER TABLE [dbo].[pricing_trigger_event_type]  WITH CHECK ADD  CONSTRAINT [chk_ptet_cat] CHECK  (([trigger_category]='EXCHANGE' OR [trigger_category]='INSPECTION' OR [trigger_category]='SETTLEMENT' OR [trigger_category]='TIME_BASED' OR [trigger_category]='DEEMED' OR [trigger_category]='DOCUMENTARY'))
GO
ALTER TABLE [dbo].[pricing_trigger_event_type] CHECK CONSTRAINT [chk_ptet_cat]
GO
ALTER TABLE [dbo].[pricing_window_rule]  WITH CHECK ADD  CONSTRAINT [chk_pwr_avg] CHECK  (([averaging_method]='CUSTOM_WEIGHTED' OR [averaging_method]='VOLUME_WEIGHTED' OR [averaging_method]='SIMPLE'))
GO
ALTER TABLE [dbo].[pricing_window_rule] CHECK CONSTRAINT [chk_pwr_avg]
GO
ALTER TABLE [dbo].[pricing_window_rule]  WITH CHECK ADD  CONSTRAINT [chk_pwr_days] CHECK  (([days_before]>=(0) AND [days_after]>=(0)))
GO
ALTER TABLE [dbo].[pricing_window_rule] CHECK CONSTRAINT [chk_pwr_days]
GO
ALTER TABLE [dbo].[pricing_window_rule]  WITH CHECK ADD  CONSTRAINT [chk_pwr_daytype] CHECK  (([day_count_type]='PUBLICATION' OR [day_count_type]='TRADING' OR [day_count_type]='BUSINESS' OR [day_count_type]='CALENDAR'))
GO
ALTER TABLE [dbo].[pricing_window_rule] CHECK CONSTRAINT [chk_pwr_daytype]
GO
ALTER TABLE [dbo].[pricing_window_rule]  WITH CHECK ADD  CONSTRAINT [chk_pwr_min_fix] CHECK  (([min_fixings_required]>=(1)))
GO
ALTER TABLE [dbo].[pricing_window_rule] CHECK CONSTRAINT [chk_pwr_min_fix]
GO
ALTER TABLE [dbo].[pricing_window_rule]  WITH CHECK ADD  CONSTRAINT [chk_pwr_missing] CHECK  (([missing_fixing_rule]='ZERO' OR [missing_fixing_rule]='SUSPEND' OR [missing_fixing_rule]='EXCLUDE' OR [missing_fixing_rule]='INTERPOLATE' OR [missing_fixing_rule]='BACKUP_SOURCE' OR [missing_fixing_rule]='NEXT_DAY' OR [missing_fixing_rule]='PRIOR_DAY'))
GO
ALTER TABLE [dbo].[pricing_window_rule] CHECK CONSTRAINT [chk_pwr_missing]
GO
ALTER TABLE [dbo].[pricing_window_rule]  WITH CHECK ADD  CONSTRAINT [chk_pwr_type] CHECK  (([window_type]='CUSTOM' OR [window_type]='FIXED_DATES' OR [window_type]='DELIVERY_PERIOD' OR [window_type]='DELIVERY_MONTH' OR [window_type]='BACKWARD' OR [window_type]='FORWARD' OR [window_type]='SYMMETRIC' OR [window_type]='SINGLE_DAY'))
GO
ALTER TABLE [dbo].[pricing_window_rule] CHECK CONSTRAINT [chk_pwr_type]
GO
ALTER TABLE [dbo].[railcar]  WITH CHECK ADD  CONSTRAINT [chk_rc_type] CHECK  (([car_type]='OTHER' OR [car_type]='BOXCAR' OR [car_type]='FLATCAR' OR [car_type]='COVERED_HOPPER' OR [car_type]='HOPPER_CAR' OR [car_type]='TANK_CAR'))
GO
ALTER TABLE [dbo].[railcar] CHECK CONSTRAINT [chk_rc_type]
GO
ALTER TABLE [dbo].[regulatory_obligation]  WITH CHECK ADD  CONSTRAINT [chk_ro_type] CHECK  (([obligation_type]='PARTIAL' OR [obligation_type]='EXEMPT' OR [obligation_type]='DELEGATED' OR [obligation_type]='FULL'))
GO
ALTER TABLE [dbo].[regulatory_obligation] CHECK CONSTRAINT [chk_ro_type]
GO
ALTER TABLE [dbo].[regulatory_report_type]  WITH CHECK ADD  CONSTRAINT [chk_rrt_reg] CHECK  (([regulation]='OTHER' OR [regulation]='INTERNAL' OR [regulation]='MAS' OR [regulation]='ASIC' OR [regulation]='UK_EMIR' OR [regulation]='SFTR' OR [regulation]='MIFID2' OR [regulation]='DODD_FRANK' OR [regulation]='CFTC' OR [regulation]='REMIT' OR [regulation]='EMIR'))
GO
ALTER TABLE [dbo].[regulatory_report_type] CHECK CONSTRAINT [chk_rrt_reg]
GO
ALTER TABLE [dbo].[tank]  WITH CHECK ADD  CONSTRAINT [chk_tank_status] CHECK  (([tank_status]='DECOMMISSIONED' OR [tank_status]='MOTHBALLED' OR [tank_status]='INSPECTION' OR [tank_status]='CLEANING' OR [tank_status]='MAINTENANCE' OR [tank_status]='IN_SERVICE'))
GO
ALTER TABLE [dbo].[tank] CHECK CONSTRAINT [chk_tank_status]
GO
ALTER TABLE [dbo].[tank]  WITH CHECK ADD  CONSTRAINT [chk_tank_type] CHECK  (([tank_type]='OTHER' OR [tank_type]='SILO' OR [tank_type]='OPEN_TOP' OR [tank_type]='UNDERGROUND' OR [tank_type]='CRYOGENIC' OR [tank_type]='PRESSURE_SPHERE' OR [tank_type]='INTERNAL_FLOAT' OR [tank_type]='FLOATING_ROOF' OR [tank_type]='FIXED_ROOF'))
GO
ALTER TABLE [dbo].[tank] CHECK CONSTRAINT [chk_tank_type]
GO
ALTER TABLE [dbo].[tax_registration]  WITH CHECK ADD  CONSTRAINT [chk_tax_entity_type] CHECK  (([entity_type]='COUNTERPARTY' OR [entity_type]='LEGAL_ENTITY'))
GO
ALTER TABLE [dbo].[tax_registration] CHECK CONSTRAINT [chk_tax_entity_type]
GO
ALTER TABLE [dbo].[transmission_right_type]  WITH CHECK ADD  CONSTRAINT [chk_trt_allocation] CHECK  (([allocation_method]='BILATERAL_TRANSFER' OR [allocation_method]='ARR_ALLOCATION' OR [allocation_method]='AUCTION'))
GO
ALTER TABLE [dbo].[transmission_right_type] CHECK CONSTRAINT [chk_trt_allocation]
GO
ALTER TABLE [dbo].[transmission_right_type]  WITH CHECK ADD  CONSTRAINT [chk_trt_settlement] CHECK  (([settlement_basis]='RT_LMP_DIFFERENCE' OR [settlement_basis]='DA_LMP_DIFFERENCE'))
GO
ALTER TABLE [dbo].[transmission_right_type] CHECK CONSTRAINT [chk_trt_settlement]
GO
ALTER TABLE [dbo].[transmission_zone]  WITH CHECK ADD  CONSTRAINT [chk_tz_type] CHECK  (([zone_type]='OTHER' OR [zone_type]='HUB' OR [zone_type]='PRICING_NODE_GROUP' OR [zone_type]='GSP_GROUP' OR [zone_type]='LOAD_ZONE'))
GO
ALTER TABLE [dbo].[transmission_zone] CHECK CONSTRAINT [chk_tz_type]
GO
ALTER TABLE [dbo].[transport_route]  WITH CHECK ADD  CONSTRAINT [chk_tr_no_self] CHECK  (([origin_location_id]<>[dest_location_id]))
GO
ALTER TABLE [dbo].[transport_route] CHECK CONSTRAINT [chk_tr_no_self]
GO
ALTER TABLE [dbo].[truck]  WITH CHECK ADD  CONSTRAINT [chk_truck_type] CHECK  (([truck_type]='OTHER' OR [truck_type]='REFRIGERATED' OR [truck_type]='CONTAINER_TRUCK' OR [truck_type]='FLATBED' OR [truck_type]='DRY_BULK' OR [truck_type]='ROAD_TANKER'))
GO
ALTER TABLE [dbo].[truck] CHECK CONSTRAINT [chk_truck_type]
GO
ALTER TABLE [dbo].[user_role]  WITH CHECK ADD  CONSTRAINT [chk_role_status] CHECK  (([status]='REJECTED' OR [status]='APPROVED' OR [status]='PENDING_APPROVAL' OR [status]='DRAFT'))
GO
ALTER TABLE [dbo].[user_role] CHECK CONSTRAINT [chk_role_status]
GO
ALTER TABLE [dbo].[user_role]  WITH CHECK ADD  CONSTRAINT [chk_role_type] CHECK  (([role_type]='CUSTOM' OR [role_type]='SYSTEM'))
GO
ALTER TABLE [dbo].[user_role] CHECK CONSTRAINT [chk_role_type]
GO
ALTER TABLE [dbo].[vessel]  WITH CHECK ADD  CONSTRAINT [chk_ves_type] CHECK  (([vessel_type]='OTHER' OR [vessel_type]='BARGE' OR [vessel_type]='BULK_CARRIER' OR [vessel_type]='CHEMICAL_TANKER' OR [vessel_type]='LPG_CARRIER' OR [vessel_type]='LNG_CARRIER' OR [vessel_type]='LR2_TANKER' OR [vessel_type]='LR1_TANKER' OR [vessel_type]='MR_TANKER' OR [vessel_type]='HANDYSIZE' OR [vessel_type]='PANAMAX' OR [vessel_type]='AFRAMAX' OR [vessel_type]='SUEZMAX' OR [vessel_type]='VLCC'))
GO
ALTER TABLE [dbo].[vessel] CHECK CONSTRAINT [chk_ves_type]
GO
ALTER TABLE [dbo].[vessel]  WITH CHECK ADD  CONSTRAINT [chk_ves_vetting] CHECK  (([vetting_status]='EXPIRED' OR [vetting_status]='REJECTED' OR [vetting_status]='CONDITIONAL' OR [vetting_status]='PENDING' OR [vetting_status]='APPROVED'))
GO
ALTER TABLE [dbo].[vessel] CHECK CONSTRAINT [chk_ves_vetting]
GO
ALTER TABLE [dbo].[vessel_certificate]  WITH CHECK ADD  CONSTRAINT [chk_vc_type] CHECK  (([cert_type]='OTHER' OR [cert_type]='ITOPF' OR [cert_type]='RIGHTSHIP' OR [cert_type]='USCG' OR [cert_type]='MARPOL' OR [cert_type]='ISPS' OR [cert_type]='ISM' OR [cert_type]='CLASS_CERT' OR [cert_type]='HULL_INSURANCE' OR [cert_type]='PI_INSURANCE' OR [cert_type]='CDI' OR [cert_type]='SIRE'))
GO
ALTER TABLE [dbo].[vessel_certificate] CHECK CONSTRAINT [chk_vc_type]
GO
