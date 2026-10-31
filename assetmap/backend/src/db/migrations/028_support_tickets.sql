-- ─────────────────────────────────────────────────────
-- SUPPORT TICKETS
-- A user opens a ticket (from the Help page chat or the email form) and
-- exchanges messages in a thread. Rows are always scoped by user_id.
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       VARCHAR(20) NOT NULL UNIQUE,      -- shown to the user, e.g. CS-7K3P9Q
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category        VARCHAR(30) NOT NULL CHECK (category IN (
                    'account','consent','assets','property','nominee',
                    'will','family','billing','privacy','bug','other'
                  )),
  subject         VARCHAR(150) NOT NULL,
  channel         VARCHAR(10) NOT NULL DEFAULT 'chat' CHECK (channel IN ('chat','email')),
  status          VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','awaiting_user','closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender          VARCHAR(10) NOT NULL CHECK (sender IN ('user','agent','assistant','system')),
  body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  -- clock_timestamp(), not NOW(): messages written in one transaction must keep their order
  created_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id, created_at);
