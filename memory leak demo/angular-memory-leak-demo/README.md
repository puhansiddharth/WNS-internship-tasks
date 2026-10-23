# Angular Memory Leak Lab: Root Cause, Fix, and DevTools Heap Proof

A comprehensive, beginner-friendly Angular laboratory built to demonstrate a real-world memory leak caused by global browser event listeners, explain the JavaScript garbage collection mechanics behind it, implement the Angular lifecycle cleanup fix, and prove memory reclamation using Chrome DevTools Heap Snapshots.

---

## 📑 Table of Contents
1. [Core Concepts](#1-core-concepts)
   - [What is a Memory Leak?](#what-is-a-memory-leak)
   - [What is an Angular Component & Lifecycle?](#what-is-an-angular-component--lifecycle)
   - [What is an Event Listener?](#what-is-an-event-listener)
   - [References & Garbage Collection in V8](#references--garbage-collection-in-v8)
2. [Why the Leaking Version Retains Instances](#2-why-the-leaking-version-retains-instances)
3. [How the Fixed Version Cleans Up Resources](#3-how-the-fixed-version-cleans-up-resources)
4. [Installation & Running Locally](#4-installation--running-locally)
5. [Step-by-Step Live Demonstration Guide](#5-step-by-step-live-demonstration-guide)
6. [Chrome DevTools Heap Snapshot Verification](#6-chrome-devtools-heap-snapshot-verification)
7. [Expected Observations & Limitations](#7-expected-observations--limitations)
8. [Internship Presentation Summary](#8-internship-presentation-summary)

---

## 1. Core Concepts

### What is a Memory Leak?
A **memory leak** occurs when an application allocates memory for objects during execution but fails to release that memory back to the system when those objects are no longer needed. Over time, memory consumption grows monotonically, causing browser lag, slow response times, and eventually tab crashes ("Out of Memory" crashes).

### What is an Angular Component & Lifecycle?
In Angular, a **Component** is the fundamental building block of the user interface. It controls a portion of the screen (its template) and has a managed **lifecycle**:
- **Creation / Mount (`ngOnInit`)**: The component is instantiated and its HTML is inserted into the browser Document Object Model (DOM).
- **Destruction / Unmount (`ngOnDestroy`)**: When conditional blocks like `@if` become false or the user navigates away, Angular tears down the view, removes elements from the DOM, and fires `ngOnDestroy()`.

> **Crucial Insight:** Removing a component from the DOM *does not automatically destroy the underlying JavaScript object* if external references to it still exist.

### What is an Event Listener?
An **event listener** is a function registered with the browser (e.g., via `window.addEventListener('resize', handler)`) that waits for specific events. Because `window` is the top-level global object representing the browser window, it lives for the entire duration of the browser tab.

### References & Garbage Collection in V8
Modern JavaScript engines (like Google Chrome's V8) manage memory automatically using a **Mark-and-Sweep Garbage Collector (GC)**:
1. **GC Roots**: Objects inherently reachable by the engine (e.g., the global `window` object, stack variables).
2. **Reachability**: The GC traces all references starting from the GC roots. Any object that can be reached directly or indirectly is marked as **reachable** ("live").
3. **Sweeping**: Unreachable objects are swept and their memory is freed.

If an unmounted component is still reachable from a GC root (such as `window`), the engine **cannot** collect it, no matter how many times GC runs.

---

## 2. Why the Leaking Version Retains Instances

In `LeakingDemoComponent`:
```typescript
ngOnInit(): void {
  // Arrow function creates a closure capturing `this` (the component instance)
  this.windowResizeHandler = () => {
    this.localResizeEventsCount.update(c => c + 1);
    this.logger.addLog('RESIZE_EVENT', ...);
  };

  // Registers handler on global window
  window.addEventListener('resize', this.windowResizeHandler);
}

ngOnDestroy(): void {
  // ❌ FATAL BUG: Forgot to call window.removeEventListener!
}
```

### The Retaining Chain
```
[GC Root: window]
       │
       ▼ (event listeners table)
[windowResizeHandler closure]
       │
       ▼ (captured scope [[Scopes]]: `this`)
[LeakingDemoComponent instance]
       │
       ▼ (property `payload`)
[LeakedPayload (holds 3,000 array elements ~150 KB)]
```
Even though Angular unmounts the component and removes its DOM elements, the global `window` object retains the closure. Because the closure references `this`, the component and its heavy `LeakedPayload` cannot be garbage collected.

---

## 3. How the Fixed Version Cleans Up Resources

In `FixedDemoComponent`:
```typescript
ngOnInit(): void {
  // 1. Store the exact function reference on the instance
  this.windowResizeHandler = () => {
    this.localResizeEventsCount.update(c => c + 1);
  };

  // 2. Register the listener
  window.addEventListener('resize', this.windowResizeHandler);
}

ngOnDestroy(): void {
  // ✅ THE FIX: Remove the EXACT same function reference upon destroy
  if (this.windowResizeHandler) {
    window.removeEventListener('resize', this.windowResizeHandler);
  }
}
```

### Why the Fix Works
1. Calling `window.removeEventListener('resize', this.windowResizeHandler)` deletes the function entry from the browser's global listener registry.
2. The reference from the GC root (`window`) to the closure is severed.
3. Once Angular unmounts the view and completes change detection, the `FixedDemoComponent` has **zero inbound references**.
4. During the next Garbage Collection cycle, V8 sweeps both `FixedDemoComponent` and `CleanPayload` from heap memory.

---

## 4. Installation & Running Locally

### Prerequisites
- Node.js (v18, v20, or v22 recommended; verified on Node v22.17.1)
- npm (v9+)
- Google Chrome browser (for DevTools profiling)

### Commands
```bash
# Navigate to the project directory
cd angular-memory-leak-demo

# Install dependencies (if not already installed)
npm install

# Run the unit tests (Vitest)
npm test

# Build production bundle
npm run build

# Start local development server
npm start
# or: ng serve
```

Open your browser to: `http://localhost:4200`

---

## 5. Step-by-Step Live Demonstration Guide

Follow these steps for a live presentation to your mentor:

1. **Open the Application**: Navigate to `http://localhost:4200`. You will see the **Angular Memory Leak Lab**.
2. **Exercise the Leaking Component**:
   - In the "Leaking Component" card, click **⚡ Cycle 5x (Open & Close)**.
   - 5 leaking instances will be created and immediately unmounted from the DOM.
   - Note the DOM status reads `○ Unmounted (Destroyed)`.
3. **Trigger Window Resize**:
   - Click the blue **📐 Trigger Window Resize Event** button on the toolbar (or drag your browser window edge).
   - Look at the **Diagnostic Activity Logs** terminal:
     - You will see **5 Zombie Callbacks** fire simultaneously!
     - Instances `#1`, `#2`, `#3`, `#4`, and `#5` all respond to the resize event, even though they were destroyed!
4. **Exercise the Fixed Component**:
   - In the "Fixed Component" card, click **⚡ Cycle 5x (Open & Close)**.
   - 5 fixed instances will be created and destroyed.
5. **Trigger Window Resize Again**:
   - Click **📐 Trigger Window Resize Event**.
   - **Observe:** Zero callbacks fire from the destroyed fixed instances! Only the currently mounted instance (if open) responds.
6. **Check the Memory Retention Table**:
   - Scroll down to the **Object Lifetime & Memory Retention Inspector** table.
   - Note that Leaked instances show `⚠️ LEAKING ON WINDOW` and `⚠️ Referenced in Memory`.
   - Note that Fixed instances show `✅ Detached` and are marked `Eligible for GC`.

---

## 6. Chrome DevTools Heap Snapshot Verification

To provide scientific proof that the JavaScript objects actually remain in physical memory:

1. Open Chrome DevTools (<kbd>F12</kbd> or <kbd>Ctrl + Shift + I</kbd>).
2. Select the **Memory** panel.
3. Choose **Heap snapshot** &rarr; click **Take snapshot** (this is your *Baseline Snapshot 1*).
4. In the app:
   - Click **"Cycle 5x"** on the Leaking Component (ensure it is closed afterwards).
   - In DevTools Memory panel, click the **Collect Garbage** icon (the trash can at the top left) to force a major GC cycle.
   - Click **Take snapshot** (*Snapshot 2*).
   - In the Class filter input at the top, type: `LeakedPayload` or `LeakingDemoComponent`.
   - **Observation:** Exactly **5 instances** remain retained in memory!
   - Click on one of the instances and look at the bottom **Retainers** pane: you will see the retaining path rooted at `window` &rarr; `EventListener`.
5. In the app:
   - Click **"Cycle 5x"** on the Fixed Component (ensure it is closed afterwards).
   - Click the **Collect Garbage** icon (trash can) in DevTools.
   - Click **Take snapshot** (*Snapshot 3*).
   - In the Class filter input, type: `CleanPayload` or `FixedDemoComponent`.
   - **Observation:** Exactly **0 instances** exist! All 5 instances were reclaimed by the V8 Garbage Collector.

---

## 7. Expected Observations & Limitations

| Metric / Tool | Leaking Implementation | Fixed Implementation |
| :--- | :--- | :--- |
| **DOM Element Retention** | Removed from DOM by Angular | Removed from DOM by Angular |
| **Window Resize Listeners** | Persist indefinitely on `window` | Detached during `ngOnDestroy` |
| **Zombie Callbacks** | Fire on every resize ($N$ callbacks) | 0 callbacks once unmounted |
| **Heap Objects After GC** | $N$ instances retained | 0 instances retained |
| **WeakRef / Finalization** | WeakRef remains alive; no finalization | Finalized by engine upon GC |

### Limitations & Caveats
- **Active Callbacks vs Object Retention**: An event callback running proves the listener function is active, but heap retention is verified only when inspecting the object graph in DevTools Heap Snapshots.
- **Garbage Collection Nondeterminism**: In modern V8, garbage collection runs at engine-chosen heuristics. The app's `WeakRef` / `FinalizationRegistry` tracker updates when the browser performs GC. Use DevTools' manual GC trigger (trash can icon) for repeatable instant verification.

---

## 8. Internship Presentation Summary

> **"In Angular, unmounting a component from the DOM only tears down its template view; it does not destroy JavaScript object references held globally.**
>
> In our leaking component, registering a listener on `window` without removing it in `ngOnDestroy()` caused the global window to retain the callback closure, the component instance, and its entire data payload.
>
> In our fixed version, we store the callback reference and call `window.removeEventListener()` inside `ngOnDestroy()`, breaking the retain graph and enabling V8's Garbage Collector to reclaim the memory."
