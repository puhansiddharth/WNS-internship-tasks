import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClsService } from '../../services/cls.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-wrapper">
      <!-- A. Page title -->
      <div class="page-title-section">
        <h2 class="page-title">CLS Overview</h2>
        <p class="page-subtitle">Measuring and improving visual stability</p>
      </div>

      <!-- B. Main CLS score card -->
      <div class="score-card" [ngClass]="clsService.hasMeasured() ? clsService.pageRating() : 'awaiting'">
        <div class="score-card-header">
          <span class="score-card-label">Cumulative Layout Shift</span>
          <span
            *ngIf="clsService.hasMeasured()"
            class="rating-badge"
            [ngClass]="clsService.pageRating()"
          >
            {{ getRatingLabel(clsService.pageRating()) }}
          </span>
        </div>

        <div class="score-display">
          <ng-container *ngIf="clsService.hasMeasured(); else awaitingTpl">
            <span class="score-value">{{ clsService.pageFormattedScore() }}</span>
          </ng-container>
          <ng-template #awaitingTpl>
            <span class="awaiting-text">Awaiting measurement</span>
          </ng-template>
        </div>

        <div class="thresholds-line">
          Good &le; 0.10 | Needs Improvement &le; 0.25 | Poor &gt; 0.25
        </div>
      </div>

      <!-- C. Short explanation -->
      <p class="short-explanation">
        CLS measures unexpected movement of visible page elements. Lower scores indicate better visual stability.
      </p>

      <!-- D. Navigation links -->
      <div class="nav-links-row">
        <button
          type="button"
          class="btn-demo-link btn-bad"
          (click)="navigateTo('/bad-cls')"
        >
          View Bad CLS Demo
        </button>
        <button
          type="button"
          class="btn-demo-link btn-fixed"
          (click)="navigateTo('/fixed-cls')"
        >
          View Fixed CLS Demo
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      max-width: 580px;
      margin: 0 auto;
      padding: 1.5rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* A. Page title */
    .page-title-section {
      text-align: left;
    }

    .page-title {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .page-subtitle {
      margin: 0.25rem 0 0 0;
      font-size: 0.88rem;
      color: #64748b;
    }

    /* B. Main score card */
    .score-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;
    }

    .score-card.good {
      border-left: 4px solid #10b981;
    }

    .score-card.needs-improvement {
      border-left: 4px solid #f59e0b;
    }

    .score-card.poor {
      border-left: 4px solid #ef4444;
    }

    .score-card.awaiting {
      border-left: 4px solid #94a3b8;
    }

    .score-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .score-card-label {
      font-size: 0.88rem;
      font-weight: 600;
      color: #334155;
    }

    .rating-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
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

    .score-display {
      display: flex;
      align-items: baseline;
      padding: 0.25rem 0;
    }

    .score-value {
      font-size: 2.25rem;
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #0f172a;
      line-height: 1;
    }

    .awaiting-text {
      font-size: 1.05rem;
      font-weight: 600;
      color: #64748b;
      font-style: italic;
    }

    .thresholds-line {
      font-size: 0.78rem;
      color: #64748b;
      border-top: 1px solid #f1f5f9;
      padding-top: 0.6rem;
    }

    /* C. Short explanation */
    .short-explanation {
      margin: 0;
      font-size: 0.9rem;
      color: #334155;
      line-height: 1.55;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem 1rem;
    }

    /* D. Navigation links */
    .nav-links-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-demo-link {
      flex: 1;
      min-width: 180px;
      padding: 0.6rem 1rem;
      border-radius: 6px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      text-align: center;
      transition: all 0.15s ease;
    }

    .btn-bad {
      background: #fef2f2;
      color: #991b1b;
      border-color: #fecaca;
    }

    .btn-bad:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }

    .btn-fixed {
      background: #f0fdf4;
      color: #166534;
      border-color: #bbf7d0;
    }

    .btn-fixed:hover {
      background: #dcfce7;
      border-color: #86efac;
    }

    @media (max-width: 480px) {
      .nav-links-row {
        flex-direction: column;
      }
      .btn-demo-link {
        width: 100%;
      }
    }
  `]
})
export class DashboardComponent {
  readonly clsService = inject(ClsService);

  getRatingLabel(rating: 'good' | 'needs-improvement' | 'poor'): string {
    if (rating === 'good') return 'Good';
    if (rating === 'needs-improvement') return 'Needs Improvement';
    return 'Poor';
  }

  navigateTo(path: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }
}
