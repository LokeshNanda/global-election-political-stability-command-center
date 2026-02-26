const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchCountries(): Promise<import('@/app/types').CountryWithPSI[]> {
  const res = await fetch(`${API_BASE}/countries`);
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}

export async function fetchCountry(id: number): Promise<import('@/app/types').CountryDetail> {
  const res = await fetch(`${API_BASE}/country/${id}`);
  if (!res.ok) throw new Error('Failed to fetch country');
  return res.json();
}

export async function fetchLeaderboard(): Promise<import('@/app/types').LeaderboardEntry[]> {
  const res = await fetch(`${API_BASE}/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export interface UpcomingElection {
  country_id: number;
  country_name: string;
  iso_code: string;
  days_remaining: number;
  type: string;
  psi_score: number;
  risk_level: string;
}

export async function fetchUpcomingElections(): Promise<UpcomingElection[]> {
  const res = await fetch(`${API_BASE}/elections/upcoming`);
  if (!res.ok) return [];
  return res.json();
}

export function getWebSocketUrl(): string {
  const base = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  return `${base}/live`;
}

export interface TimelineEntry {
  date: string;
  country_id: number;
  psi_score: number;
  risk_level: string;
}

export async function fetchTimeline(days: number = 30): Promise<TimelineEntry[]> {
  const res = await fetch(`${API_BASE}/timeline?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export interface Alert {
  id: number;
  country_id: number;
  psi_threshold: number;
  created_at: string;
}

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function createAlert(country_id: number, psi_threshold: number): Promise<Alert> {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country_id, psi_threshold }),
  });
  if (!res.ok) throw new Error('Failed to create alert');
  return res.json();
}

export async function deleteAlert(alertId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete alert');
}
