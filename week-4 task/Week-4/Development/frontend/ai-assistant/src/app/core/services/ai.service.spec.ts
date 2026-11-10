import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AiService } from './ai.service';
import { environment } from '../../../environments/environment';

describe('AiService', () => {
  let service: AiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get system health status', () => {
    const mockHealth = {
      status: 'healthy',
      service: 'AI Assistant Backend',
      database: 'connected',
      active_ai_provider: 'groq',
      environment: 'development'
    };

    service.getHealth().subscribe((data) => {
      expect(data.status).toBe('healthy');
      expect(data.active_ai_provider).toBe('groq');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/health`);
    expect(req.request.method).toBe('GET');
    req.flush(mockHealth);
  });

  it('should get active AI provider info', () => {
    const mockProvider = {
      active_provider: 'groq',
      active_model: 'llama-3.3-70b-versatile',
      providers: {
        groq: {
          name: 'groq',
          default_model: 'llama-3.3-70b-versatile',
          base_url: 'https://api.groq.com/openai/v1',
          is_configured: true
        }
      }
    };

    service.getProviderInfo().subscribe((data) => {
      expect(data.active_provider).toBe('groq');
      expect(data.active_model).toBe('llama-3.3-70b-versatile');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/ai/provider`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProvider);
  });

  it('should send chat prompt and return AI reply with metrics', () => {
    const mockChatResponse = {
      success: true,
      data: {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        reply: 'Groq is an ultra-fast AI inference platform.',
        usage: {
          prompt_tokens: 15,
          completion_tokens: 10,
          total_tokens: 25
        }
      },
      user_id: 'user_456'
    };

    service.sendChat('What is Groq?').subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.reply).toContain('Groq');
      expect(res.data.usage.total_tokens).toBe(25);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/ai/chat`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.prompt).toBe('What is Groq?');
    req.flush(mockChatResponse);
  });
});
