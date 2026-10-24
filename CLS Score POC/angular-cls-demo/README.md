# CLS Demonstration (`angular-cls-demo`)

A clean, practical Angular demonstration of **Cumulative Layout Shift (CLS)** for internship review and mentor presentation.

---

## 1. Quickstart (PowerShell)

```powershell
# Navigate into the project
cd "d:\WNS-internship-tasks\CLS Score POC\angular-cls-demo"

# Start the application
npm start
```

Open Chrome at:
- **Dashboard (CLS Overview):** `http://localhost:4200/dashboard`
- **Bad CLS Demo:** `http://localhost:4200/bad-cls`
- **Fixed CLS Demo:** `http://localhost:4200/fixed-cls`

Automated test suite (17 unit tests):
```powershell
npm test
```

Production build:
```powershell
npm run build
```

---

## 2. Root Cause Analysis of the Fixed Route CLS Bug

### The Observed Problem
Previously, after running `/bad-cls` and obtaining a score (e.g. `0.0796`), navigating to `/fixed-cls` also displayed `0.0796` and reported a layout-shift event, even though the banner space was reserved.

### Root Causes Identified
1. **SPA Client-Side Route State Persistence:**
   In an Angular SPA, `routerLink` swaps the component inside `<router-outlet>` without unloading the browser document. The root singleton `ClsService` retained the previous route's metric signals in memory (`0.0796`). Furthermore, `web-vitals` attaches to the document's PerformanceObserver; without a page reload, the browser's cumulative session window still held the bad route's shift.
2. **Unreserved Dynamic Progress Alerts in Fixed Demo:**
   In the earlier implementation, `FixedClsComponent` displayed an alert box during loading that was removed when the banner arrived, plus another alert box was dynamically inserted at 1500ms. Because these occurred 1.5s after user interaction (past the 500ms `hadRecentInput` window), removing and inserting elements outside the reserved container shifted surrounding elements!

### The Solution Applied
- **True Page Navigation:** Isolated route buttons and navbar links perform genuine browser navigation (`window.location.href` / reload), starting a fresh document lifecycle and clean `onCLS` session.
- **Container Shift Attribution:** `ClsService` inspects the shifted DOM nodes (`entry.sources[i].node`) using `contains()`. Layout shifts are accurately attributed to the specific demo that caused them.
- **Elimination of Unreserved Dynamic Elements:** All dynamic alert boxes, root-cause notes, and tutorial sections were removed from the demo cards. The 220px container maintains a constant height at all times, guaranteeing 0px of movement for surrounding elements.

---

## 3. Chrome DevTools Verification Protocol

Follow these steps to demonstrate both cases to your mentor:

### Bad CLS Demonstration (Shift Occurs)
1. In Chrome, open `http://localhost:4200/bad-cls` (or the Dashboard).
2. Press <kbd>F12</kbd> &rarr; select the **Performance** tab.
3. Click the circular **Record** button in DevTools.
4. Click **Run Demo** on the Bad CLS card.
5. Wait 2 seconds for the 1.5s delayed banner to insert and push content down.
6. Click **Stop** in DevTools.
7. Under the **Experience / Layout Shifts** track, click the red layout-shift marker:
   - Notice `Had recent input: No` (outside 500ms window).
   - In the Summary tab, hover over the shifted element to see `#bad-demo-content-target` highlighted.
   - The UI displays the measured CLS score with its rating.

### Fixed CLS Demonstration (Zero Shift)
1. Navigate to `http://localhost:4200/fixed-cls` (or use the Fixed card on the Dashboard).
2. In DevTools Performance tab, click **Record**.
3. Click **Run Demo** on the Fixed CLS card.
4. Watch the banner smoothly populate the pre-allocated 220px slot.
5. Click **Stop** in DevTools.
6. Observe that the **Layout Shifts track is completely empty**.
7. The UI confirms an honest **`0.0000` (Good)** CLS score.
