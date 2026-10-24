import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadClsComponent } from '../../components/bad-cls/bad-cls.component';
import { ClsService } from '../../services/cls.service';

@Component({
  selector: 'app-bad-cls-page',
  standalone: true,
  imports: [CommonModule, BadClsComponent],
  template: `
    <div class="page-container">
      <div class="page-topbar">
        <span class="route-label">Isolated Route: Bad CLS</span>
        <button class="btn-clean" (click)="reload()">Fresh Page Session</button>
      </div>
      <app-bad-cls></app-bad-cls>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 640px;
      margin: 0 auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .page-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .route-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .btn-clean {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 0.35rem 0.7rem;
      border-radius: 5px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-clean:hover {
      background: #e2e8f0;
    }
  `]
})
export class BadClsPageComponent {
  private readonly clsService = inject(ClsService);

  reload(): void {
    this.clsService.reloadPage();
  }
}
