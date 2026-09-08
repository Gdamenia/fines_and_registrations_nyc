import { CarDetailResponse, CarSummary, NotificationEvent, Session, Violation } from './api';

export const DEMO_SESSION: Session = {
  token: 'demo',
  demo: true,
  user: { id: 0, email: 'john.driver@example.com', full_name: 'John Driver' },
};

export const DEMO_CARS: CarSummary[] = [
  {
    id: 101,
    nickname: 'My Tesla',
    plate: 'KZP-7314',
    state: 'NY',
    vin: '5YJ3E1EA7NF324518',
    violation_count: 1,
    total_amount_due: 50,
    has_registration: true,
  },
  {
    id: 102,
    nickname: 'Family SUV',
    plate: 'LFM-2901',
    state: 'NY',
    vin: '2HKRW2H80MH612345',
    violation_count: 0,
    total_amount_due: 0,
    has_registration: true,
  },
  {
    id: 103,
    nickname: 'BMW 330i',
    plate: 'HXT-8840',
    state: 'NY',
    vin: 'WBA5R1C08LFH88990',
    violation_count: 2,
    total_amount_due: 125,
    has_registration: true,
  },
];

const v1: Violation = {
  plate: 'KZP-7314', state: 'NY', summons_number: '4387956201', issue_date: '04/22/2026',
  violation_time: '10:42A', violation: 'Parking Violation', fine_amount: '50.00', amount_due: '50.00',
  penalty_amount: '0.00', interest_amount: '0.00', reduction_amount: '0.00', payment_amount: '0.00',
  issuing_agency: 'NYC Department of Finance', street_name: 'E 14th St', house_number: '3rd Ave',
};
const v2: Violation = {
  plate: 'HXT-8840', state: 'NY', summons_number: '4387269103', issue_date: '03/10/2026',
  violation: 'Bus Lane Violation', fine_amount: '75.00', amount_due: '75.00', penalty_amount: '0.00',
  interest_amount: '0.00', reduction_amount: '0.00', payment_amount: '0.00', issuing_agency: 'NYC Department of Finance',
  street_name: '2nd Ave', house_number: 'E 42nd St',
};
const v3: Violation = {
  plate: 'HXT-8840', state: 'NY', summons_number: '4378812345', issue_date: '01/05/2026',
  violation: 'Speed Camera', fine_amount: '50.00', amount_due: '50.00', penalty_amount: '0.00',
  interest_amount: '0.00', reduction_amount: '0.00', payment_amount: '0.00', issuing_agency: 'NYC Department of Finance',
  street_name: 'FDR Drive', house_number: '',
};

export const DEMO_DETAILS: Record<number, CarDetailResponse> = {
  101: {
    car: DEMO_CARS[0],
    violations: [{ id: 1, car_id: 101, summons_number: v1.summons_number, amount_due: 50, issue_date: v1.issue_date, violation: v1.violation, data: v1 }],
    registration: {
      data: {
        vin: '5YJ3E1EA7NF324518', model_year: '2022', make: 'Tesla', body_type: '4DSD', color: 'WHITE',
        registration_class: 'PAS', city: 'NEW YORK', state: 'NY', zip: '10003', county: 'NEW YORK',
        reg_valid_date: '2025-01-15T00:00:00.000', reg_expiration_date: '2027-01-15T00:00:00.000',
      },
    },
  },
  102: {
    car: DEMO_CARS[1],
    violations: [],
    registration: {
      data: {
        vin: '2HKRW2H80MH612345', model_year: '2020', make: 'Honda', body_type: 'SUBN', color: 'BLACK',
        registration_class: 'PAS', city: 'BROOKLYN', state: 'NY', zip: '11201', county: 'KINGS',
        reg_valid_date: '2025-06-03T00:00:00.000', reg_expiration_date: '2027-06-03T00:00:00.000',
      },
    },
  },
  103: {
    car: DEMO_CARS[2],
    violations: [
      { id: 2, car_id: 103, summons_number: v2.summons_number, amount_due: 75, issue_date: v2.issue_date, violation: v2.violation, data: v2 },
      { id: 3, car_id: 103, summons_number: v3.summons_number, amount_due: 50, issue_date: v3.issue_date, violation: v3.violation, data: v3 },
    ],
    registration: {
      data: {
        vin: 'WBA5R1C08LFH88990', model_year: '2018', make: 'BMW', body_type: '4DSD', color: 'BLACK',
        registration_class: 'PAS', city: 'QUEENS', state: 'NY', zip: '11101', county: 'QUEENS',
        reg_valid_date: '2025-10-02T00:00:00.000', reg_expiration_date: '2026-10-02T00:00:00.000',
      },
    },
  },
};

export const DEMO_NOTIFICATIONS: NotificationEvent[] = [
  {
    id: 1, created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), car_id: 101, nickname: 'My Tesla',
    plate: 'KZP-7314', state: 'NY', violation_id: 1, summons_number: v1.summons_number,
    violation: 'New parking violation', amount_due: 50, issue_date: v1.issue_date,
  },
  {
    id: 2, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), car_id: 103, nickname: 'BMW 330i',
    plate: 'HXT-8840', state: 'NY', violation_id: 2, summons_number: v2.summons_number,
    violation: 'Payment reminder', amount_due: 125, issue_date: v2.issue_date,
  },
];

export const DEMO_LOOKUP = [v1, v2];
