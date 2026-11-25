import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { Task, TasksService } from './tasks.service';

@Component({
  selector: 'app-tasks',
  imports: [FormsModule, RouterLink],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit {
  private readonly api = inject(TasksService);
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly saveError = signal('');
  readonly filter = signal<'all' | Task['status']>('all');
  readonly filtered = computed(() => this.tasks().filter(
    task => this.filter() === 'all' || task.status === this.filter()
  ));
  readonly pending = computed(() => this.tasks().filter(task => task.status === 'pending').length);
  title = '';
  editingId: string | null = null;
  deletingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: result => this.tasks.set(result.tasks),
      error: () => this.loadError.set(true)
    });
  }

  save(): void {
    const title = this.title.trim();
    if (!title || title.length > 160 || this.saving()) return;
    const id = this.editingId;
    this.mutate(id ? this.api.update(id, { title }) : this.api.create(title), task => {
      this.tasks.update(tasks => id
        ? tasks.map(item => item.id === id ? task : item)
        : [task, ...tasks]);
      this.cancelEdit();
    });
  }

  edit(task: Task): void {
    this.editingId = task.id;
    this.title = task.title;
    this.saveError.set('');
  }

  cancelEdit(): void {
    this.title = '';
    this.editingId = null;
  }

  toggle(task: Task): void {
    const status = task.status === 'pending' ? 'completed' : 'pending';
    this.mutate(this.api.update(task.id, { status }), updated => {
      this.tasks.update(tasks => tasks.map(item => item.id === task.id ? updated : item));
    });
  }

  remove(task: Task): void {
    this.mutate(this.api.delete(task.id), () => {
      this.tasks.update(tasks => tasks.filter(item => item.id !== task.id));
      this.deletingId.set(null);
      if (this.editingId === task.id) this.cancelEdit();
    });
  }

  private mutate<T>(request: Observable<T>, apply: (value: T) => void): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: apply,
      error: err => this.saveError.set(err.error?.error || 'Could not change the task. Try again.')
    });
  }
}
