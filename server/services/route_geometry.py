from utils.distance import haversine_distance

class RouteGeometryHelper:
    @classmethod
    def calculate_cumulative_distances(cls, geometry, target_total_miles: float):
        """
        Calculates cumulative distances along the route geometry,
        scaling the values so the total cumulative distance matches target_total_miles.
        """
        if not geometry:
            return []

        cum_distances = [0.0]
        for i in range(len(geometry) - 1):
            p1 = geometry[i]
            p2 = geometry[i+1]
            d = haversine_distance(p1[0], p1[1], p2[0], p2[1])
            cum_distances.append(cum_distances[-1] + d)

        total_geom_dist = cum_distances[-1]
        if total_geom_dist > 0 and target_total_miles > 0:
            scale_factor = target_total_miles / total_geom_dist
            scaled_distances = [d * scale_factor for d in cum_distances]
            return scaled_distances
        
        return cum_distances

    @classmethod
    def get_point_at_distance(cls, geometry, cum_distances, target_distance: float):
        """
        Interpolates the latitude and longitude coordinates at target_distance miles.
        """
        if not geometry or not cum_distances:
            return None

        # Clamp target distance to the range of the route
        if target_distance <= 0:
            return geometry[0]
        if target_distance >= cum_distances[-1]:
            return geometry[-1]

        # Find the segment containing the target distance
        for i in range(len(cum_distances) - 1):
            d1 = cum_distances[i]
            d2 = cum_distances[i+1]
            if d1 <= target_distance <= d2:
                segment_dist = d2 - d1
                if segment_dist == 0:
                    return geometry[i]
                
                # Proportional interpolation
                ratio = (target_distance - d1) / segment_dist
                lat = geometry[i][0] + ratio * (geometry[i+1][0] - geometry[i][0])
                lon = geometry[i][1] + ratio * (geometry[i+1][1] - geometry[i][1])
                return [lat, lon]

        return geometry[-1]
