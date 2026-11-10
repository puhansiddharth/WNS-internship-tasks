import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AiService } from '../../core/services/ai.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { User } from '../../core/models/auth.models';
import { ChatMessage, ProviderInfoResponse } from '../../core/models/ai.models';
import { HealthResponse } from '../../core/models/health.model';

export interface StarterPrompt {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private aiService = inject(AiService);
  private markdownService = inject(MarkdownService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('chatScrollContainer') private chatContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('promptInput') private promptInputRef?: ElementRef<HTMLTextAreaElement>;

  currentUser: User | null = null;
  providerInfo: ProviderInfoResponse | null = null;
  healthInfo: HealthResponse | null = null;

  promptText = '';
  isGenerating = false;
  isLoggingOut = false;
  errorMessage = '';
  copiedMessageId: string | null = null;

  // Track if user manually scrolled up to avoid interrupting reading
  private userHasScrolledUp = false;

  // Modern UI states
  isSidebarCollapsed = false;
  isMobileSidebarOpen = false;
  isUserMenuOpen = false;
  showAccountModal = false;
  expandedUsageMessageIds = new Set<string>();

  messages: ChatMessage[] = [];

  // Four refined starter suggestions matching the prompt requirements
  starterPrompts: StarterPrompt[] = [
    {
      id: 'learn',
      category: 'Learn Something',
      title: 'Learn Something',
      description: 'Explain a technical concept with practical examples.',
      prompt: 'Explain how asynchronous programming and event loops work under the hood in modern runtimes, with clear analogies and practical code examples.'
    },
    {
      id: 'code',
      category: 'Write Code',
      title: 'Write Code',
      description: 'Help me build and debug code.',
      prompt: 'Write a clean, production-ready TypeScript utility function with type definitions, error handling, and comprehensive documentation in a fenced code block.'
    },
    {
      id: 'problem-solving',
      category: 'Problem Solving',
      title: 'Problem Solving',
      description: 'Break down a challenging programming problem.',
      prompt: 'Break down a challenging algorithmic programming problem (such as finding the longest palindromic substring) with step-by-step logic, complexity analysis, and pseudocode.'
    },
    {
      id: 'explore-ideas',
      category: 'Explore Ideas',
      title: 'Explore Ideas',
      description: 'Help me brainstorm a project or solution.',
      prompt: 'Help me brainstorm architecture ideas for a scalable full-stack real-time collaboration application, detailing API design, database strategy, and authentication flows.'
    }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.cdr.markForCheck();
    });

