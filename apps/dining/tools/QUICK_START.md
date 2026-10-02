# ⚡ Quick Start Guide - SVG Layout Converter

## 🎯 30-Second Setup

1. Open `tools/svg-layout-converter.html` in your browser
2. Drag & drop your Figma SVG
3. Review detected sections
4. Click "Transform SVG"
5. Download transformed SVG
6. Copy SQL and run in database

**That's it!** 🎉

---

## 📝 Essential Checklist

### **Before Using Tool:**
- [ ] SVG exported from Figma
- [ ] Section groups have UPPERCASE IDs (STAGE, MVP, VIP, etc.)
- [ ] Visual elements inside each section group

### **After Transformation:**
- [ ] Download transformed SVG
- [ ] Upload to Supabase Storage
- [ ] Get public URL
- [ ] Create `event_layouts` record with SVG URL
- [ ] Copy generated SQL
- [ ] Replace `YOUR_LAYOUT_ID` with actual ID
- [ ] Set capacity values
- [ ] Run SQL in Supabase

### **Testing:**
- [ ] Event has `booking_type = 'layout'`
- [ ] Click "Book Tickets" button
- [ ] See venue layout with colored sections
- [ ] Click a section
- [ ] See tickets for that section
- [ ] Can add tickets to cart

---

## 🎨 Your Figma SVG Structure

```
✅ GOOD:
<svg viewBox="0 0 1080 1350">
  <g id="Frame 2">              ← Container (will be removed)
    <g id="STAGE">               ← ✅ Section (UPPERCASE)
      <path fill="#FF5C5C"/>
    </g>
    <g id="MVP">                 ← ✅ Section (UPPERCASE)
      <path fill="#7BA6A7"/>
    </g>
  </g>
</svg>

❌ BAD:
<svg viewBox="0 0 1080 1350">
  <g id="stage">                 ← ❌ lowercase
    <path fill="#FF5C5C"/>
  </g>
  <g id="My VIP Section">        ← ❌ spaces
    <path fill="#7BA6A7"/>
  </g>
</svg>
```

---

## 📋 What Tool Shows You

### **1. SVG Info**
- ViewBox dimensions
- Number of sections found
- Total visual elements
- File size

### **2. Section Configuration**
For each section:
- **Polygon Key**: What you'll use in database (e.g., `STAGE`)
- **Display Name**: What users see (e.g., "Backstage Access")
- **Bounding Box**: Auto-calculated coordinates (x, y, width, height)
- **Color**: Extracted from SVG

### **3. Generated Output**
- ✅ Transformed SVG (download ready)
- ✅ Polygon keys list (for reference)
- ✅ SQL statements (copy & paste ready)

---

## 🗄️ Database Values to Use

The tool tells you **EXACTLY** what to put in `event_layout_sections.polygon_key`:

**Example from tool:**
```
Use these polygon_key values in your database:
STAGE, FANPIT, MVP, VVIP, VIP
```

**Your SQL:**
```sql
INSERT INTO event_layout_sections (polygon_key, ...)
VALUES ('STAGE', ...),    -- ✅ Exactly as shown
       ('FANPIT', ...),   -- ✅ Exactly as shown
       ('MVP', ...);      -- ✅ Exactly as shown
```

---

## 🚨 Common Mistakes

### ❌ Wrong polygon_key
```sql
-- Tool says: "STAGE"
-- You write: "Stage" or "stage"
-- Result: Section won't be clickable ❌
```

### ✅ Correct polygon_key
```sql
-- Tool says: "STAGE"
-- You write: "STAGE"
-- Result: Works perfectly! ✅
```

---

## 🎯 Test Checklist

1. **Upload transformed SVG to Supabase** ✓
2. **Create event_layouts record** ✓
3. **Insert event_layout_sections** ✓
4. **Set event.booking_type = 'layout'** ✓
5. **Open event in app** ✓
6. **Click "Book Tickets"** ✓
7. **See venue layout** ✓
8. **Sections are colored** ✓
9. **Click a section** ✓
10. **See tickets list** ✓

---

## 💡 Pro Tip

**Save the SQL output from the tool!** 

You can reuse it for similar events or if you need to reset the sections.

---

## 🆘 Quick Fixes

### Section not clickable?
→ Check `polygon_key` matches exactly (case-sensitive)

### Section shows gray/dark?
→ Ensure `is_selectable = true` and `status = 'active'`

### Bounding box wrong?
→ Re-export SVG from Figma, ensure all paths inside section group

### SQL fails?
→ Replace `YOUR_LAYOUT_ID` with actual ID from `event_layouts`

---

## 📞 Need Help?

1. Read full guide: `tools/README.md`
2. Check database schema: `Docs/Complete_database.md`
3. Review console logs in browser and app
4. Verify Figma structure matches examples

---

**Total time per event: ~5 minutes** ⚡

**Good luck! 🚀**

