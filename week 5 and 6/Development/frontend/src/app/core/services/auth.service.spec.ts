import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register a new user and store token in sessionStorage', () => {
    const mockResponse = {
      message: 'User registered successfully',
      token: 'jwt.mock.token.register',
      user: {
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com'
      }
    };

    service.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }).subscribe((res) => {
      expect(res.token).toBe('jwt.mock.token.register');
      expect(service.getToken()).toBe('jwt.mock.token.register');
      expect(service.isAuthenticated()).toBe(true);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should login an existing user and update auth state', () => {
    const mockResponse = {
      message: 'Login successful',
      token: 'jwt.mock.token.login',
      user: {
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com'
      }
    };

    service.login({
      email: 'test@example.com',
      password: 'password123'
    }).subscribe((res) => {
      expect(res.token).toBe('jwt.mock.token.login');
      expect(service.getToken()).toBe('jwt.mock.token.login');
      expect(service.isAuthenticated()).toBe(true);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should clear session on logout', () => {
    sessionStorage.setItem('ai_assistant_jwt_token', 'sample.token');

    service.logout().subscribe(() => {
      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Successfully logged out', status: 'token_revoked' });
  });
});
