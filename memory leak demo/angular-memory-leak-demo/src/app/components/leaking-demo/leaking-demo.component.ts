import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeakedPayload } from '../../models/payload.model';
import { LoggerService } from '../../services/logger.service';
import { MemoryTrackerService } from '../../services/memory-tracker.service';

let globalLeakingInstanceCounter = 0;

@Component({
  selector: 'app-leaking-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaking-demo.component.html',
  styleUrl: './leaking-demo.component.css'
})
export class LeakingDemoComponent implements OnInit, OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly memoryTracker = inject(MemoryTrackerService);

  public readonly instanceId: number = ++globalLeakingInstanceCounter;
  public readonly createdAt: string = new Date().toLocaleTimeString();

  // Identifiable payload holding memory that will be leaked
  public readonly payload: LeakedPayload = new LeakedPayload(this.instanceId);

  // Diagnostic state
  public isDestroyed = false;
  public readonly localResizeEventsCount = signal(0);
  public readonly currentWindowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Global listener reference that captures `this`
  private windowResizeHandler!: () => void;

  public ngOnInit(): void {
    this.logger.addLog(
      'LIFECYCLE',
      `LeakingDemoComponent #${this.instanceId}`,
      `🌱 [MOUNT] Component #${this.instanceId} initialized. Created LeakedPayload with ${this.payload.buffer.length} items.`
    );

    // Register with diagnostic tracker (tracks via WeakRef without strong retaining reference)
    this.memoryTracker.register('leaking', this.instanceId, this, `LeakingComponent #${this.instanceId}`);

    // =========================================================================
    // THE INTENTIONAL MEMORY LEAK:
    // 1. `window.addEventListener()` attaches a listener to the global window object.
    // 2. The arrow function captures `this` (this component instance and its payload).
    // 3. When this component is unmounted from the DOM, Angular calls ngOnDestroy().
    // 4. BUT ngOnDestroy() DOES NOT remove the listener from `window`!
    // 5. Result: The global window object retains this closure -> retains `this`
    //    -> retains LeakedPayload -> V8 Garbage Collector CANNOT reclaim it!
    // =========================================================================
    this.windowResizeHandler = () => {
      this.localResizeEventsCount.update(c => c + 1);
      this.currentWindowWidth.set(window.innerWidth);

      if (this.isDestroyed) {
        // This callback is firing from a "zombie" instance that was already destroyed by Angular!
        this.logger.addLog(
          'RESIZE_EVENT',
          `LeakingComponent #${this.instanceId}`,
          `⚠️ ZOMBIE CALLBACK! Component #${this.instanceId} is UNMOUNTED, but its window resize listener is STILL RUNNING! Payload marker: "${this.payload.marker}".`,
          true // isZombie
        );
      } else {
        this.logger.addLog(
          'RESIZE_EVENT',
          `LeakingComponent #${this.instanceId}`,
          `Active resize listener fired for Component #${this.instanceId} (Window width: ${window.innerWidth}px).`
        );
      }
    };

    window.addEventListener('resize', this.windowResizeHandler);
  }

  public ngOnDestroy(): void {
    this.isDestroyed = true;

    this.logger.addLog(
      'LIFECYCLE',
      `LeakingDemoComponent #${this.instanceId}`,
      `🍂 [UNMOUNT] Component #${this.instanceId} unmounted from DOM. ❌ BUG: window.removeEventListener() was NOT called! This instance remains pinned in memory.`
    );

    // Update memory tracker UI indicating component unmounted but listener is still active
    this.memoryTracker.markUnmounted('leaking', this.instanceId, true);

    // INTENTIONALLY OMITTED:
    // window.removeEventListener('resize', this.windowResizeHandler);
  }
}
