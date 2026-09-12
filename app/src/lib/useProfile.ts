import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { ProfileRow } from './db-types';

type Counter = 'changed_count' | 'listened_count' | 'briefed_count' | 'stillman_count';

async function bumpProfileCounter(nickname: string, counter: Counter, by = 1): Promise<number> {
  const { data } = await supabase.from('profiles').select(counter).eq('nickname', nickname).maybeSingle();
  const current = (data as Record<Counter, number> | null)?.[counter] ?? 0;
  const next = current + by;
  // Upsert only touches the columns given here — other counters on an
  // existing row are left untouched (PostgREST upsert semantics).
  await supabase.from('profiles').upsert({ nickname, [counter]: next, updated_at: new Date().toISOString() });
  return next;
}

/** Bump another user's "생각이 바뀜" count once their partner endorses the declaration. */
export async function endorseChangeFor(nickname: string): Promise<void> {
  await bumpProfileCounter(nickname, 'changed_count');
}

interface EmptyCounts {
  changedCount: number;
  listenedCount: number;
  briefedCount: number;
  stillmanCount: number;
}

interface UseProfileResult extends EmptyCounts {
  bumpListened: () => Promise<void>;
  bumpBriefed: () => Promise<void>;
  bumpStillman: () => Promise<void>;
}

const EMPTY: EmptyCounts = { changedCount: 0, listenedCount: 0, briefedCount: 0, stillmanCount: 0 };

export function useProfile(nickname: string | null): UseProfileResult {
  const [counts, setCounts] = useState<EmptyCounts>(EMPTY);
  const countsRef = useRef(counts);

  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);

  useEffect(() => {
    if (!nickname) {
      setCounts(EMPTY);
      return;
    }

    let cancelled = false;
    const fromRow = (row: ProfileRow | null): EmptyCounts => ({
      changedCount: row?.changed_count ?? 0,
      listenedCount: row?.listened_count ?? 0,
      briefedCount: row?.briefed_count ?? 0,
      stillmanCount: row?.stillman_count ?? 0,
    });

    supabase
      .from('profiles')
      .select('*')
      .eq('nickname', nickname)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setCounts(fromRow(data as ProfileRow | null));
      });

    const channel = supabase
      .channel(`profile:${nickname}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `nickname=eq.${nickname}` },
        (payload) => setCounts(fromRow(payload.new as ProfileRow)),
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [nickname]);

  const bump = useCallback(
    (key: keyof EmptyCounts, counter: Counter) => async () => {
      if (!nickname) return;
      setCounts((c) => ({ ...c, [key]: c[key] + 1 }));
      await bumpProfileCounter(nickname, counter);
    },
    [nickname],
  );

  return {
    ...counts,
    bumpListened: bump('listenedCount', 'listened_count'),
    bumpBriefed: bump('briefedCount', 'briefed_count'),
    bumpStillman: bump('stillmanCount', 'stillman_count'),
  };
}
