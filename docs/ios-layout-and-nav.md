# iPhone layout & navigation — the rules these apps are built to

Researched 2026-09-16 from Apple's own material (Adopting Liquid Glass, the WWDC25
"Build a UIKit app with the new design" session) and the iOS design-guideline write-ups.
Every number below is a rule we follow in code, not an opinion.

## 1. The screen is smaller than the canvas

The build target is **Expo SDK 57** on the smallest realistic iPhone: 375 × 667 pt
(iPhone SE). Everything must work there first; a layout that only fits a 6.9" Pro Max is a
bug we ship to the people with the cheapest phones.

Budgets that follow from 667 pt tall, minus the top inset (~20 pt on SE, ~59 pt on a
Dynamic Island phone) and the bottom inset:

| Zone | Budget | Rule |
|---|---|---|
| Header | ≤ 96 pt | title + one line of meta, never a paragraph |
| Primary action | must be **above 590 pt** from the top of content | measured failure: our Begin button sat at y=872 on an 844-point screen, so the only visible control was an inert circle |
| Content beside a tab bar | ≥ 49 pt clear of it | iOS 26 tab bars float **over** content, so a scroll view needs bottom padding = bar height + home-indicator inset |
| One screen of content | 3 ± 1 decisions | more than that and nobody scrolls to the action |

## 2. Safe areas are non-negotiable, and they moved in iOS 26

- **Top**: the Dynamic Island / notch zone. Content must sit below `insets.top`; on iOS 26
  Apple *wants* scrolling content to run under the status bar with a translucent blur, but
  a control must never be under it.
- **Bottom**: the home indicator owns a permanently reserved **21 pt band** — no fixed
  element, button or gesture target may live in it. Anything tappable needs
  `insets.bottom` or more of clearance.
- Implementation: `useSafeAreaInsets()` from `react-native-safe-area-context` (already a
  dependency). Never hard-code 20/44/59 — those are device-specific.

## 3. Navigation: the iOS 26 tab bar, done natively

- iOS 26's tab bars are **Liquid Glass**: they float above the content, can minimize on
  scroll, and group buttons into glass capsules. Apple's guidance: use the system
  component, don't fake the material.
- Expo SDK 57 ships exactly that: `expo-router/unstable-native-tabs` → `NativeTabs`,
  which maps to `UITabBarController` on iOS, Material tabs on Android, and has a web
  implementation (`NativeTabsView.web.js`) so the same layout works in our browser
  preview. That is why the wellness app uses it instead of a hand-rolled bar.
- **5 tabs maximum.** Beyond five, iOS pushes the rest into a "More" list, which buries
  products. If a category has more screens than that, the extra screens get pushed from a
  tab, not added as tabs (water and japa are pushed from the Habits tab for this reason).
- Every tab needs: a label, an SF Symbol (`Icon sf=`), and a distinct job. Two tabs that
  do the same thing are a design failure, and also a store-review risk.

## 4. Touch, eyes and thumbs

- **44 × 44 pt minimum** tap target for anything interactive (Apple's rule; inline links in
  prose are the accepted exception).
- Thumb reach: the bottom third is comfortable, the top corners are not. Primary actions
  live in the bottom third — which is also why a floating tab bar is a good place for the
  most-used items.
- Body text ≥ 16 pt with a line height ≥ 1.4; the design system's scale already satisfies
  this, so screens must not invent sizes.
- Contrast: dark mode is a requirement, not a theme option (this is why the three screens
  whose dark captures were byte-identical to light are a defect, not cosmetics).

## 5. Behaviour that is always expected, and always forgotten

1. **Never leave the user without feedback**: a wait shows progress and an elapsed time.
2. **Never trap them**: a long press, a swipe or a hidden gesture as the *only* way out.
3. **Respect the interrupts**: coming back from a phone call must not restart a session.
   (Sessions keep state on the device, so a reload resumes with the counters intact.)
4. **Keyboard**: a form pushed by the keyboard scrolls; the action button stays visible.
5. **No dead ends**: every screen has a way back — the native tab bar or the stack header.

## 6. What this means for the wellness apps, concretely

- One **Wellness** app with 5 native tabs (Breathe · Stretch · Walk · Habits · Sleep), not
  five separate store listings: Apple's guideline 4.3 rejects "multiple Bundle IDs of the
  same app", and five near-identical wellness listings is exactly that pattern.
- Every screen: `paddingTop: insets.top + space.base`, bottom padding for the floating bar,
  a primary action in the bottom third, 44 pt targets, dark mode from `useProductUI`.
- Test target for every screen: **375 × 667**, dark and light, with the tab bar visible.
