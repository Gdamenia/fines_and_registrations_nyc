// Points at the existing Node/Express backend (../plate-lookup). That server has to be
// running and reachable from your phone — on the same Wi-Fi, your computer's LAN IP works
// (found via `ipconfig` on Windows / `ifconfig` on Mac-Linux). localhost here would mean
// "the phone itself", which has no server on it, so it must be a real network address.
//
// Android emulator only: 10.0.2.2 is a special alias that maps to the host machine's
// localhost, so that also works there without needing the LAN IP.
export const API_BASE_URL = 'http://192.168.0.28:3001';

export interface Violation {
  plate: string;
  state: string;
  license_type: string;
  summons_number: string;
  issue_date: string;
  violation_time?: string;
  violation: string;
  fine_amount: string;
  penalty_amount: string;
  interest_amount: string;
  reduction_amount: string;
  payment_amount: string;
  amount_due: string;
  violation_status?: string;
  precinct?: string;
  county?: string;
  issuing_agency?: string;
}

export interface ViolationsResponse {
  plate: string;
  state: string;
  count: number;
  violations: Violation[];
}

export interface Registration {
  record_type: string;
  vin: string;
  registration_class: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  model_year: string;
  make: string;
  body_type: string;
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

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function fetchViolations(plate: string, state: string): Promise<ViolationsResponse> {
  const params = new URLSearchParams({ plate, state });
  return apiFetch(`/api/violations?${params.toString()}`);
}

export function fetchRegistration(vin: string): Promise<RegistrationResponse> {
  const params = new URLSearchParams({ vin });
  return apiFetch(`/api/registration?${params.toString()}`);
}
