import requests
import logging

logger = logging.getLogger(__name__)

class RoutingService:
    METERS_TO_MILES = 0.000621371
    SECONDS_TO_HOURS = 1.0 / 3600.0

    @classmethod
    def calculate_route(cls, origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float):
        """
        Calculates a driving route between origin and destination using the public OSRM API.
        Returns a dict with distance_miles, duration_hours, geometry (list of [lat, lon]), and steps (instructions).
        Returns None if route calculation fails.
        """
        # Format coordinates: lon,lat;lon,lat
        coords_str = f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
        url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "steps": "true"
        }

        try:
            logger.info(f"Calling OSRM route for coords: {coords_str}")
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()

            if "routes" not in data or not data["routes"]:
                logger.warning(f"No routes found in OSRM response for: {coords_str}")
                return None

            route = data["routes"][0]
            distance_meters = route.get("distance", 0.0)
            duration_seconds = route.get("duration", 0.0)

            distance_miles = distance_meters * cls.METERS_TO_MILES
            duration_hours = duration_seconds * cls.SECONDS_TO_HOURS

            # GeoJSON coordinates are [longitude, latitude] -> convert to [latitude, longitude] for React Leaflet
            geojson_coords = route.get("geometry", {}).get("coordinates", [])
            geometry = [[pt[1], pt[0]] for pt in geojson_coords]

            # Extract turn-by-turn steps
            steps = []
            legs = route.get("legs", [])
            for leg in legs:
                for step in leg.get("steps", []):
                    name = step.get("name", "")
                    modifier = step.get("maneuver", {}).get("modifier", "")
                    m_type = step.get("maneuver", {}).get("type", "")
                    step_distance_miles = step.get("distance", 0.0) * cls.METERS_TO_MILES
                    
                    # Generate a clean text instruction
                    instruction = step.get("maneuver", {}).get("instruction", "")
                    if not instruction:
                        if m_type == "depart":
                            instruction = f"Depart on {name or 'unnamed road'}"
                        elif m_type == "arrive":
                            instruction = f"Arrive at destination"
                        else:
                            instruction = f"{m_type.capitalize()} {modifier} onto {name or 'unnamed road'}"
                    
                    steps.append({
                        "instruction": instruction,
                        "distance_miles": round(step_distance_miles, 2),
                        "duration_hours": round(step.get("duration", 0.0) * cls.SECONDS_TO_HOURS, 2)
                    })

            return {
                "distance_miles": round(distance_miles, 2),
                "duration_hours": round(duration_hours, 2),
                "geometry": geometry,
                "steps": steps
            }

        except Exception as e:
            logger.error(f"Routing service error for {coords_str}: {e}")
            return None
