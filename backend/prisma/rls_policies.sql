-- Enable Row Level Security
ALTER TABLE "UsageEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Aggregate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent collision
DROP POLICY IF EXISTS usage_event_tenant_isolation ON "UsageEvent";
DROP POLICY IF EXISTS aggregate_tenant_isolation ON "Aggregate";
DROP POLICY IF EXISTS invoice_tenant_isolation ON "Invoice";

-- Create policies for tenant isolation using Postgres session parameter 'app.current_organization_id'
CREATE POLICY usage_event_tenant_isolation ON "UsageEvent"
  FOR ALL
  USING ("organizationId" = nullif(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = nullif(current_setting('app.current_organization_id', true), ''));

CREATE POLICY aggregate_tenant_isolation ON "Aggregate"
  FOR ALL
  USING ("organizationId" = nullif(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = nullif(current_setting('app.current_organization_id', true), ''));

CREATE POLICY invoice_tenant_isolation ON "Invoice"
  FOR ALL
  USING ("organizationId" = nullif(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = nullif(current_setting('app.current_organization_id', true), ''));
