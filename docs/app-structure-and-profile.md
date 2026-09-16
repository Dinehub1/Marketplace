# What one app needs: pages, tabs and a nav bar

Researched 2026-09-16, after being told — correctly — that the wellness apps were
one-pagers. Apple's HIG (Tab bars) and a detailed 2026 reading of the iOS 26 design language
are the sources; the numbers below are Apple's, not ours.

## The nav bar rules (iOS 26)

- **2–5 tabs.** More than five and iOS buries the extras behind a **"More"** list. A product
  behind "More" is a product nobody finds, so five is a hard limit, not a preference.
- The bar is **Liquid Glass**, floating above the content, **inset 21pt** from the left,
  right and bottom edges — which is why content needs clearance at the bottom, not just
  padding.
- Labels are **11pt SF**; the selected destination is drawn in the app's brand colour.
- Content **fades out progressively** as it reaches the bar, so nothing is hidden *under*
  it.
- HIG also says: let people customise which tabs they get, and **aim for five or fewer** by
  default if you do.

## The pages a wellness app actually needs

Any app in this category is more than the thing it does. The pattern across the reference
apps (Streaks, Habitify, Calm, Breathwrk — see `docs/wellness-app-reference.md`):

1. **Home / Today** — the one screen that says what to do now, and lists everything else.
   Today is where a person lands; it is a *list*, not a dashboard full of widgets.
2. **The practice** — the big single action. For us: the circle, the routine, the interval
   wheel, the bead, the glass, the wind-down.
3. **Progress** — the charts. Ring against a goal, seven days of bars, a month of dots,
   streak, week-over-week. This is the page that answers "am I getting anywhere?".
4. **Profile** — goals, your data, the small print. Always the same three things.
5. **Secondary practices** — pushed screens, **not** tabs. One tap from Home.

That is 4 tabs if the app has one practice, 5 if two. Our shared build runs:
**Today · Breathe · Stretch · Progress · Profile**, with Walk, Sleep, Water and Japa pushed
from Today.

## What belongs on the Profile page

Derived from what the reference apps put there, minus the parts that need a backend:

| Section | Ours | Why |
|---|---|---|
| Goals | Glasses a day, sessions a week | The only settings that move the numbers elsewhere, so they are the only ones offered |
| Your data | A count of what is stored, and delete | A tracker that stores on-device must be able to say what it stores and remove it |
| Not built yet | Reminders, Health, widget, watch, listed and named | A dead switch is worse than an absent feature |
| About | Version, what the app is, and what it is not | The "not a medical device" line belongs somewhere findable |
| Account | Deliberately absent | There is no server, so there is nothing to sign into |

## What we changed

- **Before**: one long scroll per practice. No charts, no settings, no way to see a week.
- **Now**: five tabs with the native iOS 26 bar, a Progress page (family table + ring +
  7-day bars + 30-day dots, switchable per practice), a Profile page whose goals are read by
  the pages that draw them, and four practices as pushed screens.
- **Verified**: the five tabs render on every page at 375×667; tapping "4 glasses" on Profile
  makes Water read "of 4 glasses" and moves the ring on Progress; Walk and Sleep still render
  with a "‹ Today" back control (a screen with no way out is a dead end).

## Rules this build follows, so a future page does not break the pattern

1. A new practice is a **pushed screen listed on Today**, never a sixth tab.
2. Anything that changes a number on another page is a **setting on Profile**, read from the
   one settings store — never a second copy of the value.
3. A page that has no data says so in words ("No sessions yet — the first bar is the hard
   one"), instead of drawing an empty chart.
4. Every page carries a way back. The tab bar is not a substitute for a back control on a
   pushed screen.
