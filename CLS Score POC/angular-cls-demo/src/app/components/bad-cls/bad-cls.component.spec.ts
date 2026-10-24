import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadClsComponent } from './bad-cls.component';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

describe('BadClsComponent', () => {
  let component: BadClsComponent;
  let fixture: ComponentFixture<BadClsComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [BadClsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BadClsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with banner hidden and state idle', () => {
    expect(component.showBanner()).toBe(false);
    expect(component.demoState()).toBe('idle');
    const banner = fixture.nativeElement.querySelector('.dynamic-banner');
    expect(banner).toBeNull();
  });

  it('should display banner and set state to shifted after 1500ms delay', () => {
    component.runDemo();
    expect(component.demoState()).toBe('loading');
    fixture.detectChanges();

    vi.advanceTimersByTime(1500);
    fixture.detectChanges();

    expect(component.showBanner()).toBe(true);
    expect(component.demoState()).toBe('shifted');

    const banner = fixture.nativeElement.querySelector('.dynamic-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Flash Sale');
  });

  it('should reset demo state when reset is called', () => {
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
