import { TestBed } from '@angular/core/testing';
import { MemoryTrackerService } from './memory-tracker.service';
import { LoggerService } from './logger.service';

describe('MemoryTrackerService', () => {
  let service: MemoryTrackerService;
  let logger: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MemoryTrackerService, LoggerService]
    });
    service = TestBed.inject(MemoryTrackerService);
    logger = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register and track an instance without retaining strong reference', () => {
    const dummyObj = { test: 'value' };
    service.register('leaking', 1, dummyObj, 'Test Object');

    expect(service.records().length).toBe(1);
    expect(service.records()[0].id).toBe(1);
    expect(service.records()[0].type).toBe('leaking');
    expect(service.records()[0].isMountedInDom).toBe(true);
    expect(service.records()[0].listenerActive).toBe(true);
  });

  it('should mark unmounted with listener state', () => {
    const dummyObj = { test: 'value' };
    service.register('fixed', 2, dummyObj, 'Fixed Object');
    service.markUnmounted('fixed', 2, false);

    const record = service.records().find(r => r.id === 2);
    expect(record?.isMountedInDom).toBe(false);
    expect(record?.listenerActive).toBe(false);
  });

  it('should refresh live status of tracked objects', () => {
    const spy = vi.spyOn(logger, 'addLog');
    service.refreshLiveStatus();
    expect(spy).toHaveBeenCalledWith('GC_DIAGNOSTIC', 'MemoryTracker', expect.stringContaining('Diagnostic status refresh'));
  });
});
