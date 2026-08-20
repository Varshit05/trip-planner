from datetime import datetime, timedelta, time
import logging

logger = logging.getLogger(__name__)

class ELDGenerator:
    STATUS_MAP = {
        "OFF_DUTY": "OFF DUTY",
        "SLEEPER": "SLEEPER BERTH",
        "DRIVING": "DRIVING",
        "ON_DUTY": "ON DUTY"
    }

    # Internal status codes for the 1440-minute array
    CODE_OFF_DUTY = 0
    CODE_SLEEPER = 1
    CODE_DRIVING = 2
    CODE_ON_DUTY = 3

    CODE_TO_STATUS = {
        CODE_OFF_DUTY: "OFF DUTY",
        CODE_SLEEPER: "SLEEPER BERTH",
        CODE_DRIVING: "DRIVING",
        CODE_ON_DUTY: "ON DUTY"
    }

    @classmethod
    def generate_daily_logs(cls, events: list, trip_start_iso: str):
        """
        Processes TripEvents and converts them into DailyLog objects (one for each calendar day).
        Each DailyLog represents a continuous 24-hour period (1440 minutes).
        """
        if not events:
            return []

        # Parse trip start time
        start_time = datetime.fromisoformat(trip_start_iso.replace("Z", ""))
        
        # Expand combined events (e.g., FUEL_BREAK)
        expanded_events = []
        for evt in events:
            if evt["type"] == "FUEL_BREAK":
                # Split FUEL_BREAK (1.0 hr) into:
                # 1. FUEL (0.5 hr, ON_DUTY)
                # 2. BREAK (0.5 hr, OFF_DUTY)
                t_mid = datetime.fromisoformat(evt["start_time"]) + timedelta(minutes=30)
                expanded_events.append({
                    "type": "FUEL",
                    "start_time": evt["start_time"],
                    "end_time": t_mid.isoformat(),
                    "duration_hours": 0.5,
                    "start_distance_miles": evt["start_distance_miles"],
                    "end_distance_miles": evt["start_distance_miles"], # FUEL is at a stop
                })
                expanded_events.append({
                    "type": "BREAK",
                    "start_time": t_mid.isoformat(),
                    "end_time": evt["end_time"],
                    "duration_hours": 0.5,
                    "start_distance_miles": evt["start_distance_miles"],
                    "end_distance_miles": evt["start_distance_miles"],
                })
            else:
                expanded_events.append(evt)

        # Find the start and end dates of the trip
        first_event_start = datetime.fromisoformat(expanded_events[0]["start_time"])
        last_event_end = datetime.fromisoformat(expanded_events[-1]["end_time"])

        start_date = min(start_time.date(), first_event_start.date())
        end_date = last_event_end.date()

        # Generate the list of dates
        trip_dates = []
        curr_date = start_date
        while curr_date <= end_date:
            trip_dates.append(curr_date)
            curr_date += timedelta(days=1)

        daily_logs = []

        # Process each day
        for d in trip_dates:
            day_start = datetime.combine(d, time.min)
            day_end = datetime.combine(d, time.max)

            # Initialize 1440 minutes to OFF DUTY
            minute_array = [cls.CODE_OFF_DUTY] * 1440
            day_miles = 0.0

            for evt in expanded_events:
                evt_start = datetime.fromisoformat(evt["start_time"])
                evt_end = datetime.fromisoformat(evt["end_time"])

                # Calculate overlap between event and current day
                overlap_start = max(day_start, evt_start)
                overlap_end = min(day_end, evt_end)

                if overlap_start < overlap_end:
                    # Calculate minutes from midnight
                    start_minute = int((overlap_start - day_start).total_seconds() / 60.0)
                    end_minute = int((overlap_end - day_start).total_seconds() / 60.0)
                    
                    # Ensure range is within [0, 1440]
                    start_minute = max(0, min(1439, start_minute))
                    end_minute = max(0, min(1440, end_minute))

                    # Map event type to ELD status code
                    status_code = cls.CODE_OFF_DUTY
                    if evt["type"] == "DRIVING":
                        status_code = cls.CODE_DRIVING
                        # Calculate miles proportionally
                        evt_total_seconds = (evt_end - evt_start).total_seconds()
                        if evt_total_seconds > 0:
                            overlap_seconds = (overlap_end - overlap_start).total_seconds()
                            total_miles = evt["end_distance_miles"] - evt["start_distance_miles"]
                            day_miles += total_miles * (overlap_seconds / evt_total_seconds)
                    elif evt["type"] == "REST":
                        status_code = cls.CODE_SLEEPER
                    elif evt["type"] == "BREAK":
                        status_code = cls.CODE_OFF_DUTY
                    elif evt["type"] in ["FUEL", "PICKUP", "DROPOFF"]:
                        status_code = cls.CODE_ON_DUTY

                    # Fill the minute array
                    for m in range(start_minute, end_minute):
                        minute_array[m] = status_code

            # Compress minute array into segments
            segments = []
            if len(minute_array) > 0:
                current_code = minute_array[0]
                current_start = 0
                
                for m in range(1, 1440):
                    if minute_array[m] != current_code:
                        segments.append({
                            "status": cls.CODE_TO_STATUS[current_code],
                            "start_minutes": current_start,
                            "end_minutes": m,
                            "duration_hours": round((m - current_start) / 60.0, 2)
                        })
                        current_code = minute_array[m]
                        current_start = m
                
                # Append last segment
                segments.append({
                    "status": cls.CODE_TO_STATUS[current_code],
                    "start_minutes": current_start,
                    "end_minutes": 1440,
                    "duration_hours": round((1440 - current_start) / 60.0, 2)
                })

            # Calculate total hours for each category
            off_duty_hours = sum(s["duration_hours"] for s in segments if s["status"] == "OFF DUTY")
            sleeper_hours = sum(s["duration_hours"] for s in segments if s["status"] == "SLEEPER BERTH")
            driving_hours = sum(s["duration_hours"] for s in segments if s["status"] == "DRIVING")
            on_duty_hours = sum(s["duration_hours"] for s in segments if s["status"] == "ON DUTY")

            daily_logs.append({
                "date": d.isoformat(),
                "total_miles": round(day_miles, 2),
                "driving_hours": round(driving_hours, 2),
                "on_duty_hours": round(on_duty_hours, 2),
                "sleeper_hours": round(sleeper_hours, 2),
                "off_duty_hours": round(off_duty_hours, 2),
                "segments": segments
            })

        return daily_logs
