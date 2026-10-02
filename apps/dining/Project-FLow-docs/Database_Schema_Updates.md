# Database Schema Updates - Custom Categories & Amenities

## Overview

Successfully implemented the requested database structure changes to allow restaurants to create their own custom categories and amenities, while also adding Google Maps integration.

## Changes Made

### 1. **Restaurant Table Updates**

#### New Columns Added:
- `google_maps_place_id` (TEXT) - Stores Google Maps Place ID for location integration
- `amenities` (JSONB) - Stores all restaurant amenities in flexible JSON format

#### Old Boolean Columns Migrated:
The following boolean columns have been migrated to the `amenities` JSONB field:
- `has_parking` → `amenities.parking`
- `has_wifi` → `amenities.wifi`
- `has_ac` → `amenities.air_conditioning`
- `has_live_music` → `amenities.live_music`
- `has_outdoor_seating` → `amenities.outdoor_seating`
- `has_private_dining` → `amenities.private_dining`
- `accepts_reservations` → `amenities.accepts_reservations`
- `advance_booking_required` → `amenities.advance_booking_required`

### 2. **New Tables Created**

#### `restaurant_custom_categories`
Allows restaurants to create their own menu categories.

```sql
CREATE TABLE restaurant_custom_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(restaurant_id, name)
);
```

#### `restaurant_custom_amenities`
Allows restaurants to create their own custom amenities.

```sql
CREATE TABLE restaurant_custom_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(restaurant_id, name)
);
```

### 3. **Helper Functions Created**

#### `get_restaurant_amenities(restaurant_uuid UUID)`
Returns combined JSONB of base amenities + custom amenities for a restaurant.

```sql
-- Example usage
SELECT get_restaurant_amenities('restaurant-id-here'::uuid);

-- Example output
{
  "wifi": false,
  "parking": true,
  "Happy Hour": {
    "icon": "🍻",
    "name": "Happy Hour",
    "category": "dining",
    "is_active": true,
    "description": "Special pricing during specific hours"
  },
  "Pet Friendly": {
    "icon": "🐕",
    "name": "Pet Friendly",
    "category": "environment",
    "is_active": true,
    "description": "Pets are welcome in outdoor areas"
  }
}
```

#### `get_restaurant_categories(restaurant_uuid UUID)`
Returns both global and custom categories for a restaurant.

```sql
-- Example usage
SELECT get_restaurant_categories('restaurant-id-here'::uuid);

-- Example output
{
  "global": [
    {
      "id": "uuid",
      "name": "Fast Food",
      "type": "global",
      "icon_url": "🍔",
      "description": "Quick service restaurants"
    }
  ],
  "custom": [
    {
      "id": "uuid",
      "name": "Signature Dishes",
      "type": "custom",
      "icon_url": null,
      "description": "Our most popular and unique dishes",
      "display_order": 1
    }
  ]
}
```

#### `add_custom_amenity(restaurant_uuid, name, description, icon, category)`
Adds a new custom amenity for a restaurant.

```sql
-- Example usage
SELECT add_custom_amenity(
    'restaurant-id'::uuid,
    'Pet Friendly',
    'Pets are welcome in outdoor areas',
    '🐕',
    'environment'
);
```

#### `add_custom_category(restaurant_uuid, name, description, icon_url, display_order)`
Adds a new custom category for a restaurant.

```sql
-- Example usage
SELECT add_custom_category(
    'restaurant-id'::uuid,
    'Signature Dishes',
    'Our most popular and unique dishes',
    null,
    1
);
```

#### `update_restaurant_amenities(restaurant_uuid, amenities_data)`
Updates the amenities JSONB field for a restaurant.

```sql
-- Example usage
SELECT update_restaurant_amenities(
    'restaurant-id'::uuid,
    '{"wifi": true, "parking": false, "live_music": true}'::jsonb
);
```

### 4. **View Created**

#### `restaurants_with_amenities`
Provides easy access to restaurant data with combined amenities and categories.

```sql
-- Example usage
SELECT * FROM restaurants_with_amenities WHERE id = 'restaurant-id';

-- Returns restaurant data plus:
-- - all_amenities: Combined JSONB of base + custom amenities
-- - all_categories: Combined global + custom categories
-- - custom_amenities_count: Number of custom amenities
-- - custom_categories_count: Number of custom categories
```

## Usage Examples

### 1. **Adding Google Maps Place ID**
```sql
UPDATE restaurants 
SET google_maps_place_id = 'ChIJdd4hrwug8EcRtQ8sqmA0ZH8' 
WHERE id = 'restaurant-id';
```

