import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AiService } from '../../core/services/ai.service';
import { ChatResponse } from '../../core/models/ai.models';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let aiService: AiService;

  const mockSuccessResponse: ChatResponse = {
    success: true,
    data: {
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      reply: 'Hello! I am your AI assistant running on Groq.',
      usage: {
        prompt_tokens: 15,
        completion_tokens: 22,
        total_tokens: 37
      }
    },
    user_id: 'user_test_123'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    aiService = TestBed.inject(AiService);
    fixture.detectChanges();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
    expect(component.isGenerating).toBe(false);
  });

  it('should send user message, render AI response, and reset loading state', () => {
    vi.spyOn(aiService, 'sendChat').mockReturnValue(of(mockSuccessResponse));

    component.promptText = 'Hello AI';
    component.sendMessage();

    // User message added immediately
    expect(component.messages.length).toBe(2);
    expect(component.messages[0].sender).toBe('user');
    expect(component.messages[0].content).toBe('Hello AI');

    // AI message added on response
    expect(component.messages[1].sender).toBe('assistant');
    expect(component.messages[1].content).toBe('Hello! I am your AI assistant running on Groq.');
    expect(component.messages[1].model).toBe('openai/gpt-oss-120b');
    expect(component.messages[1].usage?.total_tokens).toBe(37);

    // Loading state reset
    expect(component.isGenerating).toBe(false);
    expect(component.promptText).toBe('');
  });

  it('should handle API failure, display error message, and reset loading state', () => {
    vi.spyOn(aiService, 'sendChat').mockReturnValue(throwError(() => new Error('Groq rate limit exceeded')));

    component.promptText = 'Trigger error';
    component.sendMessage();

    // User message and error message present
    expect(component.messages.length).toBe(2);
    expect(component.messages[0].content).toBe('Trigger error');
    expect(component.messages[1].isError).toBe(true);
    expect(component.messages[1].content).toContain('Groq rate limit exceeded');

    // Loading state must be reset
    expect(component.isGenerating).toBe(false);
    expect(component.errorMessage).toContain('Groq rate limit exceeded');
  });

  it('should prevent duplicate submissions while request is already generating', () => {
    const sendChatSpy = vi.spyOn(aiService, 'sendChat').mockReturnValue(of(mockSuccessResponse));

    component.isGenerating = true;
    component.promptText = 'Second message';
    component.sendMessage();

    // Should not call API
    expect(sendChatSpy).not.toHaveBeenCalled();
    expect(component.messages.length).toBe(0);
  });

  it('should clear conversation history when clearChat is called', () => {
    component.messages = [
      { id: '1', sender: 'user', content: 'Hi', timestamp: new Date() },
      { id: '2', sender: 'assistant', content: 'Hello', timestamp: new Date() }
    ];
    component.errorMessage = 'Some error';

    component.clearChat();

    expect(component.messages.length).toBe(0);
    expect(component.errorMessage).toBe('');
    expect(component.promptText).toBe('');
  });

  it('should regenerate assistant response using the original user prompt', () => {
    const sendChatSpy = vi.spyOn(aiService, 'sendChat').mockReturnValue(of({
      success: true,
      data: {
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        reply: 'Regenerated fresh reply',
        usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 }
      },
      user_id: 'user_test'
    }));

    component.messages = [
      { id: 'u1', sender: 'user', content: 'Initial question', timestamp: new Date() },
      { id: 'a1', sender: 'assistant', content: 'Old response', timestamp: new Date(), parentUserPrompt: 'Initial question' }
    ];

    component.regenerateResponse(component.messages[1], 1);

    expect(sendChatSpy).toHaveBeenCalledWith('Initial question');
    expect(component.messages.length).toBe(2);
    expect(component.messages[1].content).toBe('Regenerated fresh reply');
  });

  it('should toggle feedback selection state between up, down, and null', () => {
    const msg: any = { id: 'a1', sender: 'assistant', content: 'Good answer', timestamp: new Date() };

    component.toggleFeedback(msg, 'up');
    expect(msg.feedback).toBe('up');

    // Toggle same button clears feedback
    component.toggleFeedback(msg, 'up');
    expect(msg.feedback).toBe(null);

    // Switch to down
    component.toggleFeedback(msg, 'down');
    expect(msg.feedback).toBe('down');
  });

  it('should retry a failed request using the original user prompt', () => {
    const sendChatSpy = vi.spyOn(aiService, 'sendChat').mockReturnValue(of(mockSuccessResponse));

    component.messages = [
      { id: 'u1', sender: 'user', content: 'Failed attempt prompt', timestamp: new Date() },
      { id: 'e1', sender: 'assistant', content: 'Network timeout', isError: true, timestamp: new Date() }
    ];

    component.retryMessage(component.messages[1], 1);

    expect(sendChatSpy).toHaveBeenCalledWith('Failed attempt prompt');
    expect(component.messages.length).toBe(2);
    expect(component.messages[1].isError).toBeFalsy();
  });

  it('should restore a failed prompt to the composer for editing', () => {
    component.messages = [
      { id: 'u1', sender: 'user', content: 'Draft to edit', timestamp: new Date() },
      { id: 'e1', sender: 'assistant', content: 'Network timeout', isError: true, timestamp: new Date() }
    ];

    component.restorePrompt(component.messages[1], 1);

    expect(component.promptText).toBe('Draft to edit');
    expect(component.messages.length).toBe(1); // Error message removed
  });
});
