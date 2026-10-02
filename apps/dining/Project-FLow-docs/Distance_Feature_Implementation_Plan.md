# Distance Feature Implementation Plan (Swiggy/Zomato Style)

## 🎯 **Overview**
Implement a comprehensive distance-based restaurant discovery system that allows users to find nearby restaurants, sort by distance, and get accurate delivery/travel estimates.

## 🏗️ **Database Schema Updates**

### **1. Enhanced Restaurant Location Data**
```sql
-- Ensure all restaurants have location data
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS google_maps_place_id TEXT;

-- Add spatial index for faster distance queries (PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Update location column from lat/lng
UPDATE restaurants 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add spatial index
CREATE INDEX IF NOT EXISTS idx_restaurants_location 
ON restaurants USING GIST (location);
```

### **2. User Location Preferences**
```sql
-- Store user's preferred locations for faster lookup
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Home", "Work", "Current"
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
```

## 🚀 **Backend API Implementation**

### **1. Nearby Restaurants Endpoint**
```typescript
// GET /api/restaurants/nearby
interface NearbyRestaurantsRequest {
  latitude: number;
  longitude: number;
  radius?: number; // in meters, default 5000
  limit?: number; // default 20
  offset?: number; // for pagination
  sort_by?: 'distance' | 'rating' | 'price' | 'delivery_time';
  cuisine_filter?: string[];
  price_range?: [number, number];
  delivery_only?: boolean;
}

interface RestaurantWithDistance {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  distance_text: string; // "500 m", "1.2 km"
  delivery_time_minutes?: number;
  delivery_fee?: number;
  rating: number;
  price_range: number;
  cuisine_type: string[];
  cover_image_url: string;
  is_open: boolean;
  // ... other restaurant fields
}
```

