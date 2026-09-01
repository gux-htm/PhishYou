import { apiFetch, ApiError } from './api';

export type DBType = 'postgresql' | 'sqlite' | '';

export interface DBConfig {
  type: DBType;
  host: string;
  port: number | null;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface DBStatusResponse {
  status: 'not_configured' | 'configured';
  type: DBType | null;
  host: string | null;
  port: number | null;
  database: string | null;
  username: string | null;
  ssl: boolean;
}

export interface TestDBConnectionResponse {
  success: boolean;
  status: 'connected' | 'error' | 'not_configured';
  message?: string;
}

export function fetchDBConfig(): Promise<DBStatusResponse> {
  return apiFetch<DBStatusResponse>('/api/v1/db/config');
}

export function saveDBConfig(config: DBConfig): Promise<DBStatusResponse> {
  return apiFetch<DBStatusResponse>('/api/v1/db/config', {
    method: 'POST',
    body: config,
  });
}

export function testDBConnection(): Promise<TestDBConnectionResponse> {
  return apiFetch<TestDBConnectionResponse>('/api/v1/db/test-connection', { method: 'POST' });
}

export function getDBErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}
