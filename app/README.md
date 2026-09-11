# 진지 — Jinji

React + Vite implementation of `project/Jinji Prototype v3.dc.html` (the movie-schedule-board redesign): 4 tabs (시간표 / 토론방 / 리허설 / 참가기록), a briefing modal, and a "생각이 바뀜" declaration modal.

Frontend-only: all data (schedule, participation log, chat replies, timers) is mocked client-side, matching the original prototype's behavior — no backend calls.

## Run

```
npm install
npm run dev
```

## Build

```
npm run build
```

## Structure

- `src/App.tsx` — app state (tab, timers, chat, toasts, modals) and screen composition
- `src/tabs/` — the four tab screens
- `src/components/` — phone frame, status bar, bottom nav, modals
- `src/icons/` — nav icons and the pixel-art caterpillar/butterfly characters
- `src/data.ts` — mock schedule, participation log, briefing content, chat replies
