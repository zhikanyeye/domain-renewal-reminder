CREATE TABLE IF NOT EXISTS email_send_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  domain_id TEXT,
  domain_address TEXT,
  email_type TEXT NOT NULL,
  trigger_source TEXT NOT NULL,
  provider TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_email_send_logs_created_at ON email_send_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_status ON email_send_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_type ON email_send_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_domain_id ON email_send_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_user_id ON email_send_logs(user_id);
