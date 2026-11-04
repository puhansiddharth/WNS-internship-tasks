import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class AboutComponent {
  // Track open state for each section (all collapsed initially or first one open)
  openSections: { [key: number]: boolean } = {
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
    11: false,
    12: false,
    13: false,
    14: false,
    15: false
  };

  activeFilter: 'all' | 'architecture' | 'api' | 'angular' | 'setup' = 'all';

  toggleSection(id: number): void {
    this.openSections[id] = !this.openSections[id];
  }

  isSectionOpen(id: number): boolean {
    return !!this.openSections[id];
  }

  setFilter(filter: 'all' | 'architecture' | 'api' | 'angular' | 'setup'): void {
    this.activeFilter = filter;
  }

  expandAll(): void {
    for (let i = 1; i <= 15; i++) {
      this.openSections[i] = true;
    }
  }

  collapseAll(): void {
    for (let i = 1; i <= 15; i++) {
      this.openSections[i] = false;
    }
  }
}
