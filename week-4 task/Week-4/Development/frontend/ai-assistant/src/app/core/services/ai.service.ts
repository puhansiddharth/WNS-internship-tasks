import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatRequest, ChatResponse, ProviderInfoResponse } from '../models/ai.models';
import { HealthResponse } from '../models/health.model';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  public sendChat(prompt: string, systemMessage?: string, provider?: string): Observable<ChatResponse> {
    const payload: ChatRequest = {
      prompt: prompt.trim()
    };
    if (systemMessage && systemMessage.trim()) {
      payload.system_message = systemMessage.trim();
    }
    if (provider && provider.trim()) {
      payload.provider = provider.trim();
    }

    return this.http.post<ChatResponse>(`${this.apiUrl}/ai/chat`, payload).pipe(
      catchError((error) => {
        let errorMsg = 'Failed to get response from AI assistant.';
        if (error.error && error.error.error) {
          errorMsg = error.error.error;
        } else if (error.status === 0) {
          errorMsg = 'Cannot reach backend server. Check if Flask is running on port 5000.';
        } else if (error.status === 502) {
          errorMsg = error.error?.error || 'AI provider upstream error (API limit or invalid API key).';
        }
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  public getProviderInfo(): Observable<ProviderInfoResponse> {
    return this.http.get<ProviderInfoResponse>(`${this.apiUrl}/ai/provider`);
  }

  public getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiUrl}/health`);
  }
}
