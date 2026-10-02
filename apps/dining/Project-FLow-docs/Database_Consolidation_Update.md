# Database Consolidation Update - Restaurants Table

## Overview

Successfully consolidated the restaurants table structure by combining facility columns into JSONB, simplifying categories, and removing unused columns. This creates a more flexible and maintainable database structure.

## Changes Implemented

### 1. **Facility Consolidation into `more_info` JSONB**

#### Before (Multiple Boolean Columns):
```sql
has_wifi: boolean
has_parking: boolean  
has_ac: boolean
has_live_music: boolean
has_outdoor_seating: boolean
has_private_dining: boolean
accepts_reservations: boolean
advance_booking_required: boolean
```

#### After (Single JSONB Column):
```sql
more_info: {
  "facilities": {
    "wifi": true,
    "parking": true,
    "air_conditioning": false,
    "live_music": false,
    "outdoor_seating": true,
    "private_dining": false
  },
  "policies": {
    "accepts_reservations": false,
    "advance_booking_required": false
  }
}
```

### 2. **Category Structure Simplification**

#### Before (Separate Mapping Table):
```sql
restaurant_category_mappings:
- restaurant_id (FK)
- category_id (FK)

restaurant_categories:
- id, name, description, etc.
```

#### After (Direct JSONB Array):
```sql
categories: [
  {
    "id": "uuid",
    "name": "Fast Food",
    "description": "Quick service restaurant",
    "type": "global",
    "icon_url": "🍔"
  },
  {
    "id": "uuid", 
    "name": "Coffee Specialties",
    "description": "Our unique coffee blends",
    "type": "custom",
    "icon_url": "☕"
  }
]
```

### 3. **Removed Unused Columns**
- ❌ `cancellation_policy` - Dropped completely
- ❌ `restaurant_category_mappings` table - Replaced with JSONB array

## New Database Structure

### **Updated Restaurants Table**
```sql
restaurants:
- id (UUID, Primary Key)
- owner_id (UUID, FK to users)
- name (TEXT)
- description (TEXT)
- cuisine_type (TEXT)  
- address, city, state, postal_code (TEXT)
- phone_number, email, website (TEXT)
- opening_hours (JSONB)
- price_range (TEXT)
- rating (NUMERIC)
- total_reviews (INTEGER)
- cover_image_url (TEXT)
- gallery_images (TEXT[])
- is_verified, is_active (BOOLEAN)
- latitude, longitude (NUMERIC)
- google_maps_place_id (TEXT)
- created_at, updated_at (TIMESTAMPTZ)

-- NEW CONSOLIDATED COLUMNS:
- more_info (JSONB) - Facilities, policies, and other info
- categories (JSONB) - Array of all restaurant categories

-- OLD COLUMNS (kept for transition):
- has_wifi, has_parking, has_ac, etc. (BOOLEAN)
- accepts_reservations, advance_booking_required (BOOLEAN)
```

## Helper Functions Created

### 1. **Facility Management**

#### `get_restaurant_facilities(restaurant_uuid)`
```sql
-- Returns facilities JSONB for a restaurant
SELECT get_restaurant_facilities('restaurant-id'::uuid);

-- Output:
{
  "wifi": true,
  "parking": true,
  "air_conditioning": false,
  "live_music": false,
  "outdoor_seating": true,
  "private_dining": false
}
```

#### `update_restaurant_facilities(restaurant_uuid, facilities_data)`
```sql
-- Update facilities for a restaurant
SELECT update_restaurant_facilities(
    'restaurant-id'::uuid,
    '{"wifi": true, "parking": false, "live_music": true}'::jsonb
);
```

### 2. **Category Management**

#### `add_restaurant_category(restaurant_uuid, category_data)`
```sql
-- Add a new category to restaurant
SELECT add_restaurant_category(
    'restaurant-id'::uuid,
    jsonb_build_object(
        'id', gen_random_uuid(),
        'name', 'Pizza Specials',
        'description', 'Our signature pizza creations',
        'type', 'custom',
        'icon_url', '🍕'
    )
);
```

#### `remove_restaurant_category(restaurant_uuid, category_id)`
```sql
-- Remove a category from restaurant
SELECT remove_restaurant_category(
    'restaurant-id'::uuid,
    'category-id'::uuid
);
```

