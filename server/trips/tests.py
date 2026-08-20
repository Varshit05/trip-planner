from django.test import SimpleTestCase
from datetime import datetime
from services.hos_scheduler import HOSScheduler, CycleExceededException
from services.eld_generator import ELDGenerator

class HOSSchedulerTestCase(SimpleTestCase):
    def setUp(self):
        # Create a mock geometry representing a straight line path
        # Say 20 points, each spaced by some coordinates
        self.geometry = [[40.0 + i*0.1, -80.0] for i in range(20)]
        self.cum_distances = [float(i * 10) for i in range(20)]  # total 190 miles
        self.trip_start = "2026-08-19T08:00:00"

    def test_short_trip_no_rest_no_break(self):
        # Leg 1: 50 miles, 1.0 hour. Leg 2: 50 miles, 1.0 hour.
        # Total distance 100 miles, total driving 2.0 hours.
        events, state = HOSScheduler.schedule_trip(
            leg1_distance=50.0,
            leg1_duration=1.0,
            leg2_distance=50.0,
            leg2_duration=1.0,
            geometry=self.geometry,
            cum_distances=self.cum_distances,
            cycle_used_hours=0.0,
            trip_start_iso=self.trip_start
        )
        
        # We expect events: DRIVING (1h), PICKUP (1h), DRIVING (1h), DROPOFF (1h)
        self.assertEqual(len(events), 4)
        self.assertEqual(events[0]["type"], "DRIVING")
        self.assertEqual(events[1]["type"], "PICKUP")
        self.assertEqual(events[2]["type"], "DRIVING")
        self.assertEqual(events[3]["type"], "DROPOFF")
        
        self.assertEqual(state["driving_today"], 2.0)
        self.assertEqual(state["duty_window_used"], 4.0)

    def test_eight_hour_driving_break(self):
        # Leg 1: 540 miles, 9.0 hours. Leg 2: 60 miles, 1.0 hour.
        # Total driving 10.0 hours. Leg 1 takes 9 hours -> should insert 30m break at 8 hours driving.
        events, state = HOSScheduler.schedule_trip(
            leg1_distance=540.0,
            leg1_duration=9.0,
            leg2_distance=60.0,
            leg2_duration=1.0,
            geometry=self.geometry,
            cum_distances=self.cum_distances,
            cycle_used_hours=0.0,
            trip_start_iso=self.trip_start
        )

        # Expected:
        # 1. DRIVING (8.0h)
        # 2. BREAK (0.5h) - after 8 hours of driving
        # 3. DRIVING (1.0h) - finishes leg 1
        # 4. PICKUP (1.0h)
        # 5. DRIVING (1.0h)
        # 6. DROPOFF (1.0h)
        event_types = [e["type"] for e in events]
        self.assertIn("BREAK", event_types)
        
        # The break should be inserted after the first 8 hours of driving
        self.assertEqual(events[0]["type"], "DRIVING")
        self.assertEqual(events[0]["duration_hours"], 8.0)
        self.assertEqual(events[1]["type"], "BREAK")
        self.assertEqual(events[1]["duration_hours"], 0.5)

    def test_eleven_hour_driving_rest(self):
        # Leg 1: 720 miles, 12.0 hours. Leg 2: 60 miles, 1.0 hour.
        # Driver will hit 8h break, then drive 3h (total 11h), then must REST 10h.
        events, state = HOSScheduler.schedule_trip(
            leg1_distance=720.0,
            leg1_duration=12.0,
            leg2_distance=60.0,
            leg2_duration=1.0,
            geometry=self.geometry,
            cum_distances=self.cum_distances,
            cycle_used_hours=0.0,
            trip_start_iso=self.trip_start
        )

        event_types = [e["type"] for e in events]
        self.assertIn("REST", event_types)
        
        # Verify the sequence: DRIVING (8h) -> BREAK (0.5h) -> DRIVING (3h) -> REST (10h) -> DRIVING (1h)
        self.assertEqual(events[0]["type"], "DRIVING")
        self.assertEqual(events[1]["type"], "BREAK")
        self.assertEqual(events[2]["type"], "DRIVING")
        self.assertEqual(events[2]["duration_hours"], 3.0)
        self.assertEqual(events[3]["type"], "REST")
        self.assertEqual(events[3]["duration_hours"], 10.0)

    def test_fourteen_hour_duty_window_rest(self):
        # Initial duty window used is 13.0 hours.
        # Driver drives 1.5 hours. They will hit the 14-hour duty window limit (after 1.0 hour) and must REST.
        events, state = HOSScheduler.schedule_trip(
            leg1_distance=90.0,
            leg1_duration=1.5,
            leg2_distance=10.0,
            leg2_duration=0.2,
            geometry=self.geometry,
            cum_distances=self.cum_distances,
            cycle_used_hours=0.0,
            trip_start_iso=self.trip_start,
            driving_since_break_hours=0.0,
            duty_window_used_hours=13.0
        )

        # First event should drive for 1.0 hour (filling the 14h window), then REST 10h, then drive 0.5h
        self.assertEqual(events[0]["type"], "DRIVING")
        self.assertEqual(events[0]["duration_hours"], 1.0)
        self.assertEqual(events[1]["type"], "REST")
        self.assertEqual(events[1]["duration_hours"], 10.0)

    def test_fuel_stop_every_1000_miles(self):
        # Leg 1: 1100 miles, 18.0 hours. Leg 2: 50 miles, 1.0 hour.
        # Mileage exceeds 1000 miles, so a fuel stop must be scheduled.
        events, state = HOSScheduler.schedule_trip(
            leg1_distance=1100.0,
            leg1_duration=18.0,
            leg2_distance=50.0,
            leg2_duration=1.0,
            geometry=self.geometry,
            cum_distances=self.cum_distances,
            cycle_used_hours=0.0,
            trip_start_iso=self.trip_start
        )

        event_types = [e["type"] for e in events]
        self.assertTrue("FUEL" in event_types or "FUEL_BREAK" in event_types)

    def test_cycle_limit_exceeded(self):
        # Driver has 68.0 hours of cycle used already, meaning only 2.0 hours left.
        # The trip requires at least 4.0 hours of work.
        # Should raise CycleExceededException.
        with self.assertRaises(CycleExceededException):
            HOSScheduler.schedule_trip(
                leg1_distance=100.0,
                leg1_duration=2.0,
                leg2_distance=100.0,
                leg2_duration=2.0,
                geometry=self.geometry,
                cum_distances=self.cum_distances,
                cycle_used_hours=68.0,
                trip_start_iso=self.trip_start
            )

