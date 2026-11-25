export interface HealthResponse {
  status: string;
  service: string;
  database: string;
  active_ai_provider: string;
  environment: string;
}
