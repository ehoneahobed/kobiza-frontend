import { apiFetch } from './api';

export interface DailyActivity {
  date: string;
  count: number;
}

export async function getMyActivity(): Promise<DailyActivity[]> {
  return apiFetch('/activity/me');
}

export async function getUserActivity(userId: string): Promise<DailyActivity[]> {
  return apiFetch(`/activity/${userId}`);
}
