import { useEffect, useState } from 'react';
import { supabase } from './supabase';

type CountMap = Record<string, number>;

// Live, shared count of how many seats are currently taken per topic —
// 1 for a room still waiting for an opponent, 2 for an active pair.
// Backed by the same `rooms` table everyone matches through, so every
// visitor's schedule reflects everyone else's applications in real time.
export function useTopicSeatCounts(topicIds: string[]): CountMap {
  const [counts, setCounts] = useState<CountMap>({});
  const key = topicIds.join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const ids = key.split(',');
    const idSet = new Set(ids);

    async function load() {
      const { data } = await supabase.from('rooms').select('topic_id, status').in('topic_id', ids).in('status', ['waiting', 'active']);
      if (cancelled) return;
      const next: CountMap = {};
      for (const row of (data as { topic_id: string; status: string }[]) ?? []) {
        next[row.topic_id] = (next[row.topic_id] ?? 0) + (row.status === 'active' ? 2 : 1);
      }
      setCounts(next);
    }

    load();

    const channel = supabase
      .channel(`schedule-seat-counts:${key}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
        const changed = (payload.new ?? payload.old) as { topic_id?: string } | null;
        if (changed?.topic_id && idSet.has(changed.topic_id)) load();
      })
      .subscribe();

    // realtime을 놓쳐도 주기적으로/탭에 돌아올 때 다시 맞춰준다.
    const pollTimer = setInterval(load, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisible);
      channel.unsubscribe();
    };
  }, [key]);

  return counts;
}
