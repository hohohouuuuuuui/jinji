-- 진지 (Jinji) — Supabase schema for the "진지한 대화" 1:1 real-time track.
-- Run this once in your Supabase project's SQL Editor (Project → SQL Editor → New query).

create extension if not exists "pgcrypto";

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null,
  topic_title text not null,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'closed')),
  seat_a text,
  seat_b text,
  turn text not null default 'A' check (turn in ('A', 'B')),
  briefing jsonb,
  acks_left_a smallint not null default 3,
  acks_left_b smallint not null default 3,
  hand_left_a smallint not null default 2,
  hand_left_b smallint not null default 2,
  changed_a smallint not null default 0,
  changed_b smallint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  seat text not null check (seat in ('A', 'B', 'SYS')),
  sender text not null,
  text text not null,
  acked boolean not null default false,
  moderation jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_id_idx on messages(room_id, created_at);
create index if not exists rooms_waiting_idx on rooms(topic_id, status, created_at);

-- Hackathon-scope RLS: anonymous nickname auth (no Supabase Auth), so we allow
-- the anon key to read/write freely. Do NOT reuse this policy for anything
-- beyond a demo — there is no per-user authorization here.
alter table rooms enable row level security;
alter table messages enable row level security;

drop policy if exists "rooms anon all" on rooms;
create policy "rooms anon all" on rooms for all using (true) with check (true);

drop policy if exists "messages anon all" on messages;
create policy "messages anon all" on messages for all using (true) with check (true);

-- Enable Realtime for both tables (Supabase Dashboard → Database → Replication
-- also works instead of this if you prefer the UI):
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table messages;
