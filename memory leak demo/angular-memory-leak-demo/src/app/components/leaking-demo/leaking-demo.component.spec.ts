import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LeakingDemoComponent } from './leaking-demo.component';
import { LoggerService } from '../../services/logger.service';
import { MemoryTrackerService } from '../../services/memory-tracker.service';

describe('LeakingDemoComponent', () => {
  let fixture: ComponentFixture<LeakingDemoComponent>;
  let component: LeakingDemoComponent;
  let logger: LoggerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeakingDemoComponent],
      providers: [LoggerService, MemoryTrackerService]
    }).compileComponents();

    logger = TestBed.inject(LoggerService);
    fixture = TestBed.createComponent(LeakingDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and register payload and window resize listener', () => {
    expect(component).toBeTruthy();
    expect(component.payload).toBeTruthy();
    expect(component.payload.marker).toBe('RETAINED_LEAKED_PAYLOAD_MARKER');
    expect(component.isDestroyed).toBe(false);
  });

  it('should increment event count when window resize is triggered while active', () => {
    const initialCount = component.localResizeEventsCount();
    window.dispatchEvent(new Event('resize'));
    expect(component.localResizeEventsCount()).toBe(initialCount + 1);
  });

  it('DEMONSTRATES MEMORY LEAK BUG: callback continues to fire even AFTER ngOnDestroy()', () => {
    const countBeforeDestroy = component.localResizeEventsCount();
    
    // Destroy component
    fixture.destroy();
    expect(component.isDestroyed).toBe(true);

    // Trigger window resize event on global window
    window.dispatchEvent(new Event('resize'));

    // The listener was NOT removed: it still fired and incremented!
    expect(component.localResizeEventsCount()).toBe(countBeforeDestroy + 1);

    // Verify zombie callback was recorded in logger
    const logs = logger.logs();
    const zombieLog = logs.find(l => l.isZombie);
    expect(zombieLog).toBeTruthy();
    expect(zombieLog?.message).toContain('ZOMBIE CALLBACK');
  });
});
