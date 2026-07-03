-- V48: Replace special_contract_flag (BIT) with special_reference (NVARCHAR(180))
-- A special contract is not a yes/no property — it carries a reference to the
-- side letter / bespoke clause. Free text up to 180 characters at trade level.

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'special_reference')
  ALTER TABLE dbo.trade ADD special_reference NVARCHAR(180) NULL;
GO

-- Preserve intent for any rows flagged special before the drop
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'special_contract_flag')
BEGIN
  EXEC sp_executesql N'
    UPDATE dbo.trade SET special_reference = ''LEGACY: flagged special — reference not captured''
    WHERE special_contract_flag = 1 AND special_reference IS NULL';

  DECLARE @df NVARCHAR(200);
  SELECT @df = dc.name
  FROM sys.default_constraints dc
  JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
  WHERE dc.parent_object_id = OBJECT_ID('dbo.trade') AND c.name = 'special_contract_flag';
  IF @df IS NOT NULL EXEC('ALTER TABLE dbo.trade DROP CONSTRAINT [' + @df + ']');

  ALTER TABLE dbo.trade DROP COLUMN special_contract_flag;
END;
GO

-- Demo seed: Urals cargo (trade 7) carries a pricing side letter
UPDATE dbo.trade
SET special_reference = 'Side letter 2026-06: 5-day BWAVE pricing override, Med grade'
WHERE trade_id = 7 AND special_reference LIKE 'LEGACY:%';
GO
