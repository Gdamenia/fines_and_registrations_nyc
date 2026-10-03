import type { Lang } from './i18n';

// Tixradar API client.
// For local development set EXPO_PUBLIC_API_BASE_URL to your Mac/PC LAN URL, for example:
// EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:3001 npx expo start
// For App Store/TestFlight builds point this at the production HTTPS API.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://192.168.0.28:3001';

export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  /** The account's saved app language; null if it was never chosen. */
  language?: Lang | null;
}

export interface Session {
  user: User;
  token: string;
  demo?: boolean;
}

export interface Violation {
  plate: string;
  state: string;
  license_type?: string;
  summons_number: string;
  issue_date: string;
  violation_time?: string;
  violation: string;
  fine_amount?: string;
  penalty_amount?: string;
  interest_amount?: string;
  reduction_amount?: string;
  payment_amount?: string;
  amount_due: string;
  violation_status?: string;
  precinct?: string;
  county?: string;
  issuing_agency?: string;
  street_name?: string;
  house_number?: string;
}

export interface ViolationsResponse {
  plate: string;
  state: string;
  count: number;
  violations: Violation[];
}

export interface Registration {
  record_type?: string;
  vin: string;
  registration_class?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  model_year?: string;
  make?: string;
  body_type?: string;
  fuel_type?: string;
  color?: string;
  reg_valid_date?: string;
  reg_expiration_date?: string;
  scofflaw_indicator?: string;
  suspension_indicator?: string;
  revocation_indicator?: string;
}

export interface RegistrationResponse {
  vin: string;
  count: number;
  registrations: Registration[];
}

export interface CarSummary {
  id: number;
  user_id?: number;
  nickname: string;
  plate: string;
  state: string;
  vin?: string | null;
  vehicle_icon?: string | null;
  created_at?: string;
  violation_count: number | string;
  total_amount_due: number | string;
  /** Sum of this car's unpaid balances that NYC reports as IN JUDGMENT (boot/tow threshold input). */
  judgment_debt?: number | string;
  has_registration: boolean;
}

/**
 * Penalty / deadline timeline for one fine, computed by the server (server/src/fineTimeline.js).
 * Amounts are NYC's own (source of truth); dates are derived from NYC's penalty schedule.
 */
export interface FineTimeline {
  ticket_type: 'parking' | 'camera';
  issue_date: string | null;
  days_since_issue: number | null;
  original_amount: number;
  current_amount: number;
  penalty_amount: number;
  interest_amount: number;
  unpaid: boolean;
  /** false for tickets decided at a hearing: NYC's data has no deadline for them. */
  schedule_known: boolean;
  due_date: string | null;
  days_until_due: number | null;
  next_penalty_date: string | null;
  next_penalty_amount: number | null;
  scheduled_penalty_total: number;
  last_penalty_added: number | null;
  last_penalty_date: string | null;
  final_notice_date: string | null;
  judgment_status: 'none' | 'approaching' | 'likely' | 'in_judgment';
  judgment_date: string | null;
  estimated_judgment_date: string | null;
  days_until_judgment: number | null;
  amount_in_judgment: number;
}

export interface StoredViolation {
  id: number;
  car_id: number;
  summons_number: string;
  amount_due: number | string | null;
  issue_date?: string | null;
  violation?: string | null;
  data: Violation;
  first_seen_at?: string;
  timeline?: FineTimeline;
}

export interface StoredRegistration {
  id?: number;
  car_id?: number;
  data: Registration;
  fetched_at?: string;
}

export interface CarDetailResponse {
  car: CarSummary;
  violations: StoredViolation[];
  registration: StoredRegistration | null;
}

export interface NotificationEvent {
  id: number;
  created_at: string;
  sent_at?: string | null;
  car_id: number;
  nickname: string;
  plate: string;
  state: string;
  kind?: 'new_fine' | 'weekly_reminder' | string;
  title?: string | null;
  body?: string | null;
  violation_id?: number | null;
  summons_number?: string | null;
  violation?: string | null;
  amount_due?: number | string | null;
  issue_date?: string | null;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function signup(email: string, password: string, language?: Lang): Promise<Session> {
  return apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, language }),
  });
}

export function login(email: string, password: string): Promise<Session> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}


/** Update the nickname and/or the saved language; send only what changed. */
export function updateProfile(token: string, input: { fullName?: string; language?: Lang }): Promise<{ user: User }> {
  return apiFetch('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  }, token);
}

/** The signed-in user as stored on the server (incl. their saved language). */
export function fetchMe(token: string): Promise<{ user: User }> {
  return apiFetch('/api/me', {}, token);
}

export function fetchViolations(plate: string, state: string): Promise<ViolationsResponse> {
  const params = new URLSearchParams({ plate, state });
  return apiFetch(`/api/violations?${params.toString()}`);
}

export function fetchRegistration(vin: string): Promise<RegistrationResponse> {
  const params = new URLSearchParams({ vin });
  return apiFetch(`/api/registration?${params.toString()}`);
}

export function fetchCars(token: string): Promise<{ cars: CarSummary[] }> {
  return apiFetch('/api/cars', {}, token);
}

export function fetchCarDetail(id: number, token: string): Promise<CarDetailResponse> {
  return apiFetch(`/api/cars/${id}`, {}, token);
}

export function createCar(
  token: string,
  input: { nickname: string; plate: string; state: string; vin?: string; vehicle_icon?: string },
): Promise<{ car: CarSummary; violationsFetchError?: string | null; registrationFetchError?: string | null }> {
  return apiFetch('/api/cars', { method: 'POST', body: JSON.stringify(input) }, token);
}

export function updateCar(
  id: number,
  token: string,
  input: { nickname: string; plate: string; state: string; vin?: string; vehicle_icon?: string },
): Promise<{ car: CarSummary; violationsFetchError?: string | null; registrationFetchError?: string | null }> {
  return apiFetch(`/api/cars/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, token);
}

export function deleteCar(id: number, token: string): Promise<void> {
  return apiFetch(`/api/cars/${id}`, { method: 'DELETE' }, token);
}

export function fetchNotifications(token: string): Promise<{ notifications: NotificationEvent[] }> {
  return apiFetch('/api/notifications', {}, token);
}
