-- 진지 (Jinji) — migration 7: 방 종류(대화/토론/격돌) + 2:2 팀 매칭 + 격돌 관전 투표
-- Run this in the Supabase SQL Editor. Safe to run on a fresh database too.

alter table rooms add column if not exists kind text not null default 'chat';
-- kind: 'chat'(1:1 대화) | 'debate'(2:2 토론) | 'clash'(1:1 격돌 + 관전 투표)

-- 토론(debate) 방의 2번째 팀원 — 대표 발언자는 기존 seat_a/seat_b가 그대로 맡고,
-- 팀의 2번째 사람은 손들기를 써서 덧붙이는 보조 발언자다.
alter table rooms add column if not exists team_a_member2 text;
alter table rooms add column if not exists team_b_member2 text;

create table if not exists votes (
  id bigint generated always as identity primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  voter_nickname text not null,
  side text not null check (side in ('A', 'B')),
  created_at timestamptz not null default now(),
  unique (room_id, voter_nickname)
);

create index if not exists votes_room_idx on votes(room_id);

alter table votes enable row level security;

drop policy if exists "votes anon all" on votes;
create policy "votes anon all" on votes for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table votes;
  end if;
end $$;
