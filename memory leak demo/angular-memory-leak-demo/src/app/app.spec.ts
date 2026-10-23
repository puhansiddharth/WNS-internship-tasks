import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { LoggerService } from './services/logger.service';
import { MemoryTrackerService } from './services/memory-tracker.service';

describe('App Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [LoggerService, MemoryTrackerService]
    }).compileComponents();
  });

  it('should create the App component successfully', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the header title "Angular Memory Leak Lab"', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Angular Memory Leak Lab');
  });

  it('should switch navigation tabs properly', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    expect(app.activeTab()).toBe('lab');

    app.activeTab.set('architecture');
    fixture.detectChanges();
    expect(app.activeTab()).toBe('architecture');

    app.activeTab.set('guide');
    fixture.detectChanges();
    expect(app.activeTab()).toBe('guide');
  });

  it('should toggle mounting of leaking component', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.isLeakingMounted()).toBe(false);

    app.toggleLeaking();
    expect(app.isLeakingMounted()).toBe(true);

    app.toggleLeaking();
    expect(app.isLeakingMounted()).toBe(false);
  });

  it('should toggle mounting of fixed component', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.isFixedMounted()).toBe(false);

    app.toggleFixed();
    expect(app.isFixedMounted()).toBe(true);

    app.toggleFixed();
    expect(app.isFixedMounted()).toBe(false);
  });

  it('should trigger synthetic window resize event', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(logger, 'addLog');

    app.triggerResizeEvent();
    expect(spy).toHaveBeenCalledWith('SYSTEM', 'DemoController', expect.stringContaining('window resize event'));
  });
});
