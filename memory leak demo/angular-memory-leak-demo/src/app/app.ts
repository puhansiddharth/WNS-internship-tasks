import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeakingDemoComponent } from './components/leaking-demo/leaking-demo.component';
import { FixedDemoComponent } from './components/fixed-demo/fixed-demo.component';
import { LoggerService } from './services/logger.service';
import { MemoryTrackerService, TrackedInstanceInfo } from './services/memory-tracker.service';
import { LogCategory } from './models/log.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LeakingDemoComponent, FixedDemoComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public readonly logger = inject(LoggerService);
  public readonly memoryTracker = inject(MemoryTrackerService);

  // Active view tab: 'lab' | 'architecture' | 'guide'
  public readonly activeTab = signal<'lab' | 'architecture' | 'guide'>('lab');

  // Component mount states
  public readonly isLeakingMounted = signal(false);
  public readonly isFixedMounted = signal(false);

  // Active log category filter
  public readonly logFilter = signal<LogCategory | 'ALL'>('ALL');

  // Cycle automation state
  public isCycling = false;

  public toggleLeaking(): void {
    this.isLeakingMounted.update(val => !val);
  }

  public toggleFixed(): void {
    this.isFixedMounted.update(val => !val);
  }

  /**
   * Automates cycling (mount -> wait -> unmount) multiple times
   * to quickly create 5 instances for a fast, punchy 3-minute mentor demonstration.
   */
  public async cycleInstances(type: 'leaking' | 'fixed', count = 5): Promise<void> {
    if (this.isCycling) return;
    this.isCycling = true;

    this.logger.addLog('SYSTEM', 'CycleRunner', `Starting automated ${count}x mount/unmount cycle for [${type.toUpperCase()}] component...`);

    for (let i = 0; i < count; i++) {
      if (type === 'leaking') {
        this.isLeakingMounted.set(true);
        await this.delay(120);
        this.isLeakingMounted.set(false);
        await this.delay(80);
      } else {
        this.isFixedMounted.set(true);
        await this.delay(120);
        this.isFixedMounted.set(false);
        await this.delay(80);
      }
    }

    this.isCycling = false;
    this.logger.addLog('SYSTEM', 'CycleRunner', `Completed ${count}x cycle for [${type.toUpperCase()}]. Trigger a resize now to observe behavior!`);
  }

  /**
   * Dispatches a synthetic window resize event so the mentor can observe
   * callbacks without needing to manually resize the browser window.
   */
  public triggerResizeEvent(): void {
    if (typeof window !== 'undefined') {
      this.logger.addLog('SYSTEM', 'DemoController', 'Triggering window resize event (window.dispatchEvent)...');
      window.dispatchEvent(new Event('resize'));
    }
  }

  public checkMemoryStatus(): void {
    this.memoryTracker.refreshLiveStatus();
  }

  public clearLogs(): void {
    this.logger.clearLogs();
  }

  public resetAll(): void {
    this.isLeakingMounted.set(false);
    this.isFixedMounted.set(false);
    this.logger.clearLogs();
    this.memoryTracker.resetTracking();
  }

  public setFilter(filter: LogCategory | 'ALL'): void {
    this.logFilter.set(filter);
  }

  public get filteredLogs() {
    const filter = this.logFilter();
    const logs = this.logger.logs();
    if (filter === 'ALL') return logs;
    return logs.filter(log => log.category === filter);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
