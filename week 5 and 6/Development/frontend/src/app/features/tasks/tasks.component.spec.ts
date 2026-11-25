import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TasksComponent } from './tasks.component';

describe('TasksComponent', () => {
  it('shows the failed load and recovers on retry', async () => {
    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    const fixture = TestBed.createComponent(TasksComponent);
    const http = TestBed.inject(HttpTestingController);
    const url = `${environment.apiUrl}/tasks`;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading tasks');
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Could not load your tasks.');
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    http.expectOne(url).flush({ tasks: [{ id: '1', title: 'Submit internship report', status: 'pending' }] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('li').textContent).toContain('Submit internship report');
    http.verify();
  });
});
