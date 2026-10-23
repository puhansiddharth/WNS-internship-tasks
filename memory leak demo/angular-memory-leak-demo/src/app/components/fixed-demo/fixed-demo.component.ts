import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CleanPayload } from '../../models/payload.model';
import { LoggerService } from '../../services/logger.service';
import { MemoryTrackerService } from '../../services/memory-tracker.service';

let globalFixedInstanceCounter = 0;

@Component({
  selector: 'app-fixed-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fixed-demo.component.html',
  styleUrl: './fixed-demo.component.css'
})
export class FixedDemoComponent implements OnInit, OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly memoryTracker = inject(MemoryTrackerService);

  public readonly instanceId: number = ++globalFixedInstanceCounter;
  public readonly createdAt: string = new Date().toLocaleTimeString();

  // Fair comparison payload matching LeakedPayload's size and structure
  public readonly payload: CleanPayload = new CleanPayload(this.instanceId);

  // Diagnostic state
  public isDestroyed = false;
  public readonly localResizeEventsCount = signal(0);
  public readonly currentWindowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 0);

  // Stored reference to the exact event listener function
  private windowResizeHandler!: () => void;

  public ngOnInit(): void {
    this.logger.addLog(
      'LIFECYCLE',
      `FixedDemoComponent #${this.instanceId}`,
      `🌱 [MOUNT] Component #${this.instanceId} initialized. Created CleanPayload with ${this.payload.buffer.length} items.`
    );

    // Register with diagnostic tracker
    this.memoryTracker.register('fixed', this.instanceId, this, `FixedComponent #${this.instanceId}`);

    // =========================================================================
    // THE FIX:
    // 1. Maintain a reference to the exact function passed to addEventListener.
    // 2. In ngOnDestroy(), call window.removeEventListener with that EXACT same reference.
    // 3. This severs the link between global `window` and this component instance.
    // 4. Once Angular unmounts the view and the window listener is removed, no
    //    retaining references remain. V8 GC can now safely collect this component
    //    and its CleanPayload.
    // =========================================================================
    this.windowResizeHandler = () => {
      this.localResizeEventsCount.update(c => c + 1);
      this.currentWindowWidth.set(window.innerWidth);

      if (this.isDestroyed) {
        // Defensive check: This should NEVER happen if the fix works!
        this.logger.addLog(
          'RESIZE_EVENT',
          `FixedComponent #${this.instanceId}`,
          `❌ UNEXPECTED: Callback fired on destroyed FixedComponent #${this.instanceId}!`,
          true
        );
      } else {
        this.logger.addLog(
          'RESIZE_EVENT',
          `FixedComponent #${this.instanceId}`,
          `✅ Active resize listener handled by Component #${this.instanceId} (Window width: ${window.innerWidth}px).`
        );
      }
    };

    window.addEventListener('resize', this.windowResizeHandler);
  }

  public ngOnDestroy(): void {
    this.isDestroyed = true;

    // Remove the exact same handler reference from the global window object
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
    }

    this.logger.addLog(
      'LIFECYCLE',
      `FixedDemoComponent #${this.instanceId}`,
      `🍂 [UNMOUNT] Component #${this.instanceId} destroyed. ✅ window.removeEventListener() called! Retaining reference broken.`
    );

    // Update memory tracker UI indicating component unmounted and listener cleanly detached
    this.memoryTracker.markUnmounted('fixed', this.instanceId, false);
  }
}