### 2. **Updating Restaurant Amenities**
```sql
-- Method 1: Using the helper function
SELECT update_restaurant_amenities(
    'restaurant-id'::uuid,
    '{"wifi": true, "parking": true, "live_music": false, "outdoor_seating": true}'::jsonb
);

-- Method 2: Direct update
UPDATE restaurants 
SET amenities = amenities || '{"new_feature": true}'::jsonb
WHERE id = 'restaurant-id';
```

### 3. **Adding Custom Amenities**
```sql
-- Add a special feature unique to your restaurant
SELECT add_custom_amenity(
    'restaurant-id'::uuid,
    'Rooftop Dining',
    'Beautiful rooftop seating with city views',
    '🏙️',
    'seating'
);
```

### 4. **Adding Custom Categories**
```sql
-- Add a restaurant-specific menu category
SELECT add_custom_category(
    'restaurant-id'::uuid,
    'Chef Special',
    'Our signature dishes created by our head chef',
    '👨‍🍳',
    0  -- display order (0 = first)
);
```

### 5. **Querying Restaurant Data**
```sql
-- Get complete restaurant information
SELECT 
    id,
    name,
    google_maps_place_id,
    all_amenities,
    all_categories,
    custom_amenities_count,
    custom_categories_count
FROM restaurants_with_amenities 
WHERE id = 'restaurant-id';

-- Search restaurants by custom amenities
SELECT * FROM restaurants 
WHERE amenities ? 'Pet Friendly';

-- Search restaurants with specific features
SELECT * FROM restaurants 
WHERE amenities->>'wifi' = 'true' 
   OR amenities ? 'Free WiFi';
```

## Benefits of New Structure

### 1. **Flexibility**
- Restaurants can create unlimited custom amenities
- Each restaurant can have unique categories
- JSONB allows for complex nested data structures

### 2. **Backward Compatibility**
- All existing boolean amenity data has been preserved
- Old queries still work during transition period
- Gradual migration possible

### 3. **Scalability**
- No need for schema changes when adding new amenity types
- Supports complex amenity metadata (descriptions, icons, categories)
- Efficient querying with GIN indexes on JSONB

### 4. **Integration Ready**
- Google Maps Place ID enables location services
- JSONB structure perfect for API responses
- Easy to extend with additional metadata

## Security & Performance

### **Row Level Security (RLS)**
- Restaurant owners can only manage their own categories and amenities
- Public read access to active categories and amenities
- Proper authentication checks in place

### **Indexes Created**
- GIN index on `amenities` JSONB for fast querying
- Standard indexes on foreign keys and frequently queried fields
- Google Maps Place ID indexed for location searches

### **Functions Security**
- All functions use `SECURITY DEFINER` with fixed `search_path`
- Proper input validation and error handling
- Prevents SQL injection attacks

## Migration Status

✅ **Completed:**
- New tables created with proper constraints
- Data migrated from boolean columns to JSONB
- Helper functions implemented and tested
- RLS policies configured
- Indexes created for performance
- Example data populated

⚠️ **Optional (Commented Out):**
- Old boolean columns removal (ready when needed)
- Can be uncommented after full testing

## Next Steps

1. **Application Integration**: Update your frontend/API to use the new structure
2. **Data Population**: Add real custom categories and amenities for restaurants
3. **Google Maps Integration**: Implement location features using Place IDs
4. **Testing**: Verify all functions work correctly with your use cases
5. **Cleanup**: Remove old boolean columns once migration is confirmed successful

## API Integration Examples

### **For Restaurant Management Dashboard:**
```javascript
// Add custom amenity
const addAmenity = async (restaurantId, amenityData) => {
  return supabase.rpc('add_custom_amenity', {
    restaurant_uuid: restaurantId,
    amenity_name: amenityData.name,
    amenity_description: amenityData.description,
    amenity_icon: amenityData.icon,
    amenity_category: amenityData.category
  });
};

// Get all amenities
const getAmenities = async (restaurantId) => {
  return supabase.rpc('get_restaurant_amenities', {
    restaurant_uuid: restaurantId
  });
};
```

### **For Customer-Facing Search:**
```javascript
// Search restaurants with specific amenities
const searchByAmenities = async (amenities) => {
  return supabase
    .from('restaurants')
    .select('*')
    .contains('amenities', amenities);
};

// Get restaurant with all data
const getRestaurantComplete = async (restaurantId) => {
  return supabase
    .from('restaurants_with_amenities')
    .select('*')
    .eq('id', restaurantId)
    .single();
};
```

This new structure provides maximum flexibility while maintaining performance and security. Restaurants can now truly customize their offerings while the system remains scalable and maintainable.
