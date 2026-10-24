import { TestBed } from '@angular/core/testing';
import { ClsService } from './cls.service';

describe('ClsService', () => {
  let service: ClsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClsService]
    });
    service = TestBed.inject(ClsService);
  });

  it('should be created and have initial honest 0 score for all metrics', () => {
    expect(service).toBeTruthy();
    expect(service.hasMeasured()).toBe(false);
    expect(service.pageScore()).toBe(0);
    expect(service.pageFormattedScore()).toBe('0.0000');
    expect(service.pageRating()).toBe('good');
    expect(service.badScore()).toBe(0);
    expect(service.badFormattedScore()).toBe('0.0000');
    expect(service.fixedScore()).toBe(0);
    expect(service.fixedFormattedScore()).toBe('0.0000');
  });

  it('should compute rating thresholds accurately according to web-vitals spec', () => {
    expect(service.computeRating(0.0000)).toBe('good');
    expect(service.computeRating(0.0800)).toBe('good');
    expect(service.computeRating(0.1000)).toBe('good');
    expect(service.computeRating(0.1500)).toBe('needs-improvement');
    expect(service.computeRating(0.2500)).toBe('needs-improvement');
    expect(service.computeRating(0.2501)).toBe('poor');
    expect(service.computeRating(0.3500)).toBe('poor');
  });

  it('should reset local scores when resetLocalScores is called', () => {
    (service as any).badScore.set(0.1852);
    (service as any).fixedScore.set(0.05);
    (service as any).hasMeasured.set(true);

    service.resetLocalScores();

    expect(service.hasMeasured()).toBe(false);
    expect(service.badScore()).toBe(0);
    expect(service.fixedScore()).toBe(0);
    expect(service.badFormattedScore()).toBe('0.0000');
  });
});
