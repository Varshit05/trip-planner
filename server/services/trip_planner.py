import logging
from datetime import datetime
from services.geocoding_service import GeocodingService
from services.routing_service import RoutingService
from services.route_geometry import RouteGeometryHelper
from services.hos_scheduler import HOSScheduler, CycleExceededException
from services.eld_generator import ELDGenerator

logger = logging.getLogger(__name__)

class LocationNotFoundException(Exception):
    def __init__(self, location_name: str):
        super().__init__(f"Could not find the specified location: '{location_name}'. Please enter a more specific address or city.")
        self.location_name = location_name

class RouteCalculationException(Exception):
    def __init__(self, origin: str, destination: str):
        super().__init__(f"No route could be calculated between '{origin}' and '{destination}'.")
        self.origin = origin
        self.destination = destination

class TripPlannerOrchestrator:
    @classmethod
    def plan_trip(
        cls,
        current_location: str,
        pickup_location: str,
        dropoff_location: str,
        cycle_used_hours: float,
        trip_start_iso: str,
        driving_since_break_hours: float = 0.0,
        duty_window_used_hours: float = 0.0
    ):
        """
        Orchestrates geocoding, routing, HOS scheduling, and ELD log generation.
        Returns a structured dictionary with all plan details.
        """
        # 1. Geocode locations
        current_geo = GeocodingService.geocode(current_location)
        if not current_geo:
            raise LocationNotFoundException(current_location)

        pickup_geo = GeocodingService.geocode(pickup_location)
        if not pickup_geo:
            raise LocationNotFoundException(pickup_location)

        dropoff_geo = GeocodingService.geocode(dropoff_location)
        if not dropoff_geo:
            raise LocationNotFoundException(dropoff_location)

        # 2. Calculate Leg 1 (Current -> Pickup)
        leg1 = RoutingService.calculate_route(
            current_geo["latitude"], current_geo["longitude"],
            pickup_geo["latitude"], pickup_geo["longitude"]
        )
        if not leg1:
            raise RouteCalculationException(current_location, pickup_location)

        # 3. Calculate Leg 2 (Pickup -> Dropoff)
        leg2 = RoutingService.calculate_route(
            pickup_geo["latitude"], pickup_geo["longitude"],
            dropoff_geo["latitude"], dropoff_geo["longitude"]
        )
        if not leg2:
            raise RouteCalculationException(pickup_location, dropoff_location)

        # 4. Combine Route Geometry
        # Remove duplicate point at the junction (last point of leg1 is same as first point of leg2)
        leg1_geom = leg1["geometry"]
        leg2_geom = leg2["geometry"]
        combined_geom = leg1_geom + (leg2_geom[1:] if leg2_geom else [])

        total_distance = leg1["distance_miles"] + leg2["distance_miles"]
        combined_cum_distances = RouteGeometryHelper.calculate_cumulative_distances(combined_geom, total_distance)

        # 5. Run HOS scheduling
        events, end_hos_state = HOSScheduler.schedule_trip(
            leg1_distance=leg1["distance_miles"],
            leg1_duration=leg1["duration_hours"],
            leg2_distance=leg2["distance_miles"],
            leg2_duration=leg2["duration_hours"],
            geometry=combined_geom,
            cum_distances=combined_cum_distances,
            cycle_used_hours=cycle_used_hours,
            trip_start_iso=trip_start_iso,
            driving_since_break_hours=driving_since_break_hours,
            duty_window_used_hours=duty_window_used_hours
        )

        # 6. Generate ELD Logs
        daily_logs = ELDGenerator.generate_daily_logs(events, trip_start_iso)

        # 7. Formulate summary stats and stops list
        fuel_stops_count = sum(1 for e in events if e["type"] in ["FUEL", "FUEL_BREAK"])
        rest_stops_count = sum(1 for e in events if e["type"] == "REST")
        break_stops_count = sum(1 for e in events if e["type"] in ["BREAK", "FUEL_BREAK"])

        # Stop markers for frontend (filter out DRIVING and REST)
        # Pickup and Dropoff should be prominent, rest stops should also be markers
        stops = []
        # Add Current Location Marker
        stops.append({
            "type": "CURRENT",
            "latitude": current_geo["latitude"],
            "longitude": current_geo["longitude"],
            "display_name": current_geo["display_name"],
            "time": trip_start_iso,
            "duration_hours": 0.0,
            "reason": "Start location"
        })

        for evt in events:
            if evt["type"] != "DRIVING":
                stops.append({
                    "type": evt["type"],
                    "latitude": evt["latitude"],
                    "longitude": evt["longitude"],
                    "time": evt["start_time"],
                    "duration_hours": evt["duration_hours"],
                    "reason": evt["reason"] or evt["type"].capitalize()
                })

        # Calculate trip duration
        start_dt = datetime.fromisoformat(events[0]["start_time"])
        end_dt = datetime.fromisoformat(events[-1]["end_time"])
        trip_duration_hours = (end_dt - start_dt).total_seconds() / 3600.0

        plan_summary = {
            "total_distance_miles": round(total_distance, 2),
            "total_driving_hours": round(leg1["duration_hours"] + leg2["duration_hours"], 2),
            "total_duration_hours": round(trip_duration_hours, 2),
            "fuel_stops_count": fuel_stops_count,
            "rest_stops_count": rest_stops_count,
            "break_stops_count": break_stops_count,
            "cycle_remaining_hours": round(HOSScheduler.HOS_CONFIG["cycle_limit_hours"] - end_hos_state["cycle_used"], 2)
        }

        # Combine steps for display (keep leg separation clear if needed)
        combined_steps = []
        for s in leg1["steps"]:
            combined_steps.append({**s, "leg": "Leg 1 (Current to Pickup)"})
        for s in leg2["steps"]:
            combined_steps.append({**s, "leg": "Leg 2 (Pickup to Dropoff)"})

        return {
            "summary": plan_summary,
            "route": {
                "geometry": combined_geom,
                "steps": combined_steps,
                "leg1_distance_miles": leg1["distance_miles"],
                "leg2_distance_miles": leg2["distance_miles"]
            },
            "stops": stops,
            "events": events,
            "daily_logs": daily_logs,
            "hos_summary": {
                "driving_today": end_hos_state["driving_today"],
                "duty_window_used": end_hos_state["duty_window_used"],
                "cycle_used": end_hos_state["cycle_used"],
                "driving_since_break": end_hos_state["driving_since_break"]
            }
        }
