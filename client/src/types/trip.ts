export interface TripSummary {
  total_distance_miles: number;
  total_driving_hours: number;
  total_duration_hours: number;
  fuel_stops_count: number;
  rest_stops_count: number;
  break_stops_count: number;
  cycle_remaining_hours: number;
}

export interface RouteStep {
  instruction: string;
  distance_miles: number;
  duration_hours: number;
  leg: string;
}

export interface Route {
  geometry: [number, number][];
  steps: RouteStep[];
  leg1_distance_miles: number;
  leg2_distance_miles: number;
}

export interface Stop {
  type: 'CURRENT' | 'PICKUP' | 'DROPOFF' | 'FUEL' | 'BREAK' | 'REST' | 'FUEL_BREAK';
  latitude: number;
  longitude: number;
  display_name?: string;
  time: string;
  duration_hours: number;
  reason: string;
}

export interface TripEvent {
  type: 'DRIVING' | 'REST' | 'BREAK' | 'FUEL' | 'PICKUP' | 'DROPOFF' | 'FUEL_BREAK';
  start_time: string;
  end_time: string;
  duration_hours: number;
  start_distance_miles: number;
  end_distance_miles: number;
  latitude: number;
  longitude: number;
  end_latitude: number;
  end_longitude: number;
  reason?: string;
}

export interface ELDSegment {
  status: 'OFF DUTY' | 'SLEEPER BERTH' | 'DRIVING' | 'ON DUTY';
  start_minutes: number;
  end_minutes: number;
  duration_hours: number;
}

export interface DailyLog {
  date: string;
  total_miles: number;
  driving_hours: number;
  on_duty_hours: number;
  sleeper_hours: number;
  off_duty_hours: number;
  segments: ELDSegment[];
}

export interface HOSSummary {
  driving_today: number;
  duty_window_used: number;
  cycle_used: number;
  driving_since_break: number;
  initial_cycle_used: number;
}

export interface TripPlanResponse {
  summary: TripSummary;
  route: Route;
  stops: Stop[];
  events: TripEvent[];
  daily_logs: DailyLog[];
  hos_summary: HOSSummary;
}