#### `get_restaurant_categories_simple(restaurant_uuid)`
```sql
-- Get all categories for a restaurant
SELECT get_restaurant_categories_simple('restaurant-id'::uuid);

-- Output:
[
  {
    "id": "uuid",
    "name": "Fast Food", 
    "type": "global",
    "description": "Quick service",
    "icon_url": "🍔"
  },
  {
    "id": "uuid",
    "name": "Coffee Specialties",
    "type": "custom", 
    "description": "Our unique blends",
    "icon_url": "☕"
  }
]
```

### 3. **Search Functions**

#### `search_restaurants_by_facilities(required_facilities)`
```sql
-- Find restaurants with specific facilities
SELECT * FROM search_restaurants_by_facilities(ARRAY['wifi', 'parking']);

-- Returns restaurants that have BOTH wifi AND parking
```

#### `search_restaurants_by_categories(category_names)`
```sql
-- Find restaurants with specific categories
SELECT * FROM search_restaurants_by_categories(ARRAY['Fast Food', 'Coffee']);
```

### 4. **Complete Restaurant Data**

#### `get_restaurant_complete_info(restaurant_uuid)`
```sql
-- Get complete restaurant information in structured JSON
SELECT get_restaurant_complete_info('restaurant-id'::uuid);

-- Returns all restaurant data in a single JSONB object
```

## New View for Easy Access

### **`restaurants_with_facilities` View**
Provides backward compatibility and easy access to facility data:

```sql
SELECT 
    name,
    has_wifi,           -- Extracted boolean for backward compatibility
    has_parking,        -- Extracted boolean for backward compatibility  
    facilities,         -- Full facilities JSONB
    categories,         -- Full categories array
    categories_count    -- Number of categories
FROM restaurants_with_facilities 
WHERE id = 'restaurant-id';
```

## Usage Examples

### 1. **Managing Facilities**

```sql
-- Update multiple facilities at once
SELECT update_restaurant_facilities(
    'restaurant-id'::uuid,
    '{
        "wifi": true,
        "parking": true,
        "air_conditioning": true,
        "live_music": false,
        "outdoor_seating": true,
        "private_dining": false,
        "wheelchair_accessible": true,
        "pet_friendly": true
    }'::jsonb
);

-- Get current facilities
SELECT more_info->'facilities' as facilities 
FROM restaurants 
WHERE id = 'restaurant-id';
```

### 2. **Managing Categories**

```sql
-- Add multiple custom categories
SELECT add_restaurant_category('restaurant-id'::uuid, jsonb_build_object(
    'id', gen_random_uuid(),
    'name', 'Breakfast Specials',
    'description', 'Morning favorites',
    'type', 'custom',
    'icon_url', '🌅'
));

SELECT add_restaurant_category('restaurant-id'::uuid, jsonb_build_object(
    'id', gen_random_uuid(), 
    'name', 'Healthy Options',
    'description', 'Nutritious choices',
    'type', 'custom',
    'icon_url', '🥗'
));

-- View all categories
SELECT categories FROM restaurants WHERE id = 'restaurant-id';
```

### 3. **Searching and Filtering**

```sql
-- Find restaurants with specific facilities
SELECT name, facilities 
FROM restaurants_with_facilities 
WHERE facilities->>'wifi' = 'true' 
  AND facilities->>'parking' = 'true';

-- Find restaurants by category
SELECT name, categories
FROM restaurants
WHERE EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(categories) AS cat
    WHERE cat->>'name' = 'Fast Food'
);

-- Advanced facility search
SELECT * 
FROM search_restaurants_by_facilities(ARRAY['wifi', 'air_conditioning', 'parking']);
```

### 4. **API Integration Examples**

#### **For Restaurant Management:**
```javascript
// Update facilities
const updateFacilities = async (restaurantId, facilities) => {
  return supabase.rpc('update_restaurant_facilities', {
    restaurant_uuid: restaurantId,
    facilities_data: facilities
  });
};

// Add custom category
const addCategory = async (restaurantId, categoryData) => {
  return supabase.rpc('add_restaurant_category', {
    restaurant_uuid: restaurantId,
    category_data: categoryData
  });
};
```

