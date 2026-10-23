import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FixedDemoComponent } from './fixed-demo.component';
import { LoggerService } from '../../services/logger.service';
import { MemoryTrackerService } from '../../services/memory-tracker.service';

describe('FixedDemoComponent', () => {
  let fixture: ComponentFixture<FixedDemoComponent>;
  let component: FixedDemoComponent;
  let logger: LoggerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixedDemoComponent],
      providers: [LoggerService, MemoryTrackerService]
    }).compileComponents();

    logger = TestBed.inject(LoggerService);
    fixture = TestBed.createComponent(FixedDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and register payload and window resize listener', () => {
    expect(component).toBeTruthy();
    expect(component.payload).toBeTruthy();
    expect(component.payload.marker).toBe('RECLAIMABLE_CLEAN_PAYLOAD_MARKER');
    expect(component.isDestroyed).toBe(false);
  });

  it('should increment event count when window resize is triggered while active', () => {
    const initialCount = component.localResizeEventsCount();
    window.dispatchEvent(new Event('resize'));
    expect(component.localResizeEventsCount()).toBe(initialCount + 1);
  });

  it('PROVES THE FIX: callback does NOT fire after ngOnDestroy() because removeEventListener was called', () => {
    const countBeforeDestroy = component.localResizeEventsCount();
    
    // Destroy component
    fixture.destroy();
    expect(component.isDestroyed).toBe(true);

    // Trigger window resize event on global window
    window.dispatchEvent(new Event('resize'));

    // The listener WAS removed: count should remain unchanged!
    expect(component.localResizeEventsCount()).toBe(countBeforeDestroy);

    // Verify destroy log was recorded in logger
    const logs = logger.logs();
    const destroyLog = logs.find(l => l.source.includes('FixedDemoComponent') && l.category === 'LIFECYCLE');
    expect(destroyLog).toBeTruthy();
    expect(destroyLog?.message).toContain('window.removeEventListener() called');
  });
});
