import requests
import logging
import time

logger = logging.getLogger(__name__)

class GeocodingService:
    _cache = {}

    # Predefined fallback locations to prevent Nominatim rate-limiting or cloud hosting IP blocks (e.g. on Render/AWS)
    FALLBACK_LOCATIONS = {
        "chicago,il": {"latitude": 41.8781, "longitude": -87.6298, "display_name": "Chicago, Illinois, USA"},
        "chicago": {"latitude": 41.8781, "longitude": -87.6298, "display_name": "Chicago, Illinois, USA"},
        "dallas,tx": {"latitude": 32.7767, "longitude": -96.7970, "display_name": "Dallas, Texas, USA"},
        "dallas": {"latitude": 32.7767, "longitude": -96.7970, "display_name": "Dallas, Texas, USA"},
        "phoenix,az": {"latitude": 33.4484, "longitude": -112.0740, "display_name": "Phoenix, Arizona, USA"},
        "phoenix": {"latitude": 33.4484, "longitude": -112.0740, "display_name": "Phoenix, Arizona, USA"},
        "newyork,ny": {"latitude": 40.7128, "longitude": -74.0060, "display_name": "New York City, New York, USA"},
        "newyorkcity": {"latitude": 40.7128, "longitude": -74.0060, "display_name": "New York City, New York, USA"},
        "newyork": {"latitude": 40.7128, "longitude": -74.0060, "display_name": "New York City, New York, USA"},
        "losangeles,ca": {"latitude": 34.0522, "longitude": -118.2437, "display_name": "Los Angeles, California, USA"},
        "losangeles": {"latitude": 34.0522, "longitude": -118.2437, "display_name": "Los Angeles, California, USA"},
        "sanfrancisco,ca": {"latitude": 37.7749, "longitude": -122.4194, "display_name": "San Francisco, California, USA"},
        "sanfrancisco": {"latitude": 37.7749, "longitude": -122.4194, "display_name": "San Francisco, California, USA"},
        "houston,tx": {"latitude": 29.7604, "longitude": -95.3698, "display_name": "Houston, Texas, USA"},
        "houston": {"latitude": 29.7604, "longitude": -95.3698, "display_name": "Houston, Texas, USA"},
        "miami,fl": {"latitude": 25.7617, "longitude": -80.1918, "display_name": "Miami, Florida, USA"},
        "miami": {"latitude": 25.7617, "longitude": -80.1918, "display_name": "Miami, Florida, USA"},
        "seattle,wa": {"latitude": 47.6062, "longitude": -122.3321, "display_name": "Seattle, Washington, USA"},
        "seattle": {"latitude": 47.6062, "longitude": -122.3321, "display_name": "Seattle, Washington, USA"},
        "denver,co": {"latitude": 39.7392, "longitude": -104.9903, "display_name": "Denver, Colorado, USA"},
        "denver": {"latitude": 39.7392, "longitude": -104.9903, "display_name": "Denver, Colorado, USA"},
        "atlanta,ga": {"latitude": 33.7490, "longitude": -84.3880, "display_name": "Atlanta, Georgia, USA"},
        "atlanta": {"latitude": 33.7490, "longitude": -84.3880, "display_name": "Atlanta, Georgia, USA"},
        "boston,ma": {"latitude": 42.3601, "longitude": -71.0589, "display_name": "Boston, Massachusetts, USA"},
        "boston": {"latitude": 42.3601, "longitude": -71.0589, "display_name": "Boston, Massachusetts, USA"},
        
        # Indian cities
        "mumbai": {"latitude": 19.0760, "longitude": 72.8777, "display_name": "Mumbai, Maharashtra, India"},
        "mumbai,mh": {"latitude": 19.0760, "longitude": 72.8777, "display_name": "Mumbai, Maharashtra, India"},
        "mumbai,maharashtra": {"latitude": 19.0760, "longitude": 72.8777, "display_name": "Mumbai, Maharashtra, India"},
        
        "delhi": {"latitude": 28.7041, "longitude": 77.1025, "display_name": "Delhi, NCT, India"},
        "newdelhi": {"latitude": 28.6139, "longitude": 77.2090, "display_name": "New Delhi, Delhi, India"},
        "delhi,dl": {"latitude": 28.7041, "longitude": 77.1025, "display_name": "Delhi, NCT, India"},
        
        "bangalore": {"latitude": 12.9716, "longitude": 77.5946, "display_name": "Bengaluru, Karnataka, India"},
        "bengaluru": {"latitude": 12.9716, "longitude": 77.5946, "display_name": "Bengaluru, Karnataka, India"},
        "bangalore,ka": {"latitude": 12.9716, "longitude": 77.5946, "display_name": "Bengaluru, Karnataka, India"},
        "bengaluru,karnataka": {"latitude": 12.9716, "longitude": 77.5946, "display_name": "Bengaluru, Karnataka, India"},
        
        "hyderabad": {"latitude": 17.3850, "longitude": 78.4867, "display_name": "Hyderabad, Telangana, India"},
        "hyderabad,tg": {"latitude": 17.3850, "longitude": 78.4867, "display_name": "Hyderabad, Telangana, India"},
        "hyderabad,telangana": {"latitude": 17.3850, "longitude": 78.4867, "display_name": "Hyderabad, Telangana, India"},
        
        "ahmedabad": {"latitude": 23.0225, "longitude": 72.5714, "display_name": "Ahmedabad, Gujarat, India"},
        "ahmedabad,gj": {"latitude": 23.0225, "longitude": 72.5714, "display_name": "Ahmedabad, Gujarat, India"},
        "ahmedabad,gujarat": {"latitude": 23.0225, "longitude": 72.5714, "display_name": "Ahmedabad, Gujarat, India"},
        
        "chennai": {"latitude": 13.0827, "longitude": 80.2707, "display_name": "Chennai, Tamil Nadu, India"},
        "chennai,tn": {"latitude": 13.0827, "longitude": 80.2707, "display_name": "Chennai, Tamil Nadu, India"},
        "chennai,tamilnadu": {"latitude": 13.0827, "longitude": 80.2707, "display_name": "Chennai, Tamil Nadu, India"},
        
        "kolkata": {"latitude": 22.5726, "longitude": 88.3639, "display_name": "Kolkata, West Bengal, India"},
        "kolkata,wb": {"latitude": 22.5726, "longitude": 88.3639, "display_name": "Kolkata, West Bengal, India"},
        "kolkata,westbengal": {"latitude": 22.5726, "longitude": 88.3639, "display_name": "Kolkata, West Bengal, India"},
        
        "pune": {"latitude": 18.5204, "longitude": 73.8567, "display_name": "Pune, Maharashtra, India"},
        "pune,mh": {"latitude": 18.5204, "longitude": 73.8567, "display_name": "Pune, Maharashtra, India"},
        "pune,maharashtra": {"latitude": 18.5204, "longitude": 73.8567, "display_name": "Pune, Maharashtra, India"},
        
        "jaipur": {"latitude": 26.9124, "longitude": 75.7873, "display_name": "Jaipur, Rajasthan, India"},
        "jaipur,rj": {"latitude": 26.9124, "longitude": 75.7873, "display_name": "Jaipur, Rajasthan, India"},
        "jaipur,rajasthan": {"latitude": 26.9124, "longitude": 75.7873, "display_name": "Jaipur, Rajasthan, India"},
        
        "surat": {"latitude": 21.1702, "longitude": 72.8311, "display_name": "Surat, Gujarat, India"},
        "surat,gj": {"latitude": 21.1702, "longitude": 72.8311, "display_name": "Surat, Gujarat, India"},
        
        "lucknow": {"latitude": 26.8467, "longitude": 80.9462, "display_name": "Lucknow, Uttar Pradesh, India"},
        "lucknow,up": {"latitude": 26.8467, "longitude": 80.9462, "display_name": "Lucknow, Uttar Pradesh, India"},
        
        "kanpur": {"latitude": 26.4499, "longitude": 80.3319, "display_name": "Kanpur, Uttar Pradesh, India"},
        "kanpur,up": {"latitude": 26.4499, "longitude": 80.3319, "display_name": "Kanpur, Uttar Pradesh, India"},
        
        "nagpur": {"latitude": 21.1458, "longitude": 79.0882, "display_name": "Nagpur, Maharashtra, India"},
        "nagpur,mh": {"latitude": 21.1458, "longitude": 79.0882, "display_name": "Nagpur, Maharashtra, India"},
        
        "indore": {"latitude": 22.7196, "longitude": 75.8577, "display_name": "Indore, Madhya Pradesh, India"},
        "indore,mp": {"latitude": 22.7196, "longitude": 75.8577, "display_name": "Indore, Madhya Pradesh, India"},
        
        "bhopal": {"latitude": 23.2599, "longitude": 77.4126, "display_name": "Bhopal, Madhya Pradesh, India"},
        "bhopal,mp": {"latitude": 23.2599, "longitude": 77.4126, "display_name": "Bhopal, Madhya Pradesh, India"},
        
        "patna": {"latitude": 25.5941, "longitude": 85.1376, "display_name": "Patna, Bihar, India"},
        "patna,br": {"latitude": 25.5941, "longitude": 85.1376, "display_name": "Patna, Bihar, India"},
        
        "vadodara": {"latitude": 22.3072, "longitude": 73.1812, "display_name": "Vadodara, Gujarat, India"},
        "vadodara,gj": {"latitude": 22.3072, "longitude": 73.1812, "display_name": "Vadodara, Gujarat, India"},
        
        "ludhiana": {"latitude": 30.9010, "longitude": 75.8573, "display_name": "Ludhiana, Punjab, India"},
        "ludhiana,pb": {"latitude": 30.9010, "longitude": 75.8573, "display_name": "Ludhiana, Punjab, India"},
        
        "agra": {"latitude": 27.1767, "longitude": 78.0081, "display_name": "Agra, Uttar Pradesh, India"},
        "agra,up": {"latitude": 27.1767, "longitude": 78.0081, "display_name": "Agra, Uttar Pradesh, India"},
        
        "nashik": {"latitude": 19.9975, "longitude": 73.7898, "display_name": "Nashik, Maharashtra, India"},
        "nashik,mh": {"latitude": 19.9975, "longitude": 73.7898, "display_name": "Nashik, Maharashtra, India"},
        
        "varanasi": {"latitude": 25.3176, "longitude": 82.9739, "display_name": "Varanasi, Uttar Pradesh, India"},
        "varanasi,up": {"latitude": 25.3176, "longitude": 82.9739, "display_name": "Varanasi, Uttar Pradesh, India"},
        
        "chandigarh": {"latitude": 30.7333, "longitude": 76.7794, "display_name": "Chandigarh, India"},
        "chandigarh,ch": {"latitude": 30.7333, "longitude": 76.7794, "display_name": "Chandigarh, India"},
        
        "kochi": {"latitude": 9.9312, "longitude": 76.2673, "display_name": "Kochi, Kerala, India"},
        "kochi,kl": {"latitude": 9.9312, "longitude": 76.2673, "display_name": "Kochi, Kerala, India"},
        
        "noida": {"latitude": 28.5355, "longitude": 77.3910, "display_name": "Noida, Uttar Pradesh, India"},
        "noida,up": {"latitude": 28.5355, "longitude": 77.3910, "display_name": "Noida, Uttar Pradesh, India"},
        
        "gurgaon": {"latitude": 28.4595, "longitude": 77.0266, "display_name": "Gurugram, Haryana, India"},
        "gurugram": {"latitude": 28.4595, "longitude": 77.0266, "display_name": "Gurugram, Haryana, India"},
        "gurugram,hr": {"latitude": 28.4595, "longitude": 77.0266, "display_name": "Gurugram, Haryana, India"},
    }

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

        # Check local fallback locations
        normalized_key = address_clean.lower().replace(" ", "").replace(",,", ",")
        if normalized_key in cls.FALLBACK_LOCATIONS:
            logger.info(f"Geocoding fallback match hit for: {address_clean}")
            # Cache the match and return
            cls._cache[address_clean] = cls.FALLBACK_LOCATIONS[normalized_key]
            return cls.FALLBACK_LOCATIONS[normalized_key]

        url = "https://nominatim.openstreetmap.org/search"
        headers = {
            "User-Agent": "LogiRouteLogisticsApp/2.4 (contact-dev-user-987@gmail.com)"
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
