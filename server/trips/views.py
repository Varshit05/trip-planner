from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

from trips.serializers import TripPlanRequestSerializer
from services.trip_planner import TripPlannerOrchestrator, LocationNotFoundException, RouteCalculationException
from services.hos_scheduler import CycleExceededException

logger = logging.getLogger(__name__)

class TripPlanView(APIView):
    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        try:
            plan = TripPlannerOrchestrator.plan_trip(
                current_location=validated_data["current_location"],
                pickup_location=validated_data["pickup_location"],
                dropoff_location=validated_data["dropoff_location"],
                cycle_used_hours=validated_data["cycle_used_hours"],
                trip_start_iso=validated_data["trip_start"],
                driving_since_break_hours=validated_data["driving_since_break_hours"],
                duty_window_used_hours=validated_data["duty_window_used_hours"]
            )
            return Response(plan, status=status.HTTP_200_OK)

        except LocationNotFoundException as e:
            return Response({
                "error_type": "LOCATION_NOT_FOUND",
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        except RouteCalculationException as e:
            return Response({
                "error_type": "ROUTE_NOT_FOUND",
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        except CycleExceededException as e:
            return Response({
                "error_type": "CYCLE_EXCEEDED",
                "error": f"This trip cannot be completed within the driver's remaining cycle hours. Cycle remaining: {e.cycle_remaining_hours} hours. Estimated additional on-duty time needed: {e.required_additional_hours} hours.",
                "cycle_remaining_hours": e.cycle_remaining_hours,
                "required_additional_hours": e.required_additional_hours
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("Unexpected error in TripPlanView:")
            return Response({
                "error_type": "SERVER_ERROR",
                "error": "An unexpected error occurred while planning the trip. Please try again."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