### **2. Distance Calculation Functions**
```sql
-- PostgreSQL function for nearby restaurants with PostGIS
CREATE OR REPLACE FUNCTION get_nearby_restaurants(
  user_lat DECIMAL(10, 8),
  user_lng DECIMAL(11, 8),
  radius_meters INTEGER DEFAULT 5000,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_meters INTEGER,
  distance_text TEXT,
  rating DECIMAL(3, 2),
  price_range INTEGER,
  cuisine_type JSONB,
  cover_image_url TEXT,
  is_open BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.latitude,
    r.longitude,
    ROUND(ST_Distance(
      r.location, 
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)
    ))::INTEGER as distance_meters,
    CASE 
      WHEN ST_Distance(r.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)) < 1000 
      THEN CONCAT(ROUND(ST_Distance(r.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)))::TEXT, ' m')
      ELSE CONCAT(ROUND(ST_Distance(r.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)) / 1000, 1)::TEXT, ' km')
    END as distance_text,
    r.rating,
    r.price_range,
    r.cuisines,
    r.cover_image_url,
    -- Simple open/closed logic (can be enhanced with opening hours)
    CASE 
      WHEN r.opening_hours IS NOT NULL 
      THEN true -- TODO: Implement actual time checking
      ELSE true 
    END as is_open
  FROM restaurants r
  WHERE r.location IS NOT NULL
    AND ST_DWithin(
      r.location, 
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326), 
      radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

### **3. Fallback for Non-PostGIS (Haversine Formula)**
```sql
-- Alternative using Haversine formula for basic PostgreSQL
CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 DECIMAL(10, 8), 
  lng1 DECIMAL(11, 8), 
  lat2 DECIMAL(10, 8), 
  lng2 DECIMAL(11, 8)
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius_km DECIMAL := 6371;
  dlat DECIMAL;
  dlng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);
  
  a := SIN(dlat/2) * SIN(dlat/2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
       SIN(dlng/2) * SIN(dlng/2);
       
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN earth_radius_km * c * 1000; -- Return in meters
END;
$$ LANGUAGE plpgsql;
```

## 📱 **Frontend Implementation**

### **1. Location Services Integration**
```typescript
// Location service with permissions handling
export class LocationService {
  static async getCurrentLocation(): Promise<{latitude: number, longitude: number} | null> {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  static getDefaultLocation(city: string = 'Mumbai'): {latitude: number, longitude: number} {
    const defaults = {
      'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
      'Delhi': { latitude: 28.6139, longitude: 77.2090 },
      'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
    };
    return defaults[city] || defaults['Mumbai'];
  }
}
```

### **2. Distance Display Component**
```typescript
// Distance badge component
interface DistanceBadgeProps {
  distance_meters: number;
  delivery_time?: number;
  style?: ViewStyle;
}

export const DistanceBadge: React.FC<DistanceBadgeProps> = ({ 
  distance_meters, 
  delivery_time, 
  style 
}) => {
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  const estimateDeliveryTime = (meters: number): number => {
    // Simple estimation: 2 minutes per km + 15 minutes prep time
    const travelTime = Math.ceil((meters / 1000) * 2);
    return Math.max(15 + travelTime, 20); // Minimum 20 minutes
  };

  const deliveryTime = delivery_time || estimateDeliveryTime(distance_meters);

  return (
    <View style={[styles.distanceBadge, style]}>
      <Text style={styles.distanceText}>{formatDistance(distance_meters)}</Text>
      <Text style={styles.deliveryTimeText}>{deliveryTime} min</Text>
    </View>
  );
};
```

### **3. Restaurant List with Distance Sorting**
```typescript
// Enhanced restaurant list component
export const NearbyRestaurantsList: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantWithDistance[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'delivery_time'>('distance');
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    const location = await LocationService.getCurrentLocation();
    
    if (location) {
      setUserLocation({ lat: location.latitude, lng: location.longitude });
      setLocationPermission('granted');
      loadNearbyRestaurants(location.latitude, location.longitude);
    } else {
      setLocationPermission('denied');
      // Use default city location
      const defaultLocation = LocationService.getDefaultLocation();
      setUserLocation({ lat: defaultLocation.latitude, lng: defaultLocation.longitude });
      loadNearbyRestaurants(defaultLocation.latitude, defaultLocation.longitude);
    }
  };

  const loadNearbyRestaurants = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/restaurants/nearby?latitude=${lat}&longitude=${lng}&sort_by=${sortBy}`);
      const data = await response.json();
      setRestaurants(data.restaurants);
    } catch (error) {
      console.error('Error loading nearby restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRestaurantCard = ({ item }: { item: RestaurantWithDistance }) => (
    <RestaurantCard
      restaurant={item}
      showDistance={true}
      onPress={() => router.push(`/restaurant/${item.id}`)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Location Status */}
      <LocationStatusBar 
        permission={locationPermission}
        onLocationRequest={initializeLocation}
      />

      {/* Sort Options */}
      <SortOptionsBar 
        sortBy={sortBy}
        onSortChange={(newSort) => {
          setSortBy(newSort);
          if (userLocation) {
            loadNearbyRestaurants(userLocation.lat, userLocation.lng);
          }
        }}
      />

      {/* Restaurant List */}
      <FlatList
        data={restaurants}
        renderItem={renderRestaurantCard}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={() => userLocation && loadNearbyRestaurants(userLocation.lat, userLocation.lng)}
      />
    </View>
  );
};
```

## 🔧 **Performance Optimizations**

### **1. Location Caching Strategy**
```typescript
// Cache user locations for faster subsequent loads
export class LocationCache {
  private static CACHE_KEY = 'user_location_cache';
  private static CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static async getCachedLocation(): Promise<{latitude: number, longitude: number, timestamp: number} | null> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const isExpired = Date.now() - data.timestamp > this.CACHE_DURATION;
        if (!isExpired) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading location cache:', error);
    }
    return null;
  }

  static async setCachedLocation(latitude: number, longitude: number): Promise<void> {
    try {
      const data = { latitude, longitude, timestamp: Date.now() };
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching location:', error);
    }
  }
}
```

### **2. Database Query Optimization**
```sql
-- Additional indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_rating 
ON restaurants(rating DESC) WHERE rating IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_price_range 
ON restaurants(price_range) WHERE price_range IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_cuisine_gin 
ON restaurants USING GIN (cuisines) WHERE cuisines IS NOT NULL;

-- Materialized view for frequently accessed data
CREATE MATERIALIZED VIEW IF NOT EXISTS restaurants_with_distance_cache AS
SELECT 
  id, name, latitude, longitude, rating, price_range, cuisines, cover_image_url,
  location
FROM restaurants 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE UNIQUE INDEX ON restaurants_with_distance_cache (id);
```

## 🎯 **User Experience Features**

### **1. Smart Location Detection**
- **Auto-detect**: Use GPS when available
- **Manual input**: Allow users to set delivery address
- **Saved locations**: Home, Work, and custom addresses
- **Location search**: Search with autocomplete using Google Places API

### **2. Distance-Based Features**
- **Delivery zones**: Show "Delivers to your area" badges
- **Delivery fees**: Calculate based on distance tiers
- **Time estimates**: Real-time delivery/pickup time calculation
- **Sort options**: Distance, rating, delivery time, price
- **Filter by radius**: 1km, 2km, 5km, 10km options

### **3. Visual Indicators**
```typescript
// Distance-based styling
const getDistanceColor = (meters: number): string => {
  if (meters <= 1000) return AppColors.green[500]; // Very close
  if (meters <= 3000) return AppColors.orange[500]; // Moderate
  return AppColors.red[500]; // Far
};

const getDeliveryFee = (meters: number): number => {
  if (meters <= 2000) return 0; // Free delivery
  if (meters <= 5000) return 29; // ₹29
  return 49; // ₹49
};
```

## 🚦 **Implementation Phases**

### **Phase 1: Foundation** (Week 1)
- [ ] Database schema updates with location columns
- [ ] Basic Haversine distance calculation
- [ ] Simple nearby restaurants API
- [ ] Location permission handling in app

### **Phase 2: Enhanced Features** (Week 2)
- [ ] PostGIS integration for better performance
- [ ] User location preferences storage
- [ ] Advanced sorting and filtering
- [ ] Distance-based delivery fee calculation

### **Phase 3: Smart Features** (Week 3)
- [ ] Location caching and optimization
- [ ] Google Places integration for address search
- [ ] Real-time delivery time estimates
- [ ] Push notifications for nearby restaurant offers

### **Phase 4: Analytics & Optimization** (Week 4)
- [ ] Distance-based recommendation engine
- [ ] Performance monitoring and optimization
- [ ] A/B testing for distance thresholds
- [ ] Analytics dashboard for location-based insights

## 🔒 **Privacy & Security Considerations**

### **1. Location Privacy**
- Request explicit user consent for location access
- Allow users to opt-out while still using the app
- Clear explanation of how location data is used
- Option to clear location history

### **2. Data Protection**
- Store only necessary location data
- Encrypt sensitive location information
- Regular cleanup of old location logs
- Comply with GDPR/CCPA requirements

## 📊 **Success Metrics**

### **1. User Engagement**
- **Location permission grant rate**: Target >70%
- **Distance-based search usage**: Track how often users sort by distance
- **Delivery conversion**: Orders from users who see distance info

### **2. Performance Metrics**
- **API response time**: <200ms for nearby restaurant queries
- **Location accuracy**: <100m error for user location detection
- **Cache hit rate**: >80% for repeated location requests

### **3. Business Impact**
- **Order radius expansion**: Track how distance features affect order geography
- **Delivery fee optimization**: Revenue impact of distance-based pricing
- **Restaurant discovery**: New restaurants found through distance search

## 🛠️ **Technical Dependencies**

### **Required Packages**
```json
{
  "expo-location": "^16.0.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "react-native-maps": "^1.7.0" // Optional for map view
}
```

### **Database Extensions**
```sql
-- PostGIS for advanced spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 🎯 **Next Steps**

1. **Start with Phase 1**: Implement basic distance calculation and nearby restaurants API
2. **Gather location data**: Ensure all existing restaurants have latitude/longitude
3. **Test with real users**: Get feedback on distance accuracy and usefulness
4. **Iterate based on usage**: Optimize performance and add advanced features

This comprehensive plan provides a solid foundation for implementing a production-ready distance feature that rivals Swiggy and Zomato's location-based restaurant discovery system.
