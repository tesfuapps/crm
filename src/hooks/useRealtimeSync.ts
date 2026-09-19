import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeSync(onRefresh: (table: string) => void) {
  useEffect(() => {
    const channel = supabase
      .channel('ttm-workspace-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communications' }, () => onRefresh('communications'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => onRefresh('purchases'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => onRefresh('customers'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_notifications' }, () => onRefresh('app_notifications'))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);
}