    this.loadProviderInfo();
    this.loadHealthInfo();
  }

  loadProviderInfo(): void {
    this.aiService.getProviderInfo().subscribe({
      next: (info) => {
        this.providerInfo = info;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('Could not load AI provider info:', err);
      }
    });
  }

  loadHealthInfo(): void {
    this.aiService.getHealth().subscribe({
      next: (health) => {
        this.healthInfo = health;
        this.cdr.markForCheck();
      },
      error: () => {
        this.healthInfo = {
          status: 'unavailable',
          service: 'AI Assistant Backend',
          database: 'disconnected',
          active_ai_provider: 'unknown',
          environment: 'offline'
        };
        this.cdr.markForCheck();
      }
    });
  }

  // Keyboard shortcut listener: Enter to send, Shift+Enter for newline
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Detect user scroll position
  onScroll(): void {
    if (!this.chatContainer) return;
    const el = this.chatContainer.nativeElement;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.userHasScrolledUp = distanceToBottom > 120;
  }

  // Select starter suggestion and optionally auto-submit
  selectStarter(prompt: string, autoSubmit = false): void {
    this.promptText = prompt;
    this.cdr.markForCheck();
    if (autoSubmit) {
      this.sendMessage();
    } else {
      this.promptInputRef?.nativeElement.focus();
    }
  }

  sendMessage(): void {
    const text = this.promptText.trim();
    if (!text || this.isGenerating) {
      return;
    }

    if (text.length > 4000) {
      this.errorMessage = 'Prompt exceeds maximum allowed length of 4000 characters.';
      this.cdr.markForCheck();
      return;
    }

    this.errorMessage = '';

    // Add user message to conversation immutably
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date()
    };
    this.messages = [...this.messages, userMsg];

    this.promptText = '';
    this.isGenerating = true;
    this.userHasScrolledUp = false; // Always scroll to bottom on new message send
    this.cdr.markForCheck();
    this.scrollToBottom(true);

    this.executeChatInference(text);
  }

  /**
   * Dispatches chat request to backend and handles streaming/response state.
   */
  private executeChatInference(prompt: string): void {
    this.aiService.sendChat(prompt).pipe(
      finalize(() => {
        this.isGenerating = false;
        this.cdr.markForCheck();
        this.scrollToBottom(false);
      })
    ).subscribe({
      next: (response) => {
        const respAny = response as any;
        const replyContent =
          respAny?.data?.reply ??
          respAny?.reply ??
          respAny?.data?.message ??
          respAny?.message ??
          (typeof respAny?.data === 'string' ? respAny.data : '') ??
          'No content returned from AI assistant.';

        const providerName =
          respAny?.data?.provider ??
          respAny?.provider ??
          this.providerInfo?.active_provider ??
          'groq';

        const modelName =
          respAny?.data?.model ??
          respAny?.model ??
          this.providerInfo?.active_model ??
          '';

        const usageData = respAny?.data?.usage ?? respAny?.usage;

        // Render full markdown to safe HTML with Prism syntax highlighting
        const renderedHtml = this.markdownService.renderToSafeHtml(replyContent);

        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          sender: 'assistant',
          content: replyContent,
          renderedHtml: renderedHtml,
          timestamp: new Date(),
          provider: providerName,
          model: modelName,
          usage: usageData,
          parentUserPrompt: prompt
        };

        this.messages = [...this.messages, aiMsg];
        this.cdr.markForCheck();
      },
      error: (err) => {
        const errorContent = err?.message || 'Error communicating with AI assistant.';
        const errorMsg: ChatMessage = {
          id: 'error_' + Date.now(),
          sender: 'assistant',
          content: errorContent,
          timestamp: new Date(),
          isError: true,
          parentUserPrompt: prompt
        };

        this.messages = [...this.messages, errorMsg];
        this.errorMessage = errorContent;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Regenerate an assistant response by re-invoking inference with the original prompt.
   */
  regenerateResponse(msg: ChatMessage, index: number): void {
    if (this.isGenerating) return;

    const originalPrompt = this.resolveOriginalPrompt(msg, index);
    if (!originalPrompt) return;

    // Remove this assistant message
    this.messages = this.messages.filter((_, i) => i !== index);
    this.isGenerating = true;
    this.userHasScrolledUp = false;
    this.cdr.markForCheck();
    this.scrollToBottom(true);

    this.executeChatInference(originalPrompt);
  }

  /**
   * Retry failed message
   */
  retryMessage(msg: ChatMessage, index: number): void {
    if (this.isGenerating) return;

    const originalPrompt = this.resolveOriginalPrompt(msg, index);
    if (!originalPrompt) return;

    // Remove error message
    this.messages = this.messages.filter((_, i) => i !== index);
    this.errorMessage = '';
    this.isGenerating = true;
    this.userHasScrolledUp = false;
    this.cdr.markForCheck();
    this.scrollToBottom(true);

    this.executeChatInference(originalPrompt);
  }

  /**
   * Restore failed prompt back to input composer for user editing
   */
  restorePrompt(msg: ChatMessage, index: number): void {
    const originalPrompt = this.resolveOriginalPrompt(msg, index);
    if (originalPrompt) {
      this.promptText = originalPrompt;
      this.promptInputRef?.nativeElement.focus();
      this.messages = this.messages.filter((_, i) => i !== index);
      this.errorMessage = '';
      this.cdr.markForCheck();
    }
  }

  /**
   * Finds the user prompt corresponding to an assistant message
   */
  private resolveOriginalPrompt(msg: ChatMessage, index: number): string | null {
    if (msg.parentUserPrompt) {
      return msg.parentUserPrompt;
    }
    for (let i = index - 1; i >= 0; i--) {
      if (this.messages[i].sender === 'user') {
        return this.messages[i].content;
      }
    }
    return null;
  }

  /**
   * Toggle thumbs up/down selection feedback
   */
  toggleFeedback(msg: ChatMessage, type: 'up' | 'down'): void {
    if (msg.feedback === type) {
      msg.feedback = null;
    } else {
      msg.feedback = type;
    }
    this.cdr.markForCheck();
  }

  // Handle delegated clicks for fenced code block copy buttons
  onMessageContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const copyBtn = target.closest('.btn-copy-code') as HTMLButtonElement | null;
    if (!copyBtn) return;

    const encoded = copyBtn.getAttribute('data-code');
    if (encoded) {
      const code = decodeURIComponent(encoded);
      navigator.clipboard.writeText(code).then(() => {
        const label = copyBtn.querySelector('.copy-label');
        if (label) {
          const original = label.textContent;
          label.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            label.textContent = original;
            copyBtn.classList.remove('copied');
            this.cdr.markForCheck();
          }, 2000);
        }
        this.cdr.markForCheck();
      }).catch((err) => console.warn('Could not copy code snippet:', err));
    }
  }

  // Copy complete assistant response markdown
  copyResponse(text: string, messageId: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedMessageId = messageId;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copiedMessageId = null;
        this.cdr.markForCheck();
      }, 2000);
    }).catch((err) => console.warn('Could not copy response:', err));
  }

  // Toggle token metrics disclosure popover
  toggleUsageDetails(messageId: string): void {
    if (this.expandedUsageMessageIds.has(messageId)) {
      this.expandedUsageMessageIds.delete(messageId);
    } else {
      this.expandedUsageMessageIds.add(messageId);
    }
    this.cdr.markForCheck();
  }

  isUsageExpanded(messageId: string): boolean {
    return this.expandedUsageMessageIds.has(messageId);
  }

  // UI Navigation & Sidebar controls
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.cdr.markForCheck();
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
    this.cdr.markForCheck();
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
    this.cdr.markForCheck();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.cdr.markForCheck();
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
    this.cdr.markForCheck();
  }

  openAccountModal(): void {
    this.showAccountModal = true;
    this.isUserMenuOpen = false;
    this.cdr.markForCheck();
  }

  closeAccountModal(): void {
    this.showAccountModal = false;
    this.cdr.markForCheck();
  }

  // Clear current conversation
  clearChat(): void {
    this.messages = [];
    this.errorMessage = '';
    this.promptText = '';
    this.expandedUsageMessageIds.clear();
    this.userHasScrolledUp = false;
    this.closeMobileSidebar();
    this.cdr.markForCheck();
  }

  // User Sign Out
  logout(): void {
    this.isLoggingOut = true;
    this.cdr.markForCheck();
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoggingOut = false;
        this.router.navigate(['/login']);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile-menu-container')) {
      if (this.isUserMenuOpen) {
        this.isUserMenuOpen = false;
        this.cdr.markForCheck();
      }
    }
  }

  private scrollToBottom(force = false): void {
    if (!force && this.userHasScrolledUp) {
      return;
    }
    setTimeout(() => {
      if (this.chatContainer) {
        const el = this.chatContainer.nativeElement;
        if (typeof el.scrollTo === 'function') {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          el.scrollTop = el.scrollHeight;
        }
      }
      this.cdr.markForCheck();
    }, 50);
  }
}
