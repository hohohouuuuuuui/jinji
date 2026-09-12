-- 진지 (Jinji) — migration 2: AI 격돌방 + 실제 참가기록
-- Already ran schema.sql once? Run this too (Supabase SQL Editor → New query).
-- Safe to run on a fresh database as well (all statements are idempotent).

alter table rooms add column if not exists vs_ai boolean not null default false;

create table if not exists logs (
  id bigint generated always as identity primary key,
  nickname text not null,
  topic_title text not null,
  quote text not null,
  badges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists logs_nickname_idx on logs(nickname, created_at desc);

alter table logs enable row level security;

drop policy if exists "logs anon all" on logs;
create policy "logs anon all" on logs for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'logs'
  ) then
    alter publication supabase_realtime add table logs;
  end if;
end $$;
