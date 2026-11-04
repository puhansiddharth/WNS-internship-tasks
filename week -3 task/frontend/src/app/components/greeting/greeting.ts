import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { GreetResponse } from '../../models/api.models';

/**
 * Custom Validator to prevent inputs containing only whitespace
 */
function nonWhitespaceValidator(control: AbstractControl) {
  const isWhitespace = (control.value || '').trim().length === 0;
  return isWhitespace ? { whitespace: true } : null;
}

@Component({
  selector: 'app-greeting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './greeting.html',
  styleUrl: './greeting.css'
})
export class GreetingComponent {
  // Reactive Form
  greetingForm: FormGroup;

  // Component state
  greetingResponse: GreetResponse | null = null;
  isLoading = false;
  errorMessage = '';
  isSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize Reactive Form with built-in and custom validators
    this.greetingForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          nonWhitespaceValidator
        ]
      ]
    });
  }

  // Convenience getter for easy template access
  get nameControl() {
    return this.greetingForm.get('name');
  }

  /**
   * Submit handler for the greeting form.
   * Dispatches POST /greet with JSON payload.
   */
  onSubmit(): void {
    this.isSubmitted = true;
    this.errorMessage = '';
    this.greetingResponse = null;

    // Check client-side validation
    if (this.greetingForm.invalid) {
      this.greetingForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const name = this.nameControl?.value?.trim() || '';
    this.isLoading = true;
    this.cdr.markForCheck();

    this.apiService
      .greet(name)
      .pipe(
        finalize(() => {
          // Guarantee loading indicator ends on both success and error
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.greetingResponse = response;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage = err.message;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Reset form and clear results
   */
  resetForm(): void {
    this.greetingForm.reset({ name: '' });
    this.greetingResponse = null;
    this.errorMessage = '';
    this.isSubmitted = false;
    this.isLoading = false;
    this.cdr.markForCheck();
  }
}
