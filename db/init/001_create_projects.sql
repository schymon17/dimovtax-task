CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'on hold', 'completed')),
  deadline DATE NOT NULL,
  assigned_team_member TEXT NOT NULL,
  budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO projects (name, status, deadline, assigned_team_member, budget)
VALUES
  ('Tax Advisory Portal', 'active', '2026-07-18', 'Maya Chen', 42000.00),
  ('Client Onboarding Automation', 'on hold', '2026-08-02', 'Andre Wallace', 28500.00),
  ('Quarterly Compliance Review', 'active', '2026-07-26', 'Priya Shah', 18000.00),
  ('Expense Audit Workspace', 'completed', '2026-06-28', 'Noah Bennett', 31000.00),
  ('Revenue Forecast Dashboard', 'active', '2026-08-15', 'Elena Garcia', 56000.00),
  ('Document Collection Flow', 'completed', '2026-07-04', 'Sam Taylor', 22500.00)
ON CONFLICT DO NOTHING;
