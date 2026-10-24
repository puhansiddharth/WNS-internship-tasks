import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FixedClsComponent } from './fixed-cls.component';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

describe('FixedClsComponent', () => {
  let component: FixedClsComponent;
  let fixture: ComponentFixture<FixedClsComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [FixedClsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FixedClsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render reserved slot with skeleton placeholder initially', () => {
    expect(component.showBanner()).toBe(false);
    expect(component.demoState()).toBe('idle');

    const slot = fixture.nativeElement.querySelector('.reserved-slot');
    expect(slot).toBeTruthy();

    const skeleton = fixture.nativeElement.querySelector('.skeleton-slot');
    expect(skeleton).toBeTruthy();
  });

  it('should render banner inside reserved slot after 1500ms delay without removing container', () => {
    component.runDemo();
    expect(component.demoState()).toBe('loading');
    fixture.detectChanges();

    vi.advanceTimersByTime(1500);
    fixture.detectChanges();

    expect(component.showBanner()).toBe(true);
    expect(component.demoState()).toBe('loaded');

    const banner = fixture.nativeElement.querySelector('.fixed-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Flash Sale');

    const slot = fixture.nativeElement.querySelector('.reserved-slot');
    expect(slot).toBeTruthy();
  });

  it('should reset to initial skeleton state cleanly', () => {
    component.runDemo();
    vi.advanceTimersByTime(1500);
    fixture.detectChanges();
    expect(component.showBanner()).toBe(true);

    component.resetDemo();
    fixture.detectChanges();
    expect(component.showBanner()).toBe(false);
    expect(component.demoState()).toBe('idle');
  });
});
