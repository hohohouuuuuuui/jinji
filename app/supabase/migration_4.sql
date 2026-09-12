-- 진지 (Jinji) — migration 4: 사용자별 진지벌레 성장(레벨/이미지) 저장
-- Run this in the Supabase SQL Editor. Safe to run on a fresh database too.

create table if not exists profiles (
  nickname text primary key,
  changed_count int not null default 0,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles anon all" on profiles;
create policy "profiles anon all" on profiles for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table profiles;
  end if;
end $$;
