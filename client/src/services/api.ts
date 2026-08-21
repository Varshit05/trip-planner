import axios from 'axios';
import type { TripPlanResponse } from '../types/trip';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface PlanTripParams {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  cycle_used_hours: number;
  trip_start?: string;
  driving_since_break_hours?: number;
  duty_window_used_hours?: number;
}

export const planTrip = async (params: PlanTripParams): Promise<TripPlanResponse> => {
  const response = await axios.post<TripPlanResponse>(`${API_BASE_URL}/api/trips/plan/`, params);
  return response.data;
};
