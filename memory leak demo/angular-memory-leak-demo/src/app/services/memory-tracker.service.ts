import { Injectable, signal, inject } from '@angular/core';
import { LoggerService } from './logger.service';

export interface TrackedInstanceInfo {
  id: number;
  type: 'leaking' | 'fixed';
  label: string;
  isMountedInDom: boolean;
  listenerActive: boolean;
  isWeakRefAlive: boolean;
  isFinalizedByGC: boolean;
  registeredAt: string;
  finalizedAt?: string;
  weakRef?: WeakRef<object>;
}

@Injectable({
  providedIn: 'root'
})
export class MemoryTrackerService {
  private readonly logger = inject(LoggerService);

  private finalizationRegistry?: FinalizationRegistry<{ id: number; type: 'leaking' | 'fixed'; label: string }>;
  private trackedRecords: Map<string, TrackedInstanceInfo> = new Map();

  // Reactive signal for UI rendering
  public readonly records = signal<TrackedInstanceInfo[]>([]);

  // Statistics
  public readonly totalLeakedRegistered = signal(0);
  public readonly totalFixedRegistered = signal(0);
  public readonly totalFinalizedByGC = signal(0);

  constructor() {
    this.initFinalizationRegistry();
  }

  private initFinalizationRegistry(): void {
    if (typeof FinalizationRegistry !== 'undefined') {
      this.finalizationRegistry = new FinalizationRegistry(heldValue => {
        const key = `${heldValue.type}-${heldValue.id}`;
        const record = this.trackedRecords.get(key);
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (record) {
          record.isFinalizedByGC = true;
          record.isWeakRefAlive = false;
          record.finalizedAt = timeStr;
          this.totalFinalizedByGC.update(c => c + 1);
          this.syncRecords();
        }

        this.logger.addLog(
          'GC_DIAGNOSTIC',
          'FinalizationRegistry',
          `♻️ Object reclaimed by Garbage Collector: ${heldValue.label} (#${heldValue.id})`
        );
      });
    } else {
      this.logger.addLog('SYSTEM', 'MemoryTracker', 'FinalizationRegistry is not supported in this browser.');
    }
  }

  /**
   * Registers an object (component or payload) with WeakRef and FinalizationRegistry.
   * This does NOT create a strong reference, ensuring the tracker itself never causes a memory leak.
   */
  public register(type: 'leaking' | 'fixed', id: number, target: object, label: string): void {
    const key = `${type}-${id}`;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let weakRef: WeakRef<object> | undefined;
    if (typeof WeakRef !== 'undefined') {
      weakRef = new WeakRef(target);
    }

    if (this.finalizationRegistry) {
      this.finalizationRegistry.register(target, { id, type, label });
    }

    const info: TrackedInstanceInfo = {
      id,
      type,
      label,
      isMountedInDom: true,
      listenerActive: true,
      isWeakRefAlive: true,
      isFinalizedByGC: false,
      registeredAt: timeStr,
      weakRef
    };

    this.trackedRecords.set(key, info);

    if (type === 'leaking') {
      this.totalLeakedRegistered.update(c => c + 1);
    } else {
      this.totalFixedRegistered.update(c => c + 1);
    }

    this.syncRecords();
  }

  /**
   * Called when a component unmounts (ngOnDestroy).
   */
  public markUnmounted(type: 'leaking' | 'fixed', id: number, listenerStillAttached: boolean): void {
    const key = `${type}-${id}`;
    const record = this.trackedRecords.get(key);
    if (record) {
      record.isMountedInDom = false;
      record.listenerActive = listenerStillAttached;
      this.syncRecords();
    }
  }

  /**
   * Inspects all WeakRefs to check if objects are still alive in memory.
   * (Supplementary diagnostic; GC runs nondeterministically in JavaScript engines).
   */
  public refreshLiveStatus(): void {
    let aliveCount = 0;
    let deadCount = 0;

    for (const record of this.trackedRecords.values()) {
      if (record.weakRef) {
        const deref = record.weakRef.deref();
        const isAlive = deref !== undefined;
        record.isWeakRefAlive = isAlive;
        if (isAlive) {
          aliveCount++;
        } else {
          deadCount++;
        }
      }
    }

    this.syncRecords();
    this.logger.addLog(
      'GC_DIAGNOSTIC',
      'MemoryTracker',
      `Diagnostic status refresh: ${aliveCount} instance(s) still referenced in memory, ${deadCount} cleared by GC.`
    );
  }

  public resetTracking(): void {
    this.trackedRecords.clear();
    this.totalLeakedRegistered.set(0);
    this.totalFixedRegistered.set(0);
    this.totalFinalizedByGC.set(0);
    this.syncRecords();
    this.logger.addLog('SYSTEM', 'MemoryTracker', 'Memory tracker records reset.');
  }

  private syncRecords(): void {
    // Return array sorted by latest instance first
    this.records.set(Array.from(this.trackedRecords.values()).reverse());
  }
}
