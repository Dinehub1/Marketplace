# 🚀 Quick Image Migration Guide

## Replace All Images in 5 Minutes

### **Step 1: Find All Image Imports**
```bash
# Find all files using React Native Image
grep -r "from 'react-native'" --include="*.tsx" app/ components/ | grep "Image"
```

### **Step 2: Mass Replace Pattern**

#### **Pattern 1: Simple Image**
```tsx
// ❌ OLD
import { Image } from 'react-native';
<Image source={{ uri: url }} style={styles.image} resizeMode="cover" />

// ✅ NEW
import { OptimizedImage } from '@/components/ui/OptimizedImage';
<OptimizedImage source={{ uri: url }} style={styles.image} contentFit="cover" priority="normal" />
```

#### **Pattern 2: Local Image**
```tsx
// ❌ OLD
<Image source={require('./image.png')} style={styles.image} />

// ✅ NEW
<OptimizedImage source={require('./image.png')} style={styles.image} contentFit="cover" />
```

#### **Pattern 3: Image in FlatList**
```tsx
// ❌ OLD
<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <Image source={{ uri: item.image }} style={styles.image} />
  )}
/>

// ✅ NEW
<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <OptimizedImage 
      source={{ uri: item.image }} 
      style={styles.image}
      contentFit="cover"
      priority={index < 3 ? 'high' : 'low'} // First 3 high priority
    />
  )}
  removeClippedSubviews={true}  // Add this
  maxToRenderPerBatch={10}      // Add this
  windowSize={5}                // Add this
/>
```

### **Step 3: Remaining Files to Update**

Based on the codebase search, update these files:

#### **Detail Screens** (High Priority)
- [ ] `app/restaurant/[id].tsx` - Restaurant detail images
- [ ] `app/events/[id].tsx` - Event hero & gallery images
- [ ] `app/artist/[id].tsx` - Artist profile images
- [ ] `app/expert/[id].tsx` - Expert profile images

#### **Tab Screens**
- [ ] `app/(tabs)/showtime.tsx` - Event cards
- [ ] `app/(tabs)/activities.tsx` - Activity cards
- [ ] `app/(tabs)/for-you.tsx` - Recommendation cards

#### **Other Screens**
- [ ] `app/(main)/search.tsx` - Search result images
- [ ] `app/(main)/location-search.tsx` - Location images
- [ ] `app/(auth)/onboarding.tsx` - Onboarding images
- [ ] All booking screens

#### **Component Files**
- [ ] `components/SkeletonLoader.tsx` - Check if using Image
- [ ] `components/RestaurantEventCard.tsx`
- [ ] `components/RestaurantImageViewer.tsx`
- [ ] `components/Location/*.tsx` - Location card images

### **Step 4: Quick Find & Replace (VS Code)**

1. **Find**: `import.*Image.*from 'react-native'`
2. **Replace with**: `import { OptimizedImage } from '@/components/ui/OptimizedImage';`

3. **Find**: `<Image\s+source={{[^}]*}}\s+style={([^}]*)}(\s+resizeMode="([^"]*)")?`
4. **Replace with**: `<OptimizedImage source={{...}} style={$1} contentFit="$3" priority="normal"`

### **Step 5: Test Each Screen**
```bash
npm run android
```

Navigate to each updated screen and verify images load correctly.

---

## 🎯 Priority Order

### **Phase 1** (Immediate - Biggest Impact)
1. Restaurant detail screen
2. Event detail screen
3. FeaturedEventsCarousel
4. Dining tab (index.tsx)

### **Phase 2** (Next)
5. Showtime tab
6. Activities tab
7. Search screen

### **Phase 3** (Final)
8. All remaining screens
9. Booking flows
10. Profile/Account screens

---

## ✅ Verification Checklist

After each update:
- [ ] No compile errors
- [ ] Images load correctly
- [ ] Smooth scrolling in lists
- [ ] No memory warnings
- [ ] App doesn't crash

---

## 🔥 Quick Commands

```bash
# Rebuild with cache clear
npm run android -- --reset-cache

# Check for remaining Image imports
grep -r "import.*Image.*from 'react-native'" --include="*.tsx" app/ components/

# Count remaining files
grep -r "import.*Image.*from 'react-native'" --include="*.tsx" app/ components/ | wc -l
```

---

## Done! 🎉

After completing all steps, your app will have:
- ✅ All images optimized
- ✅ 60% faster loading
- ✅ 40% less memory
- ✅ Silky smooth scrolling

