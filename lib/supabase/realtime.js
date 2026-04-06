/**
 * Supabase real-time subscription helpers.
 * Used to sync data across devices in real-time.
 */
import { getSupabase } from './client.js';

/**
 * Subscribe to changes on a table, filtered by a column value.
 * Returns an unsubscribe function.
 */
export function subscribeToTable(table, filterColumn, filterValue, onChange) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`${table}-${filterValue}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: filterColumn ? `${filterColumn}=eq.${filterValue}` : undefined,
      },
      (payload) => {
        onChange(payload.eventType, payload.new, payload.old);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to new messages in a conversation.
 */
export function subscribeToMessages(conversationId, onNewMessage) {
  return subscribeToTable('messages', 'conversation_id', conversationId, (event, newRow) => {
    if (event === 'INSERT') {
      onNewMessage({
        role: newRow.role,
        content: newRow.content,
        model: newRow.model,
        routedTo: newRow.routed_to,
        bucket: newRow.bucket,
        usedModels: newRow.used_models,
        usage: newRow.usage,
        responses: newRow.responses,
      });
    }
  });
}

/**
 * Subscribe to task changes.
 */
export function subscribeToTasks(onTaskChange) {
  return subscribeToTable('tasks', null, null, (event, newRow, oldRow) => {
    onTaskChange(event, newRow, oldRow);
  });
}
