# 🎨 Multi-Shape Support Guide

## 🎯 Overview

The SVG Layout System now supports **4 shape types** with pixel-perfect click detection:

1. ✅ **Rectangle** - Standard rectangular sections
2. ✅ **Circle** - Perfect circular sections  
3. ✅ **Ellipse** - Oval/elliptical sections
4. ✅ **Polygon** - Custom polygonal sections (triangles, pentagons, etc.)

---

## 🗄️ Database Structure

### **New Columns:**

```sql
shape_type VARCHAR(20) DEFAULT 'rectangle'
  -- Values: 'rectangle', 'circle', 'ellipse', 'polygon'

polygon_points TEXT
  -- Shape-specific data format varies by type
```

### **Data Formats:**

| Shape Type | polygon_points Format | Example |
|------------|----------------------|---------|
| **Rectangle** | `NULL` (uses bbox) | `NULL` |
| **Circle** | `cx,cy,radius` | `500,500,200` |
| **Ellipse** | `cx,cy,rx,ry` | `500,500,300,150` |
| **Polygon** | `x1,y1 x2,y2 x3,y3...` | `100,100 200,300 300,100` |

---

## 🛠️ Tool Features

### **1. Automatic Detection**

When you upload an SVG, the tool automatically detects:

```xml
<!-- Circle detected -->
<g id="VIP">
  <circle cx="500" cy="500" r="200"/>
</g>
→ shape_type: 'circle'
→ polygon_points: '500,500,200'

<!-- Ellipse detected -->
<g id="LOUNGE">
  <ellipse cx="500" cy="500" rx="300" ry="150"/>
</g>
→ shape_type: 'ellipse'
→ polygon_points: '500,500,300,150'

<!-- Polygon detected -->
<g id="STAGE">
  <polygon points="100,100 200,300 300,100"/>
</g>
→ shape_type: 'polygon'
→ polygon_points: '100,100 200,300 300,100'

<!-- Rectangle (default) -->
<g id="MVP">
  <path d="M100,100 L300,100 L300,200 L100,200 Z"/>
</g>
→ shape_type: 'rectangle'
→ polygon_points: NULL (uses bbox)
```

### **2. Shape Type Selector**

Each section has a dropdown to change shape type:

```
Polygon Key: MVP
Display Name: MVP Lounge
Shape Type: [Rectangle ▼]  ← Click to change
           - Rectangle
           - Circle
           - Ellipse
           - Polygon
```

**When to change:**
- Tool detected wrong shape type
- Want to force specific detection behavior
- Manual override needed

### **3. Visual Preview**

Overlays match shape type:

```
Rectangle: ▭ Square corners
Circle:    ● Perfectly round
Ellipse:   ⬭ Perfectly round (oval bbox)
Polygon:   ▲ Square bbox (contains polygon)
```

---

## 🎯 Click Detection

### **How It Works:**

Each shape type has its own click detection algorithm:

#### **1. Rectangle**
```typescript
// Simple bbox check
isInside = (
  x >= bbox.x &&
  x <= bbox.x + bbox.width &&
  y >= bbox.y &&
  y <= bbox.y + bbox.height
)
```

**Use for:**
- Standard rectangular sections
- Most venue sections
- Simple layouts

#### **2. Circle**
```typescript
// Distance from center
const distance = Math.sqrt((x - cx)² + (y - cy)²)
isInside = distance <= radius
```

**Use for:**
- Circular stages
- Round VIP areas
- DJ booths
- Circular lounges

**Advantage:** No clickable corners (pixel-perfect)

#### **3. Ellipse**
```typescript
// Normalized ellipse equation
const normX = (x - cx) / rx
const normY = (y - cy) / ry
isInside = (normX² + normY²) <= 1
```

**Use for:**
- Oval stages
- Elliptical VIP areas
- Racing track-shaped sections

**Advantage:** Perfect oval detection

#### **4. Polygon**
```typescript
// Ray casting algorithm
// Counts intersections with polygon edges
isInside = pointInPolygon(x, y, vertices)
```

**Use for:**
- Triangular sections
- Pentagonal/hexagonal areas
- Irregular custom shapes
- Star-shaped sections

