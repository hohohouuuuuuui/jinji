-- 진지 (Jinji) — migration 5: 모더레이션 2차/3차, 이의제기, 생각이 바뀜 상대 검증,
-- 스틸맨 · 브리핑완독 · 끝까지들음 실데이터화
-- Run this in the Supabase SQL Editor. Safe to run on a fresh database too.

alter table rooms add column if not exists violations_a smallint not null default 0;
alter table rooms add column if not exists violations_b smallint not null default 0;
alter table rooms add column if not exists muted_until_a timestamptz;
alter table rooms add column if not exists muted_until_b timestamptz;
alter table rooms add column if not exists dispute_used_a boolean not null default false;
alter table rooms add column if not exists dispute_used_b boolean not null default false;

alter table messages add column if not exists kind text not null default 'chat';
alter table messages add column if not exists disputed boolean not null default false;

alter table profiles add column if not exists listened_count int not null default 0;
alter table profiles add column if not exists briefed_count int not null default 0;
alter table profiles add column if not exists stillman_count int not null default 0;
