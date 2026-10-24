import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <div class="header-container">
        <div class="brand">
          <h1 class="brand-title">CLS Demonstration</h1>
          <span class="brand-subtitle">Cumulative Layout Shift — Practical POC</span>
        </div>

        <nav class="nav-links">
          <button
            type="button"
            class="nav-btn"
            [class.active]="currentPath === '' || currentPath === 'dashboard'"
            (click)="navigateTo('/dashboard')"
          >
            Dashboard
          </button>
          <button
            type="button"
            class="nav-btn nav-btn-bad"
            [class.active]="currentPath === 'bad-cls'"
            (click)="navigateTo('/bad-cls')"
          >
            Bad CLS
          </button>
          <button
            type="button"
            class="nav-btn nav-btn-fixed"
            [class.active]="currentPath === 'fixed-cls'"
            (click)="navigateTo('/fixed-cls')"
          >
            Fixed CLS
          </button>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      background: #0f172a;
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid #1e293b;
    }

    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .brand {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .brand-subtitle {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .nav-links {
      display: flex;
      gap: 0.5rem;
    }

    .nav-btn {
      background: transparent;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .nav-btn:hover {
      background: #1e293b;
      color: #ffffff;
    }

    .nav-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;
    }

    .nav-btn-bad.active {
      background: #dc2626;
      border-color: #dc2626;
    }

    .nav-btn-fixed.active {
      background: #059669;
      border-color: #059669;
    }
  `]
})
export class NavbarComponent {
  get currentPath(): string {
    if (typeof window === 'undefined') return '';
    return window.location.pathname.replace(/^\//, '');
  }

  navigateTo(path: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }
}