class ELDGeneratorTestCase(SimpleTestCase):
    def test_daily_logs_24h_continuity(self):
        # A simple list of events that span 2 days
        events = [
            {
                "type": "DRIVING",
                "start_time": "2026-08-19T08:00:00",
                "end_time": "2026-08-19T16:00:00",
                "duration_hours": 8.0,
                "start_distance_miles": 0.0,
                "end_distance_miles": 480.0,
            },
            {
                "type": "REST",
                "start_time": "2026-08-19T16:00:00",
                "end_time": "2026-08-20T02:00:00",
                "duration_hours": 10.0,
                "start_distance_miles": 480.0,
                "end_distance_miles": 480.0,
            },
            {
                "type": "DRIVING",
                "start_time": "2026-08-20T02:00:00",
                "end_time": "2026-08-20T05:00:00",
                "duration_hours": 3.0,
                "start_distance_miles": 480.0,
                "end_distance_miles": 660.0,
            }
        ]

        daily_logs = ELDGenerator.generate_daily_logs(events, "2026-08-19T08:00:00")
        
        # We expect 2 daily log sheets
        self.assertEqual(len(daily_logs), 2)
        
        # Day 1: 2026-08-19
        log1 = daily_logs[0]
        self.assertEqual(log1["date"], "2026-08-19")
        # Sum of segments durations should be exactly 24 hours
        sum_durations1 = sum(s["duration_hours"] for s in log1["segments"])
        self.assertAlmostEqual(sum_durations1, 24.0, places=2)
        self.assertEqual(log1["driving_hours"], 8.0)
        self.assertEqual(log1["total_miles"], 480.0)

        # Day 2: 2026-08-20
        log2 = daily_logs[1]
        self.assertEqual(log2["date"], "2026-08-20")
        sum_durations2 = sum(s["duration_hours"] for s in log2["segments"])
        self.assertAlmostEqual(sum_durations2, 24.0, places=2)
        self.assertEqual(log2["driving_hours"], 3.0)
        self.assertEqual(log2["total_miles"], 180.0)
