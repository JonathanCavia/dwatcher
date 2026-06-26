export interface CreateSessionRequest {
  dog_id: string;
  device_battery_level: number;
}

export interface CreateSessionResponse {
  id: string;
  started_at: string;
}

export interface ListEventsQuery {
  session_id: string;
  event_type: 'bark' | 'anxiety' | 'all';
  from?: string; // ISO 8601
  to?: string;
  limit?: number;
  offset?: number;
}

export interface EventListResponse {
  events: unknown[];
  total: number;
  has_more: boolean;
}
