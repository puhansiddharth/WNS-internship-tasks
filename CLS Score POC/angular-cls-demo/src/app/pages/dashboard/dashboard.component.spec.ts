import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ClsService } from '../../services/cls.service';
import { beforeEach, describe, it, expect } from 'vitest';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let clsService: ClsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [ClsService]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    clsService = TestBed.inject(ClsService);
    fixture.detectChanges();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the page title and subtitle', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.page-title')?.textContent).toContain('CLS Overview');
    expect(el.querySelector('.page-subtitle')?.textContent).toContain('Measuring and improving visual stability');
  });

  it('should show "Awaiting measurement" when no measurement has been collected', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.awaiting-text')?.textContent).toContain('Awaiting measurement');
  });

  it('should display the actual score and rating when a measurement is available', () => {
    clsService.hasMeasured.set(true);
    clsService.pageScore.set(0.0825);
    clsService.pageRating.set('good');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.score-value')?.textContent).toContain('0.0825');
    expect(el.querySelector('.rating-badge')?.textContent).toContain('Good');
  });

  it('should render the exact short explanation sentence', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.short-explanation')?.textContent?.trim()).toBe(
      'CLS measures unexpected movement of visible page elements. Lower scores indicate better visual stability.'
    );
  });

  it('should render the navigation links to Bad CLS and Fixed CLS', () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('.btn-demo-link');
    expect(buttons.length).toBe(2);
    expect(buttons[0]?.textContent).toContain('View Bad CLS Demo');
    expect(buttons[1]?.textContent).toContain('View Fixed CLS Demo');
  });
});
