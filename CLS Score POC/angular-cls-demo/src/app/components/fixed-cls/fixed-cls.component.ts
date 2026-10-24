import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClsService } from '../../services/cls.service';

@Component({
  selector: 'app-fixed-cls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-card fixed-card" id="fixed-demo-container">
      <!-- Header -->
      <div class="card-header">
        <div>
          <h2 class="card-title">Fixed CLS — With Reserved Space</h2>
          <p class="card-desc">The banner loads into reserved space without moving the content.</p>
        </div>
        <span class="status-badge" [ngClass]="demoState()">{{ statusText() }}</span>
      </div>

      <!-- Controls & Score Row -->
      <div class="control-row">
        <div class="btn-group">
          <button
            class="btn btn-run"
            (click)="runDemo()"
            [disabled]="demoState() === 'loading' || demoState() === 'loaded'"
          >
            Run Demo
          </button>
          <button
            class="btn btn-reset"
            (click)="resetDemo()"
            [disabled]="demoState() === 'idle'"
          >
            Reset
          </button>
        </div>

        <!-- Small, visible measured CLS score with rating -->
        <div class="score-box" [ngClass]="clsService.fixedRating()">
          <span class="score-label">Measured CLS:</span>
          <span class="score-val">{{ clsService.fixedFormattedScore() }}</span>
          <span class="rating-badge" [ngClass]="clsService.fixedRating()">
            {{ getRatingLabel(clsService.fixedRating()) }}
          </span>
        </div>
      </div>

      <!-- Demo Area -->
      <div class="demo-area">
        <!-- 
          RESERVED SPACE CONTAINER (Height: 220px fixed):
          Pre-allocates space so replacing skeleton with banner produces 0px shift.
        -->
        <div class="reserved-slot">
          <!-- Skeleton Placeholder before banner arrives -->
          <div *ngIf="!showBanner()" class="skeleton-slot" [class.animating]="demoState() === 'loading'">
            <span class="skeleton-icon">🖼️</span>
            <span class="skeleton-text">Reserved Banner Space (220px)</span>
          </div>

          <!-- Dynamic Banner loaded inside reserved slot -->
          <div *ngIf="showBanner()" class="dynamic-banner fixed-banner">
            <div class="banner-tag">SPECIAL ANNOUNCEMENT</div>
            <h3 class="banner-title">⚡ Flash Sale: 50% Off Cloud Hosting!</h3>
            <p class="banner-desc">This banner loaded into pre-allocated 220px space. Content stayed stable.</p>
          </div>
        </div>

        <!-- Content that remains 100% stable -->
        <div class="article-content" id="fixed-demo-content-target">
          <h3 class="article-title">The Critical Importance of Visual Stability</h3>
          <p class="article-body">
            Cumulative Layout Shift (CLS) measures the visual stability of a webpage. When web elements
            shift unexpectedly without user interaction, users often misclick, lose their reading location,
            or submit unintended form actions.
          </p>
          <div class="article-actions">
            <button class="btn btn-article" type="button">Read Full Article</button>
            <button class="btn btn-outline" type="button">Save to Bookmarks</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .fixed-card {
      border-top: 4px solid #10b981;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .card-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }

    .card-desc {
      margin: 0.2rem 0 0 0;
      font-size: 0.86rem;
      color: #64748b;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      white-space: nowrap;
    }

    .status-badge.loading {
      background: #dcfce7;
      color: #15803d;
    }

    .status-badge.loaded {
      background: #dcfce7;
      color: #15803d;
    }

    .control-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .btn-group {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.45rem 0.9rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.84rem;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-run {
      background: #10b981;
      color: #ffffff;
    }

    .btn-run:hover:not(:disabled) {
      background: #059669;
    }

    .btn-reset {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }

    .btn-reset:hover:not(:disabled) {
      background: #e2e8f0;
    }

    /* Score Box */
    .score-box {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 0.84rem;
    }

    .score-box.good {
      border-color: #86efac;
      background: #f0fdf4;
    }

    .score-box.needs-improvement {
      border-color: #fde047;
      background: #fefce8;
    }

    .score-box.poor {
      border-color: #fca5a5;
      background: #fef2f2;
    }

    .score-label {
      font-weight: 600;
      color: #475569;
    }

    .score-val {
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, monospace;
      color: #0f172a;
    }

    .rating-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .rating-badge.good {
      background: #dcfce7;
      color: #15803d;
    }

    .rating-badge.needs-improvement {
      background: #fef3c7;
      color: #b45309;
    }

    .rating-badge.poor {
      background: #fee2e2;
      color: #b91c1c;
    }

    /* Stage */
    .demo-area {
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 0.85rem;
      background: #fafafa;
    }

    /* Strict 220px Reserved Slot */
    .reserved-slot {
      height: 220px;
      margin-bottom: 0.85rem;
      position: relative;
      overflow: hidden;
      border-radius: 6px;
    }

    /* Skeleton Placeholder */
    .skeleton-slot {
      height: 220px;
      box-sizing: border-box;
      background: #f1f5f9;
      border: 2px dashed #cbd5e1;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      color: #64748b;
    }

    .skeleton-slot.animating {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-icon {
      font-size: 1.4rem;
    }

    .skeleton-text {
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
    }

    /* Banner */
    .dynamic-banner {
      height: 220px;
      box-sizing: border-box;
      border-radius: 6px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .fixed-banner {
      background: linear-gradient(135deg, #047857 0%, #10b981 100%);
    }

    .banner-tag {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      background: rgba(0, 0, 0, 0.25);
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      align-self: flex-start;
      margin-bottom: 0.4rem;
    }

    .banner-title {
      margin: 0 0 0.35rem 0;
      font-size: 1.15rem;
      font-weight: 800;
    }

    .banner-desc {
      margin: 0;
      font-size: 0.85rem;
      opacity: 0.95;
    }

    /* Article */
    .article-content {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 1rem;
    }

    .article-title {
      margin: 0 0 0.4rem 0;
      font-size: 1.05rem;
      color: #0f172a;
      font-weight: 700;
    }

    .article-body {
      margin: 0 0 0.85rem 0;
      color: #334155;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .article-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-article {
      background: #0284c7;
      color: #ffffff;
      padding: 0.4rem 0.8rem;
      border-radius: 5px;
      font-size: 0.8rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 0.4rem 0.8rem;
      border-radius: 5px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class FixedClsComponent {
  readonly clsService = inject(ClsService);
  readonly showBanner = signal<boolean>(false);
  readonly demoState = signal<'idle' | 'loading' | 'loaded'>('idle');

  private timerId: any = null;

  statusText(): string {
    const s = this.demoState();
    if (s === 'loading') return 'Banner loading (1.5s)...';
    if (s === 'loaded') return 'Banner loaded';
    return 'Waiting to run';
  }

  getRatingLabel(r: 'good' | 'needs-improvement' | 'poor'): string {
    if (r === 'good') return 'Good';
    if (r === 'needs-improvement') return 'Needs Imp.';
    return 'Poor';
  }

  runDemo(): void {
    if (this.demoState() === 'loading') return;

    this.showBanner.set(false);
    this.demoState.set('loading');

    this.timerId = setTimeout(() => {
      this.showBanner.set(true);
      this.demoState.set('loaded');
    }, 1500);
  }

  resetDemo(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.showBanner.set(false);
    this.demoState.set('idle');
  }
}
