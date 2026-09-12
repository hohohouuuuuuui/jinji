import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { ProfileRow } from './db-types';

interface UseProfileResult {
  changedCount: number;
  bumpChanged: () => Promise<void>;
}

export function useProfile(nickname: string | null): UseProfileResult {
  const [changedCount, setChangedCount] = useState(0);
  const changedCountRef = useRef(0);

  useEffect(() => {
    changedCountRef.current = changedCount;
  }, [changedCount]);

  useEffect(() => {
    if (!nickname) {
      setChangedCount(0);
      return;
    }

    let cancelled = false;
    supabase
      .from('profiles')
      .select('changed_count')
      .eq('nickname', nickname)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setChangedCount((data as ProfileRow | null)?.changed_count ?? 0);
      });

    const channel = supabase
      .channel(`profile:${nickname}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `nickname=eq.${nickname}` },
        (payload) => setChangedCount((payload.new as ProfileRow).changed_count),
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [nickname]);

  const bumpChanged = useCallback(async () => {
    if (!nickname) return;
    const next = changedCountRef.current + 1;
    setChangedCount(next);
    await supabase
      .from('profiles')
      .upsert({ nickname, changed_count: next, updated_at: new Date().toISOString() });
  }, [nickname]);

  return { changedCount, bumpChanged };
}
