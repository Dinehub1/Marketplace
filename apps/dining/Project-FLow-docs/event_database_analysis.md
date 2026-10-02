# Event Database Analysis - Missing Fields & Migration Plan

## 📋 **Event Detail Page Sections Analysis**

Based on the `app/book-event/[id].tsx` file, here are all the sections that need database support:

### 1. **Event Guide Section** 
**Current Status:** ❌ **HARDCODED DATA**
**Frontend Location:** Lines 148-190
**Required Fields:**
```javascript
const eventGuideData = [
  { icon: 'language-outline', title: 'Language', value: 'Hindi, English, Punjabi' },
  { icon: 'time-outline', title: 'Duration', value: '4 Hours and 30 Minutes' },
  { icon: 'ticket-outline', title: 'Tickets Needed For', value: '18 years & above' },
  { icon: 'enter-outline', title: 'Entry Allowed For', value: '18 years & above' },
  { icon: 'home-outline', title: 'Layout', value: 'Outdoor' },
  { icon: 'people-outline', title: 'Seating Arrangement', value: 'Seated & Standing' },
  { icon: 'happy-outline', title: 'Kid Friendly?', value: 'No' },
  { icon: 'paw-outline', title: 'Pet Friendly?', value: 'No' }
];
```

### 2. **Prohibited Items Section**
**Current Status:** ❌ **HARDCODED DATA**
**Frontend Location:** Lines 192-202
**Required Fields:**
```javascript
const prohibitedItems = [
  'Outside Food & Beverages',
  'Weapons & Sharp Objects', 
  'Illegal Substances',
  'Professional Cameras',
  'Glass Bottles',
  'Laser Pointers',
  'Fireworks',
  'Pets (except service animals)'
];
```

### 3. **Venue Details Section**
**Current Status:** ⚠️ **PARTIALLY SUPPORTED**
**Frontend Location:** Lines 375-406
**Existing Database Support:**
- ✅ `venue_name` (existing)
- ✅ `venue_address` (existing)
**Missing Database Support:**
- ❌ Venue features (Food Court, Parking, AC, etc.)
- ❌ Venue contact details
- ❌ Venue capacity details

### 4. **Gallery/Images Section**
**Current Status:** ⚠️ **PARTIALLY SUPPORTED** 
**Frontend Location:** Lines 408-421
**Existing Database Support:**
- ✅ `gallery_images` (existing ARRAY field)
- ✅ `cover_image_url` (existing)
**Current Issue:** Frontend shows duplicate cover image instead of gallery images

### 5. **FAQ Section**
**Current Status:** ❌ **HARDCODED DATA**
**Frontend Location:** Lines 204-226
**Required Fields:**
```javascript
const faqData = [
  { id: 'parking', question: 'Is parking available?', answer: '...' },
  { id: 'food', question: 'Can I bring outside food?', answer: '...' },
  { id: 'refund', question: 'What is the refund policy?', answer: '...' },
  { id: 'age', question: 'Is there an age restriction?', answer: '...' }
];
```

### 6. **Terms & Conditions Section**
**Current Status:** ❌ **HARDCODED DATA**
**Frontend Location:** Lines 228-245
**Required Fields:**
```javascript
const termsData = [
  { id: 'entry', title: 'Entry Terms', content: '...' },
  { id: 'behavior', title: 'Behavior Policy', content: '...' },
  { id: 'liability', title: 'Liability', content: '...' }
];
```

---

## 🗃️ **Current Database vs Required Fields**

### **✅ Existing Fields (Already Supported)**
```sql
-- Basic Event Info
title TEXT NOT NULL,
description TEXT,
venue_name TEXT,
venue_address TEXT,
gallery_images TEXT[],
cover_image_url TEXT,
cover_video_url TEXT,

-- Event Details  
age_restriction TEXT,
dress_code TEXT,
includes_food BOOLEAN DEFAULT false,
includes_drinks BOOLEAN DEFAULT false,
parking_available BOOLEAN DEFAULT false,
cancellation_policy TEXT,
```

### **❌ Missing Fields (Need to Add)**

#### **Option 1: Add Columns to Events Table**
```sql
-- Event Guide Fields
languages TEXT[], -- ['Hindi', 'English', 'Punjabi']
duration_minutes INTEGER, -- 270 (4.5 hours)
min_age INTEGER, -- 18
event_layout TEXT, -- 'Outdoor', 'Indoor', 'Hybrid'
seating_arrangement TEXT, -- 'Seated & Standing'
is_kid_friendly BOOLEAN DEFAULT false,
is_pet_friendly BOOLEAN DEFAULT false,

-- Prohibited Items (JSON Array)
prohibited_items JSONB DEFAULT '[]'::jsonb,

-- Venue Features (JSON)
venue_features JSONB DEFAULT '{}'::jsonb,

-- FAQ & Terms (JSON Arrays)
faq_data JSONB DEFAULT '[]'::jsonb,
terms_data JSONB DEFAULT '[]'::jsonb,
```

