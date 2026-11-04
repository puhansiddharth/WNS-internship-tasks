import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  HealthResponse,
  HelloResponse,
  GreetRequest,
  GreetResponse,
  ApiError
} from '../models/api.models';

/**
 * ApiService
 * Centralized service for communicating with the Flask REST backend.
 * Uses Angular HttpClient with strong typing and centralized error handling.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Health Check: GET /health
   * Retrieves backend uptime and operational status.
   */
  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Hello Endpoint: GET /hello
   * Retrieves a simple welcoming JSON message.
   */
  getHello(): Observable<HelloResponse> {
    return this.http.get<HelloResponse>(`${this.baseUrl}/hello`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Greeting Endpoint: POST /greet
   * Sends the user's name to the backend and returns a personalized greeting.
   * @param name The name to greet
   */
  greet(name: string): Observable<GreetResponse> {
    const payload: GreetRequest = { name };
    return this.http.post<GreetResponse>(`${this.baseUrl}/greet`, payload).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Unified HTTP error handler.
   * Extracts user-friendly messages from client-side network errors or server responses.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.status === 0) {
      // Client-side network or CORS issue (server offline)
      errorMessage = 'Cannot connect to backend server. Make sure Flask is running on ' + environment.apiUrl;
    } else if (error.error && typeof error.error === 'object') {
      const apiErr = error.error as ApiError;
      errorMessage = apiErr.error || apiErr.message || `Server returned code ${error.status}`;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    } else {
      errorMessage = `Server returned HTTP ${error.status}: ${error.statusText}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
