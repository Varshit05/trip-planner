from datetime import datetime, timedelta
import logging
from services.route_geometry import RouteGeometryHelper

logger = logging.getLogger(__name__)

class CycleExceededException(Exception):
    def __init__(self, cycle_remaining_hours, required_additional_hours):
        super().__init__("Cycle limit exceeded")
        self.cycle_remaining_hours = cycle_remaining_hours
        self.required_additional_hours = required_additional_hours

class HOSScheduler:
    HOS_CONFIG = {
        "max_driving_hours": 11.0,
        "max_duty_window_hours": 14.0,
        "required_rest_hours": 10.0,
        "break_after_driving_hours": 8.0,
        "break_duration_hours": 0.5,
        "cycle_limit_hours": 70.0,
        "fuel_interval_miles": 1000.0,
        "fuel_duration_hours": 0.5,
        "pickup_duration_hours": 1.0,
        "dropoff_duration_hours": 1.0,
    }

    @classmethod
    def schedule_trip(
        cls,
        leg1_distance: float,
        leg1_duration: float,
        leg2_distance: float,
        leg2_duration: float,
        geometry: list,
        cum_distances: list,
        cycle_used_hours: float,
        trip_start_iso: str,
        driving_since_break_hours: float = 0.0,
        duty_window_used_hours: float = 0.0
    ):
        """
        Runs the deterministic HOS scheduling simulation.
        Returns a list of TripEvent dicts.
        Raises CycleExceededException if the cycle is exceeded.
        """
        # Parse start time
        start_time = datetime.fromisoformat(trip_start_iso.replace("Z", ""))
        
        # Calculate speeds for each leg to convert distance to time
        # Handle cases where duration is 0
        leg1_speed = leg1_distance / leg1_duration if leg1_duration > 0 else 60.0
        leg2_speed = leg2_distance / leg2_duration if leg2_duration > 0 else 60.0

        # Total distance markers
        pickup_distance = leg1_distance
        dropoff_distance = leg1_distance + leg2_distance

        # Simulation state
        current_time = start_time
        current_distance = 0.0
        
        # Drivers state trackers
        driving_since_break = driving_since_break_hours
        driving_today = driving_since_break_hours # Assume initial driving counts for today's driving
        duty_window_used = duty_window_used_hours
        duty_window_active = duty_window_used_hours > 0
        cycle_hours_used = cycle_used_hours
        miles_since_last_fuel = 0.0

        pickup_done = False
        dropoff_done = False

        events = []

        # Helper to record events
        def add_event(evt_type, duration_hours, start_dist, end_dist, reason=None):
            nonlocal current_time
            start_dt = current_time
            end_dt = current_time + timedelta(hours=duration_hours)
            
            # Interpolate coordinates
            start_coord = RouteGeometryHelper.get_point_at_distance(geometry, cum_distances, start_dist)
            end_coord = RouteGeometryHelper.get_point_at_distance(geometry, cum_distances, end_dist)
            
            events.append({
                "type": evt_type,
                "start_time": start_dt.isoformat(),
                "end_time": end_dt.isoformat(),
                "duration_hours": duration_hours,
                "start_distance_miles": round(start_dist, 2),
                "end_distance_miles": round(end_dist, 2),
                "latitude": start_coord[0] if start_coord else 0.0,
                "longitude": start_coord[1] if start_coord else 0.0,
                "end_latitude": end_coord[0] if end_coord else 0.0,
                "end_longitude": end_coord[1] if end_coord else 0.0,
                "reason": reason
            })
            current_time = end_dt

        # Helper to check if cycle is exceeded
        def check_cycle(added_hours):
            nonlocal cycle_hours_used
            remaining = cls.HOS_CONFIG["cycle_limit_hours"] - cycle_hours_used
            if remaining < added_hours:
                raise CycleExceededException(
                    cycle_remaining_hours=round(remaining, 2),
                    required_additional_hours=round(added_hours - remaining, 2)
                )
            cycle_hours_used += added_hours

        # Simulation loop
        max_safety_iterations = 200
        iteration = 0

        while (not dropoff_done) and iteration < max_safety_iterations:
            iteration += 1

            # --- Check immediate rest/break requirements before driving ---
            # 1. Shift Driving Limit (11 hrs) or Duty Window Limit (14 hrs)
            if driving_today >= cls.HOS_CONFIG["max_driving_hours"] or duty_window_used >= cls.HOS_CONFIG["max_duty_window_hours"]:
                # Must REST (10 hours off duty)
                add_event("REST", cls.HOS_CONFIG["required_rest_hours"], current_distance, current_distance, "Shift limits reached")
                # Reset trackers
                driving_since_break = 0.0
                driving_today = 0.0
                duty_window_used = 0.0
                duty_window_active = False
                continue

            # 2. 8-hour driving limit since last break
            if driving_since_break >= cls.HOS_CONFIG["break_after_driving_hours"]:
                # Must take 30-min break (off duty)
                add_event("BREAK", cls.HOS_CONFIG["break_duration_hours"], current_distance, current_distance, "8-hour driving break")
                driving_since_break = 0.0
                if duty_window_active:
                    duty_window_used += cls.HOS_CONFIG["break_duration_hours"]
                continue

            # 3. Fuel stop required
            if miles_since_last_fuel >= cls.HOS_CONFIG["fuel_interval_miles"]:
                # Fuel takes 0.5 hours (on-duty)
                # Check if we should combine FUEL + BREAK
                # If driving_since_break is close to the 8-hour limit (e.g., >= 7.0 hours), merge them
                if driving_since_break >= 7.0:
                    # Combined FUEL + BREAK (1 hour)
                    check_cycle(0.5) # only fuel is on-duty
                    add_event("FUEL_BREAK", 1.0, current_distance, current_distance, "Fuel & Break combined")
                    driving_since_break = 0.0
                    miles_since_last_fuel = 0.0
                    if not duty_window_active:
                        duty_window_active = True
                        duty_window_used = 1.0
                    else:
                        duty_window_used += 1.0
                else:
                    # Regular FUEL (30 min, on-duty)
                    check_cycle(cls.HOS_CONFIG["fuel_duration_hours"])
                    add_event("FUEL", cls.HOS_CONFIG["fuel_duration_hours"], current_distance, current_distance, "Routine fuel stop")
                    miles_since_last_fuel = 0.0
                    if not duty_window_active:
                        duty_window_active = True
                        duty_window_used = cls.HOS_CONFIG["fuel_duration_hours"]
                    else:
                        duty_window_used += cls.HOS_CONFIG["fuel_duration_hours"]
                continue

            # --- Determine next target and speed ---
            if not pickup_done:
                target_dist = pickup_distance
                speed = leg1_speed
            else:
                target_dist = dropoff_distance
                speed = leg2_speed

            # Remaining driving distance to target
            dist_to_target = target_dist - current_distance

            # If we've arrived at the target
            if dist_to_target <= 1e-4:
                if not pickup_done:
                    # Perform PICKUP (1 hour, on duty)
                    check_cycle(cls.HOS_CONFIG["pickup_duration_hours"])
                    add_event("PICKUP", cls.HOS_CONFIG["pickup_duration_hours"], current_distance, current_distance, "Load cargo")
                    pickup_done = True
                    if not duty_window_active:
                        duty_window_active = True
                        duty_window_used = cls.HOS_CONFIG["pickup_duration_hours"]
                    else:
                        duty_window_used += cls.HOS_CONFIG["pickup_duration_hours"]
                else:
                    # Perform DROPOFF (1 hour, on duty)
                    check_cycle(cls.HOS_CONFIG["dropoff_duration_hours"])
                    add_event("DROPOFF", cls.HOS_CONFIG["dropoff_duration_hours"], current_distance, current_distance, "Unload cargo")
                    dropoff_done = True
                    if not duty_window_active:
                        duty_window_active = True
                        duty_window_used = cls.HOS_CONFIG["dropoff_duration_hours"]
                    else:
                        duty_window_used += cls.HOS_CONFIG["dropoff_duration_hours"]
                continue

            # --- Calculate driving limits ---
            # Max time we want to drive to reach target
            time_to_target = dist_to_target / speed

            # HOS limits remaining
            dt_break = cls.HOS_CONFIG["break_after_driving_hours"] - driving_since_break
            dt_drive_today = cls.HOS_CONFIG["max_driving_hours"] - driving_today
            dt_duty = cls.HOS_CONFIG["max_duty_window_hours"] - duty_window_used if duty_window_active else cls.HOS_CONFIG["max_duty_window_hours"]
            
            # Work/Cycle limit remaining
            dt_cycle = cls.HOS_CONFIG["cycle_limit_hours"] - cycle_hours_used
            
            # Fuel distance limit remaining
            miles_to_fuel = cls.HOS_CONFIG["fuel_interval_miles"] - miles_since_last_fuel
            dt_fuel = miles_to_fuel / speed

            # The actual driving duration we can perform now
            dt_drive = min(time_to_target, dt_break, dt_drive_today, dt_duty, dt_cycle, dt_fuel)

            # Safety check: if dt_drive is extremely tiny or negative, force a rest/break
            if dt_drive < 1e-4:
                # Force rest or break depending on which is exhausted
                if dt_break < 1e-4:
                    driving_since_break = cls.HOS_CONFIG["break_after_driving_hours"]
                elif dt_drive_today < 1e-4 or dt_duty < 1e-4:
                    driving_today = cls.HOS_CONFIG["max_driving_hours"]
                elif dt_cycle < 1e-4:
                    raise CycleExceededException(
                        cycle_remaining_hours=round(cls.HOS_CONFIG["cycle_limit_hours"] - cycle_hours_used, 2),
                        required_additional_hours=round(time_to_target, 2)
                    )
                continue

            # Drive for dt_drive hours
            drive_dist = dt_drive * speed
            check_cycle(dt_drive) # driving is on-duty

            start_dist = current_distance
            end_dist = current_distance + drive_dist

            add_event("DRIVING", dt_drive, start_dist, end_dist)

            # Update state
            current_distance = end_dist
            driving_since_break += dt_drive
            driving_today += dt_drive
            miles_since_last_fuel += drive_dist

            if not duty_window_active:
                duty_window_active = True
                duty_window_used = dt_drive
            else:
                duty_window_used += dt_drive

        if iteration >= max_safety_iterations:
            logger.error("HOS Scheduler terminated due to safety iteration limit.")

        return events, {
            "driving_today": round(driving_today, 2),
            "duty_window_used": round(duty_window_used, 2),
            "cycle_used": round(cycle_hours_used, 2),
            "driving_since_break": round(driving_since_break, 2)
        }
