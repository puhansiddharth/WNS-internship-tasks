import { Injectable, signal, computed } from '@angular/core';
import { onCLS, CLSMetric } from 'web-vitals';

export interface ShiftEntrySummary {
  startTime: number;
  value: number;
  hadRecentInput: boolean;
  sourceElements: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ClsService {
  /** Page-level CLS value reported directly by official web-vitals */
  readonly pageScore = signal<number>(0);
  readonly pageRating = signal<'good' | 'needs-improvement' | 'poor'>('good');
  readonly pageFormattedScore = computed(() => this.pageScore().toFixed(4));
  readonly hasMeasured = signal<boolean>(false);

  /** Bad CLS demo score */
  readonly badScore = signal<number>(0);
  readonly badRating = signal<'good' | 'needs-improvement' | 'poor'>('good');
  readonly badFormattedScore = computed(() => this.badScore().toFixed(4));

  /** Fixed CLS demo score */
  readonly fixedScore = signal<number>(0);
  readonly fixedRating = signal<'good' | 'needs-improvement' | 'poor'>('good');
  readonly fixedFormattedScore = computed(() => this.fixedScore().toFixed(4));

  /** All shift entries captured in this page session */
  readonly shiftEntries = signal<ShiftEntrySummary[]>([]);

  private initialized = false;

  constructor() {
    this.initClsMonitoring();
  }

  private initClsMonitoring(): void {
    if (this.initialized) return;

    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return;
    }

    const supportedTypes = PerformanceObserver.supportedEntryTypes || [];
    if (!supportedTypes.includes('layout-shift')) {
      return;
    }

    this.initialized = true;

    try {
      // Official Google web-vitals onCLS with reportAllChanges: true
      onCLS(
        (metric: CLSMetric) => {
          this.handleClsMetric(metric);
        },
        { reportAllChanges: true }
      );
    } catch (err) {
      console.warn('web-vitals onCLS initialization warning:', err);
    }
  }

  private handleClsMetric(metric: CLSMetric): void {
    this.hasMeasured.set(true);
    this.pageScore.set(metric.value);
    this.pageRating.set(metric.rating);

    // Map raw layout-shift entries
    const summaries: ShiftEntrySummary[] = [];
    let badSum = 0;
    let fixedSum = 0;

    const isBadRoute = typeof window !== 'undefined' && window.location.pathname.includes('bad-cls');
    const isFixedRoute = typeof window !== 'undefined' && window.location.pathname.includes('fixed-cls');

    if (metric.entries && Array.isArray(metric.entries)) {
      for (const entry of metric.entries as any[]) {
        const sources: string[] = [];
        let isBadShift = false;
        let isFixedShift = false;

        if (entry.sources && Array.isArray(entry.sources)) {
          for (const src of entry.sources) {
            if (src.node) {
              const nodeName = src.node.nodeName?.toLowerCase() || 'element';
              const className = src.node.className ? `.${String(src.node.className).split(' ')[0]}` : '';
              const idName = src.node.id ? `#${src.node.id}` : '';
              sources.push(`${nodeName}${idName}${className}`);

              // Check if node is inside bad or fixed demo container
              if (this.isNodeInside(src.node, 'bad-demo-container')) {
                isBadShift = true;
              }
              if (this.isNodeInside(src.node, 'fixed-demo-container')) {
                isFixedShift = true;
              }
            }
          }
        }

        // On isolated routes, attribute all shifts on that page to its demo
        if (isBadRoute) isBadShift = true;
        if (isFixedRoute) isFixedShift = true;

        if (isBadShift) {
          badSum += entry.value;
        }
        if (isFixedShift) {
          fixedSum += entry.value;
        }

        summaries.push({
          startTime: Math.round(entry.startTime),
          value: Number(entry.value.toFixed(4)),
          hadRecentInput: !!entry.hadRecentInput,
          sourceElements: sources
        });
      }
    }

    this.shiftEntries.set(summaries);

    if (isBadRoute) {
      this.badScore.set(metric.value);
      this.badRating.set(metric.rating);
    } else if (isFixedRoute) {
      this.fixedScore.set(metric.value);
      this.fixedRating.set(metric.rating);
    } else {
      // Side-by-side dashboard attribution
      if (badSum > 0) {
        this.badScore.set(Number(badSum.toFixed(4)));
        this.badRating.set(this.computeRating(badSum));
      }
      if (fixedSum > 0) {
        this.fixedScore.set(Number(fixedSum.toFixed(4)));
        this.fixedRating.set(this.computeRating(fixedSum));
      }
    }
  }

  private isNodeInside(node: Node, containerId: string): boolean {
    if (typeof document === 'undefined') return false;
    const container = document.getElementById(containerId);
    if (!container) return false;
    return container.contains(node);
  }

  public computeRating(val: number): 'good' | 'needs-improvement' | 'poor' {
    if (val > 0.25) return 'poor';
    if (val > 0.10) return 'needs-improvement';
    return 'good';
  }

  /**
   * Resets local signals (e.g. for re-running in-place).
   */
  public resetLocalScores(): void {
    this.hasMeasured.set(false);
    this.badScore.set(0);
    this.badRating.set('good');
    this.fixedScore.set(0);
    this.fixedRating.set('good');
    this.shiftEntries.set([]);
  }

  /**
   * Performs an authentic browser page reload.
   * This resets Chromium's performance observer timeline and onCLS session window to a genuine 0.
   */
  public reloadPage(targetUrl?: string): void {
    if (typeof window !== 'undefined') {
      if (targetUrl) {
        window.location.href = targetUrl;
      } else {
        window.location.reload();
      }
    }
  }
}