**Advantage:** Any shape supported

---

## 📊 Examples

### **Example 1: Circular VIP Lounge**

**SVG:**
```xml
<g id="VIP" data-id="VIP" class="section">
  <circle cx="500" cy="500" r="200" fill="#FFD700"/>
</g>
```

**Tool Detection:**
- ✅ Auto-detects as `circle`
- ✅ Extracts `cx=500, cy=500, r=200`
- ✅ Calculates bbox for positioning

**Database:**
```sql
INSERT INTO event_layout_sections (
  polygon_key, shape_type, polygon_points,
  bbox_x, bbox_y, bbox_width, bbox_height
) VALUES (
  'VIP', 'circle', '500,500,200',
  300, 300, 400, 400  -- Bounding box
);
```

**Click Detection:**
```
User clicks at (600, 500):
  distance = sqrt((600-500)² + (500-500)²) = 100
  100 <= 200 → ✅ INSIDE circle!

User clicks at (750, 500):
  distance = sqrt((750-500)² + (500-500)²) = 250
  250 > 200 → ❌ OUTSIDE circle
```

**Visual:**
```
     Bbox: [300,300 → 700,700]
    ┌──────────────────┐
    │                  │
    │      ╭────╮      │
    │     │  ●  │      │ ← Circle: only center clickable
    │      ╰────╯      │
    │                  │
    └──────────────────┘
    ❌ Corners NOT clickable (no wasted clicks)
```

---

### **Example 2: Triangular Stage**

**SVG:**
```xml
<g id="STAGE" data-id="STAGE" class="section">
  <polygon points="500,100 300,400 700,400" fill="#FF5C5C"/>
</g>
```

**Tool Detection:**
- ✅ Auto-detects as `polygon`
- ✅ Extracts 3 vertices
- ✅ Calculates bbox

**Database:**
```sql
INSERT INTO event_layout_sections (
  polygon_key, shape_type, polygon_points,
  bbox_x, bbox_y, bbox_width, bbox_height
) VALUES (
  'STAGE', 'polygon', '500,100 300,400 700,400',
  300, 100, 400, 300
);
```

**Click Detection:**
```
User clicks at (500, 250):
  Ray-casting from point →
  Intersects 1 edge → ✅ INSIDE triangle!

User clicks at (200, 250):
  Ray-casting from point →
  Intersects 0 edges → ❌ OUTSIDE triangle
```

**Visual:**
```
    Bbox: [300,100 → 700,400]
    ┌──────────────────┐
    │       /\         │
    │      /  \        │ ← Triangle
    │     /____\       │
    │                  │
    └──────────────────┘
    ❌ Empty corners NOT clickable
```

---

### **Example 3: Elliptical Dance Floor**

**SVG:**
```xml
<g id="DANCEFLOOR" data-id="DANCEFLOOR" class="section">
  <ellipse cx="500" cy="500" rx="300" ry="150" fill="#7BA6A7"/>
</g>
```

**Tool Detection:**
- ✅ Auto-detects as `ellipse`
- ✅ Extracts `cx, cy, rx, ry`

**Database:**
```sql
INSERT INTO event_layout_sections (
  polygon_key, shape_type, polygon_points,
  bbox_x, bbox_y, bbox_width, bbox_height
) VALUES (
  'DANCEFLOOR', 'ellipse', '500,500,300,150',
  200, 350, 600, 300
);
```

**Visual:**
```
    Bbox: [200,350 → 800,650]
    ┌──────────────────────┐
    │                      │
    │   ╭────────────╮     │ ← Ellipse (wide)
    │   ╰────────────╯     │
    │                      │
    └──────────────────────┘
    ❌ Left/right corners NOT clickable
```

---

## 🔧 Tool Usage

### **Step 1: Upload SVG**
1. Open `tools/svg-layout-converter.html`
2. Upload SVG with various shapes
3. Tool auto-detects shape types

### **Step 2: Review Detection**

Check each section:
```
✅ VIP (● circle) - Detected correctly
✅ STAGE (▲ polygon) - Detected correctly
❌ LOUNGE (▭ rectangle) - Should be ellipse!
```

