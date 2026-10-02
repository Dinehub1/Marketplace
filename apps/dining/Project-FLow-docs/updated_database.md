# Updated Database Structure - DropBy Event System

## 1. ✅ IMPLEMENTED: Video Cover Feature

### Changes Made:
- **Added `cover_video_url` column to `events` table**
  - Type: `TEXT` (nullable)
  - Purpose: Store Cloudflare R2 video URLs for event covers
  - Behavior: When present, replaces cover image with auto-playing muted video

### Video Player Features:
- **4:5 aspect ratio** for event lists
- **Muted by default** with unmute button
- **Auto-play and loop** for engagement
- **Fallback to cover image** if video fails to load
- **Loading state** with spinner
- **Responsive design** for different screen sizes

### Updated Components:
1. **EventVideoPlayer.tsx** - New reusable video component
2. **app/book-event/[id].tsx** - Event detail page with video support
3. **app/(tabs)/showtime.tsx** - Event listing with video cards
4. **app/(tabs)/index.tsx** - Home screen event previews

---

## 2. 📋 PLAN: Hierarchical Category System

### Current State Analysis:
- **Current table**: `event_categories` (flat structure)
- **15 existing categories**: Art, Celebration, Comedy, Cooking, Corporate, Cultural, Dance, Educational, Entertainment, Food & Drink, Music, Networking, Sports, Wedding, Wine Tasting

### Proposed Hierarchical Structure:

#### **Option A: Parent-Child Categories (Recommended)**

```sql
-- New table structure
CREATE TABLE event_category_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES event_category_hierarchy(id),
  level INTEGER NOT NULL DEFAULT 1, -- 1=parent, 2=child, 3=grandchild
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **Category Hierarchy Design:**

1. **🎵 MUSIC**
   - All Concerts
   - Music Festivals  
   - Live Gigs
   - DJ Sets
   - Classical Music

2. **🌃 NIGHTLIFE**
   - All Nightlife
   - Clubbing
   - DJ Nights
   - Late Night Parties
   - Rooftop Events

3. **🎭 NAVRATRI**
   - All Navratri
   - Garba Events
   - Dandiya Nights
   - Traditional Celebrations
   - Modern Fusion

4. **🎪 FESTS & FAIRS**
   - All Festivals
   - Food Festivals
   - Art Fairs
   - Cultural Fests
   - Seasonal Events

5. **🍷 FOOD & DRINK**
   - All Food Events
   - Wine Tasting
   - Cooking Classes
   - Food Festivals
   - Brewery Tours

6. **🎉 ENTERTAINMENT**
   - All Entertainment
   - Comedy Shows
   - Live Performances
   - Theater
   - Variety Shows

#### **Migration Strategy:**

1. **Phase 1**: Create new hierarchy table
2. **Phase 2**: Migrate existing categories as parent categories
3. **Phase 3**: Add subcategories for each parent
4. **Phase 4**: Update event assignments
5. **Phase 5**: Update UI components for filtering

#### **Database Changes Required:**

```sql
-- 1. Create hierarchy table
CREATE TABLE event_category_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES event_category_hierarchy(id),
  level INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indexes for performance
CREATE INDEX idx_event_category_hierarchy_parent_id ON event_category_hierarchy(parent_id);
CREATE INDEX idx_event_category_hierarchy_level ON event_category_hierarchy(level);

-- 3. Update events table
ALTER TABLE events ADD COLUMN category_hierarchy_id UUID REFERENCES event_category_hierarchy(id);

-- 4. Create view for easy querying
CREATE VIEW event_categories_with_hierarchy AS
SELECT 
  e.id as event_id,
  e.title,
  parent.name as parent_category,
  child.name as child_category,
  parent.icon as parent_icon,
  child.icon as child_icon
