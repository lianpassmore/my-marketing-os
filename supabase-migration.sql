-- ============================================================
-- Signal by DreamStorm — Supabase Migration
-- Run this in your Supabase SQL Editor (dashboard.supabase.com)
-- ============================================================

-- Flows (email sequences)
create table if not exists flows (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  trigger_type text not null default 'new_contact', -- 'new_contact', 'tag', 'post_purchase', 'manual'
  trigger_tag text, -- for trigger_type = 'tag', which tag to watch
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  status text not null default 'draft', -- 'draft', 'active', 'paused'
  send_days text[] default array['tuesday','thursday'],
  send_time text default '10:00',
  created_at timestamptz default now()
);

-- Flow enrollments (contact progress through a flow)
create table if not exists flow_enrollments (
  id uuid default gen_random_uuid() primary key,
  flow_id uuid references flows(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  current_step_index integer default 0,
  next_send_at timestamptz,
  status text default 'active', -- 'active', 'completed', 'unsubscribed', 'paused'
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  unique(flow_id, lead_id)
);

-- Email events (sent, delivered, opened, clicked, bounced, complained)
create table if not exists email_events (
  id uuid default gen_random_uuid() primary key,
  resend_email_id text,
  lead_id uuid references leads(id),
  prospect_id uuid references prospects(id),
  flow_id uuid references flows(id),
  broadcast_id uuid,
  step_index integer,
  subject text,
  event_type text not null, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'
  url_clicked text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Run this if upgrading an existing database that lacks prospect_id on email_events:
-- alter table email_events add column if not exists prospect_id uuid references prospects(id);

-- Broadcasts (one-off email sends)
create table if not exists broadcasts (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  body_html text not null,
  body_text text,
  framework text,
  segment_tags text[] default array[]::text[],
  status text default 'draft', -- 'draft', 'sending', 'sent'
  is_plain_text boolean default false,
  ab_subject_b text,
  ab_winner text, -- 'a' or 'b'
  recipient_count integer default 0,
  sent_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz default now()
);

-- If upgrading an existing database, run:
-- alter table broadcasts add column if not exists scheduled_for timestamptz;

-- Indexes for performance
create index if not exists idx_flow_enrollments_next_send on flow_enrollments(next_send_at) where status = 'active';
create index if not exists idx_email_events_lead on email_events(lead_id);
create index if not exists idx_email_events_type on email_events(event_type);
create index if not exists idx_email_events_created on email_events(created_at);
create index if not exists idx_email_events_broadcast on email_events(broadcast_id);