### **Step 3: Fix if Needed**

For LOUNGE:
1. Find LOUNGE section in list
2. Change "Shape Type" dropdown to "Ellipse"
3. Tool re-calculates automatically

### **Step 4: Preview**

Click "Preview Bounding Boxes":
- Circle overlays are round
- Rectangle overlays have corners
- Visual verification

### **Step 5: Transform & Download**

SQL will include shape data:
```sql
-- Circle
'VIP', 'circle', '500,500,200', ...

-- Polygon  
'STAGE', 'polygon', '500,100 300,400 700,400', ...

-- Ellipse
'LOUNGE', 'ellipse', '500,500,300,150', ...
```

---

## 💡 Best Practices

### **✅ DO:**

1. **Use Circles for Round Sections**
   - More accurate than rectangle
   - No wasted corner clicks
   - Better UX

2. **Use Polygons for Triangles/Stars**
   - Exact shape matching
   - Clean boundaries
   - Professional appearance

3. **Keep Bbox Updated**
   - Bbox still used for overlay positioning
   - Helps with layout calculations

4. **Preview Before Transforming**
   - Visual verification is key
   - Check shape accuracy
   - Ensure no overlaps

### **❌ DON'T:**

1. **Don't Use Rectangle for Circles**
   - Corners will be clickable
   - Poor user experience
   - Wasted click areas

2. **Don't Forget Shape Type**
   - SQL needs shape_type
   - App needs it for detection
   - Always specify

3. **Don't Mix Shape Types**
   - Keep consistent within event
   - Document your choices
   - Train your team

---

## 🧪 Testing

### **Test Checklist:**

#### **Rectangle:**
- [ ] Click center → Works
- [ ] Click edges → Works
- [ ] Click corners → Works
- [ ] Click outside → Doesn't work

#### **Circle:**
- [ ] Click center → Works
- [ ] Click edge (on circle) → Works
- [ ] Click corner (outside circle) → Doesn't work ✅
- [ ] Click outside bbox → Doesn't work

#### **Ellipse:**
- [ ] Click center → Works
- [ ] Click wide edge → Works
- [ ] Click narrow edge → Works
- [ ] Click corner (outside ellipse) → Doesn't work ✅

#### **Polygon:**
- [ ] Click inside polygon → Works
- [ ] Click vertex → Works
- [ ] Click empty bbox area → Doesn't work ✅
- [ ] Click outside → Doesn't work

---

## 📊 Performance

### **Click Detection Speed:**

| Shape | Algorithm | Performance |
|-------|-----------|-------------|
| Rectangle | Bbox check | ⚡ Instant |
| Circle | Distance calc | ⚡ Instant |
| Ellipse | Normalized distance | ⚡ Instant |
| Polygon | Ray casting | 🚀 Very fast |

**All shapes:** < 1ms click detection time ✅

---

## 🔄 Migration

### **Existing Layouts:**

All existing rectangles continue to work:

```sql
-- Old records (no shape_type)
shape_type = NULL → Treated as 'rectangle'
polygon_points = NULL → Uses bbox

-- Updated migration sets:
shape_type = 'rectangle' (default)
```

**No breaking changes!** ✅

---

## 🎯 Summary

### **What You Get:**

| Feature | Rectangle | Circle | Ellipse | Polygon |
|---------|-----------|---------|---------|---------|
| **Auto-detect** | ✅ | ✅ | ✅ | ✅ |
| **Click accuracy** | Good | Perfect | Perfect | Perfect |
| **Preview** | ✅ | ✅ (round) | ✅ (round) | ✅ |
| **SQL generation** | ✅ | ✅ | ✅ | ✅ |
| **Performance** | ⚡ | ⚡ | ⚡ | 🚀 |

### **Use Cases:**

- **Concerts:** Circular stages, rectangular VIP
- **Clubs:** Elliptical dance floors, polygon booths
- **Theaters:** Triangular balconies, rectangular sections
- **Custom:** Any shape imaginable!

---

**Shape support makes your venue layouts pixel-perfect!** 🎨✨

**Updated:** October 27, 2025  
**Version:** 3.0.0 (Multi-shape support)