FROM events e
LEFT JOIN event_category_hierarchy child ON e.category_hierarchy_id = child.id
LEFT JOIN event_category_hierarchy parent ON child.parent_id = parent.id;
```

#### **UI/UX Filtering Design:**

1. **Two-Level Filter Dropdown:**
   ```
   Music ▼
   ├── All Concerts
   ├── Music Festivals
   ├── Live Gigs
   └── DJ Sets
   ```

2. **Filter API Endpoints:**
   - `GET /categories` - Get all parent categories
   - `GET /categories/{parent_id}/subcategories` - Get subcategories
   - `GET /events?category={parent_id}&subcategory={child_id}` - Filter events

3. **Search Enhancement:**
   - Search within category hierarchy
   - Auto-suggest based on category context
   - "Show all" option for each parent category

#### **Benefits:**
- **Better Organization**: Logical grouping of related events
- **Improved Discovery**: Users can find specific types of events easier
- **Scalability**: Easy to add new categories without cluttering
- **Analytics**: Better insights into popular event types
- **SEO**: Category-based URLs for better search optimization

---

## 3. 🔄 Migration Timeline

### Immediate (Completed):
- ✅ Video cover feature implementation
- ✅ Database column addition
- ✅ UI components updated

### Next Phase (Recommended):
1. **Week 1**: Database schema changes for hierarchy
2. **Week 2**: Data migration from flat to hierarchical
3. **Week 3**: API updates for new category system
4. **Week 4**: UI/UX updates for filtering
5. **Week 5**: Testing and optimization

---

## 4. 🎯 Current Database Schema Summary

### **Events Table** (Updated):
```sql
events (
  id UUID PRIMARY KEY,
  organizer_id UUID NOT NULL,
  restaurant_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  venue_name TEXT,
  venue_address TEXT,
  city TEXT,
  state TEXT,
  ticket_price NUMERIC,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  cover_image_url TEXT,
  cover_video_url TEXT, -- ✅ NEW: Video cover support
  gallery_images TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  category_id UUID, -- Current flat category system
  age_restriction TEXT,
  dress_code TEXT,
  includes_food BOOLEAN DEFAULT false,
  includes_drinks BOOLEAN DEFAULT false,
  parking_available BOOLEAN DEFAULT false,
  cancellation_policy TEXT
)
```

### **Related Tables:**
- `event_categories` (current flat structure)
- `event_ticket_types` (ticket pricing and availability)
- `event_bookings` (user bookings)
- `event_promotions` (discounts and offers)

---

## 5. 🚨 **URGENT: Event Detail Page Database Gaps**

### **Critical Issues Found:**
After analyzing the event detail page (`app/book-event/[id].tsx`), several sections are using **hardcoded data** instead of database content:

#### **❌ Missing Database Support:**
1. **Event Guide Section** - Languages, duration, age restrictions, layout
2. **Prohibited Items** - Dynamic list of banned items
3. **FAQ Section** - Event-specific frequently asked questions  
4. **Terms & Conditions** - Event-specific terms
5. **Venue Features** - Detailed venue amenities
6. **Gallery Images** - Uses existing field but displays incorrectly

#### **⚠️ Partially Supported:**
1. **Venue Details** - Has basic info but missing features
2. **Gallery** - Database field exists but frontend shows duplicates

### **Recommended Implementation Order:**

#### **Phase 1 (Quick Fixes):**
1. ✅ **Fix Gallery Display** - Use `event.gallery_images` properly
2. 🔄 **Add Event Guide JSONB Column** - Store event guide data
3. 🔄 **Add Prohibited Items JSONB Column** - Dynamic prohibited items list

#### **Phase 2 (Structured Data):**
4. 🔄 **Create Event FAQ Table** - Dynamic FAQ system
5. 🔄 **Create Event Terms Table** - Event-specific terms
6. 🔄 **Create Venue Features Table** - Detailed venue information

#### **Phase 3 (Advanced Features):**
7. 🔄 **Category Hierarchy** - Ready for implementation
8. 📱 **Mobile Optimization** - Video performance tuning

### **Database Migration Required:**
See `event_database_analysis.md` for detailed migration plan and SQL scripts.

---

## 6. 🚀 Implementation Priority

### **🔥 CRITICAL (Fix Immediately):**
1. ✅ **Video Cover System** - Implemented
2. 🚨 **Event Page Database Integration** - Multiple hardcoded sections need database support

### **High Priority:**
1. 🔄 **Event Guide Data** - Add structured event information
2. 🔄 **Dynamic Content System** - FAQ, Terms, Prohibited Items
3. 🔄 **Gallery Fix** - Use existing gallery_images field properly

### **Medium Priority:**
1. 🔄 **Category Hierarchy** - Ready for implementation  
2. **Advanced Filtering** - Multi-criteria search
3. **Event Analytics** - Category-based insights

### **Future Enhancements:**
1. **Video Thumbnails** - Auto-generated previews
2. **Live Streaming** - Real-time event coverage
3. **AR/VR Integration** - Immersive event previews
