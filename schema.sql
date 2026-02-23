-- Domain Renewal Reminder Service Database Schema
-- For Cloudflare D1 (SQLite-compatible)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_verified INTEGER DEFAULT 0,
  is_blacklisted INTEGER DEFAULT 0,
  blacklist_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_blacklisted ON users(is_blacklisted);

-- Domains table
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  domain_address TEXT NOT NULL,
  renewal_url TEXT NOT NULL,
  registration_date INTEGER NOT NULL,
  usage_period_years INTEGER NOT NULL,
  expiry_date INTEGER NOT NULL,
  reminder_days_offset INTEGER NOT NULL,
  reminder_start_date INTEGER NOT NULL,
  reminder_email TEXT NOT NULL,
  reminder_count INTEGER NOT NULL,
  reminders_sent INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_renewal_url ON domains(renewal_url);
CREATE INDEX IF NOT EXISTS idx_domains_usage_period ON domains(usage_period_years);
CREATE INDEX IF NOT EXISTS idx_domains_reminder_count ON domains(reminder_count);
CREATE INDEX IF NOT EXISTS idx_domains_reminder_date ON domains(reminder_start_date);
CREATE INDEX IF NOT EXISTS idx_domains_expiry_date ON domains(expiry_date);

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs(timestamp);
