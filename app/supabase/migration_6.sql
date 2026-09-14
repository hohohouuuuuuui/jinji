-- 진지 (Jinji) — migration 6: 사용자 방 생성 · 방장 · 규칙 설정
-- Run this in the Supabase SQL Editor. Safe to run on a fresh database too.

alter table rooms add column if not exists host_nickname text;
alter table rooms add column if not exists is_custom boolean not null default false;
alter table rooms add column if not exists allow_profanity boolean not null default false;
alter table rooms add column if not exists duration_minutes smallint not null default 20;
alter table rooms add column if not exists hand_limit smallint not null default 2;
