/**
 * TypeScript interfaces for API requests and responses.
 * Ensures compile-time type safety across the Angular application.
 */

export interface HelloResponse {
  message: string;
}

export interface HealthResponse {
  service: string;
  status: string;
  uptime_seconds: number;
  timestamp: string;
}

export interface GreetRequest {
  name: string;
}

export interface GreetResponse {
  message: string;
  timestamp?: string;
}

export interface ApiError {
  error?: string;
  status_code?: number;
  message?: string;
}
