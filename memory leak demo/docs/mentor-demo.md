# Mentor Demonstration Guide: Angular Memory Leak Lab

This document contains a structured presentation guide, a 3-minute live script, an evidence checklist, and answers to common questions your internship mentor may ask.

---

## 1. Problem Statement

In Single Page Applications (SPAs) built with Angular, views and components are dynamically created and destroyed as users interact with the UI or navigate between routes. When a component is destroyed, developers often assume the component and its associated data are automatically garbage collected.

However, if a component registers event listeners on global browser objects like `window` or `document` and fails to clean them up in `ngOnDestroy()`, the global object retains a reference to the listener callback and its closure scope (including the component instance and all its properties).

Over time, repeated navigation or modal openings cause memory consumption to grow unbounded, leading to UI stuttering, battery drain, and eventual browser tab crashes.

---

## 2. Root Cause Analysis

### The V8 Garbage Collection Root
In V8 (Chrome's JavaScript engine), garbage collection is based on **Reachability from GC Roots**:
1. The `window` object is the top-level global context and represents a permanent GC Root that is never collected while the tab is open.
2. When calling `window.addEventListener('resize', this.windowResizeHandler)`, the browser adds that function to its internal event listener registry attached to `window`.
3. In JavaScript, functions retain a reference to the lexical environment in which they were created (their **closure scope** `[[Scopes]]`).
4. Because the handler is an arrow function or bound method on the component, its closure retains the `this` reference pointing to the component instance.
5. In turn, `this` holds properties such as large datasets, buffers, or service references.

### Why DOM Removal Fails to Free Memory
When Angular evaluates `@if (false)` or destroys a route view:
- Angular removes the component's HTML elements from the browser DOM.
- Angular executes `ngOnDestroy()`.
- **However**, the JavaScript engine cannot reclaim the component's heap memory because a strong path of references exists from the GC Root (`window` &rarr; listener &rarr; component instance).

---

## 3. Incorrect (Leaking) Implementation

```typescript
// src/app/components/leaking-demo/leaking-demo.component.ts
@Component({
  selector: 'app-leaking-demo',
  ...
})
export class LeakingDemoComponent implements OnInit, OnDestroy {
  public readonly payload = new LeakedPayload(this.instanceId);
  private windowResizeHandler!: () => void;

  public ngOnInit(): void {
    // Arrow function captures `this`
    this.windowResizeHandler = () => {
      this.localResizeEventsCount.update(c => c + 1);
      this.logger.addLog('RESIZE_EVENT', ...);
    };

    // Global listener registered
    window.addEventListener('resize', this.windowResizeHandler);
  }

  public ngOnDestroy(): void {
    // ❌ FATAL OMISSION:
    // window.removeEventListener is never called!
    // The window object continues to hold this.windowResizeHandler.
  }
}
```

---

## 4. Correct (Fixed) Implementation

```typescript
// src/app/components/fixed-demo/fixed-demo.component.ts
@Component({
  selector: 'app-fixed-demo',
  ...
})
export class FixedDemoComponent implements OnInit, OnDestroy {
  public readonly payload = new CleanPayload(this.instanceId);
  private windowResizeHandler!: () => void;

  public ngOnInit(): void {
    // 1. Store the exact function reference
    this.windowResizeHandler = () => {
      this.localResizeEventsCount.update(c => c + 1);
      this.logger.addLog('RESIZE_EVENT', ...);
    };

    // 2. Register listener
    window.addEventListener('resize', this.windowResizeHandler);
  }

  public ngOnDestroy(): void {
    // ✅ THE FIX:
    // Unregister the exact same function reference
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
    }
    // Result: Reference from window is broken.
    // The component and its CleanPayload are now unreachable and collectible.
  }
}
```

---

## 5. Live Demonstration Procedure

| Step | Action | What to Point Out to Mentor |
| :--- | :--- | :--- |
| **1. Overview** | Open `http://localhost:4200` | Show the dashboard: Leaking column on left, Fixed on right, Real-time Diagnostic Terminal below. |
| **2. Leaking Cycle** | Click **⚡ Cycle 5x** on the Leaking Component | 5 instances are created and unmounted. Point out DOM status shows `○ Unmounted (Destroyed)`. |
| **3. Trigger Resize** | Click **📐 Trigger Window Resize Event** | **Look at the logs:** 5 zombie callbacks fire simultaneously (`[LeakingComponent #1]`, `#2`, `#3`, etc.). Explain that these dead components are still executing code in the background! |
| **4. Fixed Cycle** | Click **⚡ Cycle 5x** on the Fixed Component | 5 instances are created and destroyed. |
| **5. Trigger Resize** | Click **📐 Trigger Window Resize Event** | **Look at the logs:** Zero callbacks fire from destroyed fixed instances. The listener was cleanly detached in `ngOnDestroy()`. |
| **6. DevTools Proof** | Open Chrome DevTools &rarr; Memory &rarr; Heap Snapshot | Filter for `LeakedPayload` (5 instances remain) vs `CleanPayload` (0 instances remain after clicking the trash can icon). |

---

## 6. Evidence Checklist

Before submitting to your mentor, verify you can demonstrate each of these:

- [x] **Compile and Run**: Application compiles with `ng build` and runs without runtime errors on `http://localhost:4200`.
- [x] **Automated Tests**: All 16 unit tests pass with `npm test`.
- [x] **Zombie Callback Proof**: Dispatched resize events invoke callbacks on unmounted leaking components.
- [x] **Clean Detachment Proof**: Dispatched resize events do NOT invoke callbacks on unmounted fixed components.
- [x] **Heap Snapshot Proof**: DevTools Heap Snapshot shows retained instances of `LeakedPayload` rooted at `window`, and 0 instances of `CleanPayload`.
- [x] **WeakRef & FinalizationRegistry**: Real-time diagnostic table confirms leaking instances remain pinned while clean instances are eligible for garbage collection.

---

## 7. 3-Minute Mentor Presentation Script

> **[0:00 - 0:45] Introduction & The Problem**
> "Good morning/afternoon! Today I want to demonstrate a classic yet critical performance defect in Angular SPAs: **memory leaks caused by uncleaned global event listeners**.
>
> In Angular, when a component is conditionally removed from the screen, developers often assume it is destroyed and its memory freed. However, Angular only manages the DOM and its own component tree. It does not manage global JavaScript references. If a component attaches an event listener to the global `window` object and doesn't remove it, that component is permanently leaked in memory."

> **[0:45 - 1:45] Live Demonstration of the Bug and the Fix**
> "Here on the screen is our **Angular Memory Leak Lab**.
>
> On the left, we have `LeakingDemoComponent`. I will click 'Cycle 5x' to simulate opening and closing this view five times. Notice that the DOM status is now 'Unmounted'.
>
> Now, let's trigger a window resize. In the activity terminal below, you can see **five zombie callbacks** firing simultaneously. Even though these components are completely detached from the DOM, their listeners are still alive in the browser, burning CPU cycles and retaining memory.
>
> On the right, we have `FixedDemoComponent`. I will cycle it five times as well. When I trigger a resize now, notice that **no callbacks fire**. The fixed component used `ngOnDestroy()` to cleanly execute `window.removeEventListener()`."

> **[1:45 - 2:30] Proof in Chrome DevTools Memory Panel**
> "To prove that the physical memory was actually reclaimed and not just silenced:
>
> Each component holds an identifiable payload of 3,000 items. When we take a Heap Snapshot in Chrome DevTools and search for `LeakedPayload`, we see all five unmounted instances still held in memory. In the Retainers panel, we can trace the reference chain directly back to `window.addEventListener`.
>
> Conversely, when we search for `CleanPayload`, there are **zero instances** in the heap. The garbage collector successfully reclaimed every single one because the reference was cleanly severed."

> **[2:30 - 3:00] Conclusion & Best Practices**
> "In summary:
> 1. Unmounting a component from the DOM is not the same as garbage collecting it.
> 2. Any resource registered outside Angular's view hierarchy—such as window listeners, document events, intervals, or global RxJS subscriptions—must be explicitly torn down in `ngOnDestroy()` or using `DestroyRef`.
>
> Thank you! I welcome any questions."

---

## 8. Potential Mentor Questions & Beginner-Friendly Answers

### Q1: "Why does an arrow function in `addEventListener` retain the entire component?"
**Answer:**
"In JavaScript, closures capture their lexical scope. An arrow function declared inside a component method captures `this` (the component instance). As long as `window` holds a reference to that callback in its event registry, the closure scope cannot be collected, which keeps `this` and all its attached properties alive."

### Q2: "Why couldn't you just pass an anonymous function like `window.removeEventListener('resize', () => ...)`?"
**Answer:**
"`removeEventListener()` requires the **exact same function reference** that was passed to `addEventListener()`. If you write `() => ...` inside `removeEventListener`, it creates a new function object in memory with a different reference, so the browser doesn't remove the original listener."

### Q3: "Does RxJS have this same problem?"
**Answer:**
"Yes, exactly! If a component subscribes to a global singleton service's RxJS `Observable` without unsubscribing, the Subject holds an array of observers referencing the component. That's why Angular developers use `takeUntilDestroyed()`, `AsyncPipe`, or `Subscription.unsubscribe()` in `ngOnDestroy()`."

### Q4: "Why do we need DevTools Heap Snapshots if we can already see zombie callbacks in the console?"
**Answer:**
"A log or callback execution only proves that a function was called. It does not prove how much memory is retained, whether child data structures are trapped, or whether other objects were collected. Heap snapshots provide scientific, verifiable proof of object count, shallow size, retained size, and the exact retaining path back to GC roots."

### Q5: "What is `FinalizationRegistry` and how does it help?"
**Answer:**
"`FinalizationRegistry` is a modern ECMAScript API that requests a callback after an object has been garbage-collected. We use it alongside `WeakRef` as a development diagnostic to track when instances get reclaimed without holding a strong reference ourselves."
