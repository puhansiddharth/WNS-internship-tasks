import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  LogoutResponse,
  RegisterRequest,
  User,
  UserProfileResponse
} from '../models/auth.models';

const TOKEN_KEY = 'ai_assistant_jwt_token';
const USER_KEY = 'ai_assistant_user_data';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!this.getToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // If token exists, refresh user profile to verify token validity
    if (this.getToken()) {
      this.fetchCurrentUser().subscribe({
        error: () => this.clearSession()
      });
    }
  }

  public getToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((response) => this.handleAuthSuccess(response))
    );
  }

  public login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((response) => this.handleAuthSuccess(response))
    );
  }

  public fetchCurrentUser(): Observable<User> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/me`).pipe(
      map((response) => response.user),
      tap((user) => {
        this.storeUser(user);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  public logout(): Observable<LogoutResponse | null> {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      return of(null);
    }

    return this.http.post<LogoutResponse>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  public clearSession(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage errors
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    if (response && response.token) {
      try {
        sessionStorage.setItem(TOKEN_KEY, response.token);
      } catch {
        // Storage unavailable
      }
      this.storeUser(response.user);
      this.currentUserSubject.next(response.user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  private storeUser(user: User): void {
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage error
    }
  }

  private getStoredUser(): User | null {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
