import { Injectable, signal } from '@angular/core';
import { LogCategory, LogEntry } from '../models/log.model';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logIdSequence = 0;
  private readonly _logs = signal<LogEntry[]>([]);
  public readonly logs = this._logs.asReadonly();

  // Metrics signals
  public readonly resizeCallbackCount = signal(0);
  public readonly zombieCallbackCount = signal(0);

  public addLog(category: LogCategory, source: string, message: string, isZombie = false): void {
    const entry: LogEntry = {
      id: ++this.logIdSequence,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      category,
      source,
      message,
      isZombie
    };

    if (category === 'RESIZE_EVENT') {
      this.resizeCallbackCount.update(c => c + 1);
      if (isZombie) {
        this.zombieCallbackCount.update(c => c + 1);
      }
    }

    // Keep the most recent 100 logs to prevent the log buffer itself from growing indefinitely
    this._logs.update(prev => [entry, ...prev.slice(0, 99)]);
  }

  public clearLogs(): void {
    this._logs.set([]);
    this.resizeCallbackCount.set(0);
    this.zombieCallbackCount.set(0);
    this.addLog('SYSTEM', 'Logger', 'Diagnostic logs cleared.');
  }
}