#### **Option 2: Create Separate Tables (Recommended)**
```sql
-- Event Guide Information
CREATE TABLE event_guide_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  languages TEXT[] DEFAULT '{}',
  duration_minutes INTEGER,
  min_age INTEGER,
  event_layout TEXT,
  seating_arrangement TEXT,
  is_kid_friendly BOOLEAN DEFAULT false,
  is_pet_friendly BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event Prohibited Items
CREATE TABLE event_prohibited_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event Venue Features
CREATE TABLE event_venue_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL, -- 'Food Court', 'Parking', 'AC'
  feature_icon TEXT, -- 'restaurant', 'car', 'snow'
  is_available BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event FAQ
CREATE TABLE event_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event Terms & Conditions
CREATE TABLE event_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  term_type TEXT, -- 'entry', 'behavior', 'liability'
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🚀 **Recommended Migration Plan**

### **Phase 1: Fix Gallery Images (Quick Win)**
```sql
-- Update getEventById to properly handle gallery_images
-- Frontend: Use event.gallery_images instead of duplicating cover_image_url
```

### **Phase 2: Add Event Guide Information**
```sql
-- Option A: Add to events table
ALTER TABLE events ADD COLUMN event_guide_info JSONB DEFAULT '{}'::jsonb;

-- Option B: Create separate table (recommended)
CREATE TABLE event_guide_info (...);
```

### **Phase 3: Add Dynamic Content Tables**
```sql
CREATE TABLE event_prohibited_items (...);
CREATE TABLE event_venue_features (...);
CREATE TABLE event_faq (...);
CREATE TABLE event_terms (...);
```

### **Phase 4: Update API Functions**
```javascript
// Update getEventById to include all related data
export const getEventById = async (eventId) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_categories(id, name, icon),
      restaurants(id, name, address),
      event_ticket_types(*),
      event_guide_info(*),
      event_prohibited_items(*),
      event_venue_features(*),
      event_faq(*),
      event_terms(*)
    `)
    .eq('id', eventId)
    .single();
};
```

---

## 💾 **Data Structure Examples**

### **Event Guide Info (JSONB)**
```json
{
  "languages": ["Hindi", "English", "Punjabi"],
  "duration_minutes": 270,
  "min_age": 18,
  "event_layout": "Outdoor",
  "seating_arrangement": "Seated & Standing",
  "is_kid_friendly": false,
  "is_pet_friendly": false
}
```

### **Prohibited Items (Array)**
```json
[
  { "name": "Outside Food & Beverages", "icon": "fast-food-outline" },
  { "name": "Weapons & Sharp Objects", "icon": "warning-outline" },
  { "name": "Illegal Substances", "icon": "warning-outline" },
  { "name": "Professional Cameras", "icon": "camera-outline" },
  { "name": "Glass Bottles", "icon": "wine-outline" },
  { "name": "Laser Pointers", "icon": "flashlight-outline" },
  { "name": "Fireworks", "icon": "flame-outline" },
  { "name": "Pets (except service animals)", "icon": "paw-outline" }
]
```

### **Venue Features (Array)**
```json
[
  { "name": "Food Court", "icon": "restaurant", "available": true },
  { "name": "Parking", "icon": "car", "available": true },
  { "name": "Air Conditioning", "icon": "snow", "available": true },
  { "name": "WiFi", "icon": "wifi", "available": false }
]
```

### **FAQ Data (Array)**
```json
[
  {
    "id": "parking",
    "question": "Is parking available at the venue?",
    "answer": "Yes, free parking is available on a first-come, first-served basis.",
    "order": 1
  },
  {
    "id": "food", 
    "question": "Can I bring outside food and drinks?",
    "answer": "Outside food and beverages are not allowed.",
    "order": 2
  }
]
```

---

## 🎯 **Implementation Priority**

### **High Priority (Implement First):**
1. ✅ **Fix Gallery Images** - Use existing `gallery_images` field properly
2. 🔄 **Event Guide Info** - Add structured data for event details
3. 🔄 **Prohibited Items** - Dynamic list instead of hardcoded

### **Medium Priority:**
4. 🔄 **Venue Features** - Enhanced venue information
5. 🔄 **FAQ System** - Dynamic FAQ per event

### **Low Priority:**
6. 🔄 **Terms & Conditions** - Event-specific terms

---

## 🔧 **Next Steps**

1. **Choose Implementation Strategy:**
   - **Option A:** JSONB columns in events table (simpler)
   - **Option B:** Separate tables (more flexible, recommended)

2. **Create Migration Scripts**
3. **Update Supabase API Functions**
4. **Update Frontend Components**
5. **Add Admin Interface for Data Management**

**Recommendation:** Start with **Option A (JSONB)** for quick implementation, then migrate to **Option B (Separate Tables)** for better scalability.
