import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tasks`;

  list() {
    return this.http.get<{ tasks: Task[] }>(this.url);
  }

  create(title: string) {
    return this.http.post<Task>(this.url, { title });
  }

  update(id: string, changes: Partial<Pick<Task, 'title' | 'status'>>) {
    return this.http.patch<Task>(`${this.url}/${id}`, changes);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
