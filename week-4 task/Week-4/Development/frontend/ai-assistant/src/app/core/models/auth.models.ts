export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface UserProfileResponse {
  user: User;
}

export interface LogoutResponse {
  message: string;
  status: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  field?: string;
  message?: string;
}
