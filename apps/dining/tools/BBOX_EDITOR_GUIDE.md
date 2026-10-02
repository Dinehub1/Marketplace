# 🎨 Bounding Box Visual Editor - User Guide

## 🎯 Overview

The SVG converter tool now includes a **visual bbox editor** that lets you see and adjust the clickable areas for each section with green overlays.

---

## ✨ New Features

### **1. Visual Preview** 👁️
- Green semi-transparent overlays show exact clickable areas
- Overlays positioned exactly where clicks will be detected
- Section name label on each overlay
- Real-time coordinate display

### **2. Interactive Editing** ✏️
- **Drag to move** - Click and drag overlay to reposition
- **Resize handles** - 8 handles (corners and edges) to adjust size
- **Manual entry** - Double-click for precise coordinate input
- **Live updates** - Changes immediately update the section list

### **3. Visual Feedback** 🎨
- **Green overlay** = Normal state
- **Blue overlay** = Selected/editing
- **Glow effect** = Hover state
- **Coordinate display** = Shows x, y, width, height

---

## 🚀 How to Use

### **Step 1: Upload SVG**
1. Open `tools/svg-layout-converter.html` in browser
2. Drag & drop your Figma SVG file
3. Tool detects sections automatically

### **Step 2: Click "Preview Bounding Boxes"**
4. Click the **"👁️ Preview Bounding Boxes"** button
5. Scrolls to preview section automatically
6. Shows SVG with green overlays

### **Step 3: Verify Coverage**

**Check each section:**
- ✅ Does the green overlay cover the entire clickable area?
- ✅ Is it positioned correctly?
- ✅ Does it overlap with other sections?

**Example - Correct:**
```
┌──────────────────────┐
│  STAGE Section       │
│  ┌────────────────┐  │ ← Green overlay exactly covers the rectangle
│  │ [Green Overlay]│  │
│  └────────────────┘  │
└──────────────────────┘
```

**Example - Wrong:**
```
┌──────────────────────┐
│  STAGE Section       │
│    ┌──────────┐      │ ← Green overlay too small or misaligned
│  │ [Overlay]  │      │
│    └──────────┘      │
└──────────────────────┘
```

### **Step 4: Adjust if Needed**

#### **Method A: Drag to Move**
1. Click on green overlay
2. Overlay turns **blue** (selected)
3. Drag to new position
4. Release mouse
5. Coordinates update automatically

#### **Method B: Resize**
1. Click on green overlay to select
2. Hover over **corner or edge handle** (white circles)
3. Cursor changes to resize arrows
4. Drag to adjust size:
   - **Corner handles** = Resize diagonally
   - **Edge handles** = Resize one direction
5. Release to apply

**Resize Handles:**
```
     [N]
[NW]     [NE]
         
[W]      [E]

[SW]     [SE]
     [S]
```

#### **Method C: Manual Entry**
1. **Double-click** on green overlay
2. Popup prompts appear:
   - Enter X coordinate
   - Enter Y coordinate
   - Enter Width
   - Enter Height
3. Enter exact values
4. Click OK
5. Overlay updates to new position/size

### **Step 5: Transform SVG**
6. Once all overlays are correct, click **"✨ Transform SVG"**
7. Tool generates SVG with correct `data-bbox` attributes
8. Download transformed SVG
9. Copy generated SQL

---

## 🎨 Visual Guide

### **Normal State:**
```
┌─────────────────────┐
│ STAGE               │ ← Green label
│ ╔═════════════════╗ │
│ ║   Green Overlay ║ │ ← Semi-transparent green
│ ╚═════════════════╝ │
│ x:304 y:106 w:471..│ ← Black coordinate box
└─────────────────────┘
```

### **Selected State:**
```
┌─────────────────────┐
│ STAGE               │ ← Blue label
│ ◉─────────────────◉ │ ← Resize handles visible
│ │   Blue Overlay  │ │ ← Blue with glow
│ ◉─────────────────◉ │
│ x:304 y:106 w:471..│
└─────────────────────┘
```

### **Hover State:**
```
┌─────────────────────┐
│ STAGE               │
│ ╔═════════════════╗ │ ← Brighter green
│ ║  Green + Glow   ║ │ ← Shadow effect
│ ╚═════════════════╝ │
└─────────────────────┘
```

---

## 💡 Tips & Best Practices

### **✅ DO:**

1. **Check All Sections**
   - Preview each section's bbox
   - Ensure no overlaps
   - Verify correct positioning

