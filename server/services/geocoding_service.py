import requests
import logging
import time

logger = logging.getLogger(__name__)

class GeocodingService:
    _cache = {}

    @classmethod
    def geocode(cls, address: str):
        """
        Geocodes an address string to (latitude, longitude) using Nominatim.
        Returns a dictionary with lat, lon, and display_name, or None if not found.
        """
        address_clean = address.strip()
        if not address_clean:
            return None

        # Check in-memory cache
        if address_clean in cls._cache:
            logger.info(f"Geocoding cache hit for: {address_clean}")
            return cls._cache[address_clean]

        url = "https://nominatim.openstreetmap.org/search"
        headers = {
            "User-Agent": "AntigravityLogisticsRouteApp/2.4 (contact-dev-user-987@gmail.com)"
        }
        params = {
            "q": address_clean,
            "format": "json",
            "limit": 1
        }

        try:
            logger.info(f"Calling Nominatim geocoding for: {address_clean}")
            # Nominatim has a strict policy of max 1 request/second.
            # Sleep for 1 second to avoid getting blocked.
            time.sleep(1.0)
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if not data:
                logger.warning(f"No geocoding results for: {address_clean}")
                return None

            result = {
                "latitude": float(data[0]["lat"]),
                "longitude": float(data[0]["lon"]),
                "display_name": data[0]["display_name"]
            }

            # Cache the result
            cls._cache[address_clean] = result
            return result

        except Exception as e:
            logger.error(f"Geocoding service error for {address_clean}: {e}")
            return None
