-- 진지 (Jinji) — migration 3: AI 스파링의 AI 자기-모더레이션 (3진 아웃)
-- Run this in the Supabase SQL Editor. Safe to run on a fresh database too.

alter table rooms add column if not exists ai_strikes smallint not null default 0;