2. **Use Resize Handles First**
   - Easier than manual entry
   - Visual feedback is immediate
   - Natural interaction

3. **Double-Click for Precision**
   - When you need exact coordinates
   - For fine-tuning alignment
   - To match specific requirements

4. **Verify After Editing**
   - Click "Preview" again after changes
   - Ensure overlays still look correct
   - Check coordinate values in section list

### **❌ DON'T:**

1. **Don't Create Overlapping Boxes**
   ```
   ❌ BAD:
   [FANPIT Overlay]
              [MVP Overlay]  ← Overlaps with FANPIT
   ```

2. **Don't Make Box Too Small**
   ```
   ❌ BAD:
   ┌────────────────┐
   │  STAGE         │
   │   [tiny box]   │ ← Too small, hard to click
   └────────────────┘
   ```

3. **Don't Forget to Preview**
   - Always check before transforming
   - Visual verification is essential
   - Prevents database errors

---

## 🔧 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Click** | Select overlay |
| **Drag** | Move overlay |
| **Double-Click** | Manual edit |
| **Drag Handle** | Resize |
| **ESC** | Deselect (future) |

---

## 🐛 Troubleshooting

### **Issue: Overlay not visible**
**Solution:** 
- Check if section was detected
- Verify bbox values are not 0
- Ensure SVG loaded correctly

### **Issue: Can't drag overlay**
**Solution:**
- Click on overlay first (not handles)
- Make sure you're not in resize mode
- Try refreshing the page

### **Issue: Coordinates not updating**
**Solution:**
- Check browser console for errors
- Verify parsedData exists
- Try re-uploading SVG

### **Issue: Overlays in wrong position**
**Solution:**
- This means bbox calculation was wrong
- Use the editor to fix positions
- Or manually extract from SVG

---

## 📊 Workflow Example

### **Scenario: Fixing MVP Section**

**Step 1: Initial State**
```
Tool calculated: MVP at (246, 246, 724, 724)
Visual preview shows: Overlay covers wrong area!
```

**Step 2: Adjust Position**
```
1. Click "Preview Bounding Boxes"
2. See MVP overlay is too low and too large
3. Click MVP overlay (turns blue)
4. Drag to correct position (555, 332)
```

**Step 3: Adjust Size**
```
5. Drag SE corner handle to resize
6. Adjust to width=416, height=238
7. Check coordinates: x:555 y:332 w:416 h:238 ✓
```

**Step 4: Verify**
```
8. MVP overlay now perfectly covers the section
9. No overlap with FANPIT or VVIP
10. Click "Transform SVG"
```

**Step 5: Complete**
```
11. Download transformed SVG
12. Copy SQL with correct coordinates:
    bbox_x = 555
    bbox_y = 332.897
    bbox_width = 416
    bbox_height = 238
```

---

## 🎯 Testing Checklist

After editing, verify:

- [ ] All sections have green overlays
- [ ] Overlays positioned correctly on visual elements
- [ ] No overlapping between sections
- [ ] Coordinate values look reasonable
- [ ] Section list updated with new values
- [ ] Transformed SVG downloads successfully
- [ ] SQL generated with correct bbox values

---

## 🚀 Advanced Tips

### **Tip 1: Align Multiple Sections**
If sections should align horizontally/vertically:
1. Note X or Y coordinate of first section
2. Manually edit others to match
3. Ensures perfect alignment

### **Tip 2: Quick Reset**
If you mess up:
1. Click "Upload New SVG"
2. Re-upload same file
3. Start fresh

### **Tip 3: Screenshot for Reference**
Take a screenshot of correct preview:
1. Helps when creating similar events
2. Reference for future layouts
3. Documentation for team

---

## 📖 Related Documentation

- **Main Guide:** `tools/README.md`
- **Quick Start:** `tools/QUICK_START.md`
- **Bbox Fix:** `BBOX_FIX_SUMMARY.md`

---

## ✅ Summary

**The visual bbox editor solves the problem of incorrect bounding boxes by:**

1. ✅ **Showing exactly where clicks will be detected**
2. ✅ **Allowing visual adjustment with drag & resize**
3. ✅ **Providing manual entry for precision**
4. ✅ **Live updating coordinates**
5. ✅ **Preventing overlaps and misalignment**

**Result: Correct coordinates every time!** 🎉

---

**Updated:** October 27, 2025  
**Version:** 2.0.0 (with visual editor)  
**Status:** ✅ Production Ready

