-- Add auto_update_equity_on_contribution setting to businesses table
-- When enabled, equity will automatically recalculate when capital contributions are added

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS auto_update_equity_on_contribution BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN businesses.auto_update_equity_on_contribution IS
  'When true, equity percentages will automatically update based on capital contributions. When false, equity must be manually updated by owner.';
