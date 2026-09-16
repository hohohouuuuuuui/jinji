-- 진지 (Jinji) — migration 8: rooms 테이블 REPLICA IDENTITY FULL
-- Run this in the Supabase SQL Editor. Safe to run on a fresh database too.

-- 기본값(REPLICA IDENTITY DEFAULT)은 UPDATE 이벤트의 realtime payload.old에
-- 기본키(id)만 담아 보낸다. 토론방 목록(useCustomRooms)이 "상태/방 종류/팀원"처럼
-- 목록에 실제로 영향 있는 필드가 바뀌었을 때만 다시 불러오도록 하려면, 바뀌기
-- 전 값도 같이 와야 비교할 수 있다 — 그래서 rooms는 FULL로 바꾼다.
alter table rooms replica identity full;
