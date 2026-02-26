export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface NotificationRow {
  id: string;
  channel: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  scope_id: string;
  created_at: string;
}