#### **For Customer Search:**
```javascript
// Search by facilities
const searchByFacilities = async (facilities) => {
  return supabase.rpc('search_restaurants_by_facilities', {
    required_facilities: facilities
  });
};

// Get restaurant with all data
const getRestaurant = async (restaurantId) => {
  return supabase
    .from('restaurants_with_facilities')
    .select('*')
    .eq('id', restaurantId)
    .single();
};
```

## Benefits of New Structure

### 1. **Flexibility**
- ✅ Unlimited facility types without schema changes
- ✅ Rich metadata for each facility (descriptions, icons, etc.)
- ✅ Easy addition of new facility categories
- ✅ Custom categories per restaurant

### 2. **Performance** 
- ✅ Fewer table joins required
- ✅ GIN indexes on JSONB for fast querying
- ✅ Reduced database complexity
- ✅ Single query for complete restaurant data

### 3. **Maintainability**
- ✅ No more mapping tables to manage
- ✅ Consolidated data structure
- ✅ Self-contained restaurant records
- ✅ Easier data migrations

### 4. **Developer Experience**
- ✅ Rich JSON responses for APIs
- ✅ Flexible search capabilities
- ✅ Backward compatibility maintained
- ✅ Clear separation of concerns

## Migration Status

### ✅ **Completed:**
- ✅ `more_info` JSONB column created and populated
- ✅ `categories` JSONB array created and populated
- ✅ All existing boolean facility data migrated
- ✅ All category mappings migrated to JSONB
- ✅ Helper functions implemented and tested
- ✅ New view created for easy access
- ✅ Search functions implemented
- ✅ Indexes created for performance
- ✅ `cancellation_policy` column removed
- ✅ `restaurant_category_mappings` table removed

### ⚠️ **Optional Cleanup (Ready When Needed):**
- Old boolean facility columns still exist for transition period
- Can be removed by uncommenting the DROP COLUMN statements
- Backup view created for category mappings

## Security & Performance

### **Indexes Created:**
```sql
-- GIN indexes for fast JSONB querying
CREATE INDEX idx_restaurants_more_info_gin ON restaurants USING gin(more_info);
CREATE INDEX idx_restaurants_categories_gin ON restaurants USING gin(categories);
```

### **RLS Security:**
- All functions use `SECURITY DEFINER` with fixed `search_path`
- Proper input validation in place
- Read permissions granted appropriately

### **Query Performance:**
```sql
-- Fast facility searches
EXPLAIN ANALYZE 
SELECT * FROM restaurants 
WHERE more_info->'facilities'->>'wifi' = 'true';

-- Fast category searches  
EXPLAIN ANALYZE
SELECT * FROM restaurants 
WHERE categories @> '[{"name": "Fast Food"}]';
```

## Testing Examples

### **Verify Data Migration:**
```sql
-- Check facility migration
SELECT 
    name,
    has_wifi,                                    -- Old boolean
    (more_info->'facilities'->>'wifi')::boolean  -- New JSONB
FROM restaurants 
WHERE has_wifi != (more_info->'facilities'->>'wifi')::boolean;
-- Should return 0 rows if migration successful

-- Check category migration
SELECT COUNT(*) as migrated_restaurants
FROM restaurants 
WHERE jsonb_array_length(categories) > 0;
```

### **Test New Functions:**
```sql
-- Test facility updates
SELECT update_restaurant_facilities(
    (SELECT id FROM restaurants LIMIT 1),
    '{"wifi": true, "parking": false}'::jsonb
);

-- Test category additions
SELECT add_restaurant_category(
    (SELECT id FROM restaurants LIMIT 1),
    '{"id": "' || gen_random_uuid() || '", "name": "Test Category", "type": "custom"}'::jsonb
);
```

## Conclusion

The database consolidation has successfully:

1. **Reduced Complexity**: From 8+ boolean columns to 2 JSONB columns
2. **Increased Flexibility**: Unlimited facility types and custom categories
3. **Improved Performance**: Fewer joins, better indexing
4. **Enhanced Developer Experience**: Rich JSON APIs, powerful search functions
5. **Maintained Backward Compatibility**: Old structure still queryable during transition

The new structure is production-ready and provides a solid foundation for future restaurant management features while maintaining all existing functionality.
