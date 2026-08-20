from rest_framework import serializers
from datetime import datetime

class TripPlanRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(required=True, allow_blank=False)
    pickup_location = serializers.CharField(required=True, allow_blank=False)
    dropoff_location = serializers.CharField(required=True, allow_blank=False)
    cycle_used_hours = serializers.FloatField(required=True, min_value=0.0, max_value=70.0)
    trip_start = serializers.CharField(required=False, default="")
    driving_since_break_hours = serializers.FloatField(required=False, min_value=0.0, default=0.0)
    duty_window_used_hours = serializers.FloatField(required=False, min_value=0.0, default=0.0)

    def validate_trip_start(self, value):
        if not value:
            return datetime.now().isoformat()
        try:
            # Check if parseable
            datetime.fromisoformat(value.replace("Z", ""))
            return value
        except ValueError:
            raise serializers.ValidationError("trip_start must be in valid ISO format (e.g. YYYY-MM-DDTHH:MM:SS)")
