import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md px-6 py-16">
      <div class="rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
        <header class="space-y-2 mb-6 text-center">
          <h1 class="text-2xl font-semibold tracking-tight text-stone-900">Log in</h1>
          <p class="text-sm text-stone-600">Please log in with your email and password.</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <label class="block text-sm">
            <span class="text-stone-700">E-mail</span>
            <input type="email" formControlName="email" autocomplete="email" placeholder="Enter email"
              class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-stone-500 focus:outline-none" />
          </label>
          <label class="block text-sm">
            <span class="text-stone-700">Password</span>
            <div class="mt-1 flex items-center rounded-md border border-stone-300 bg-white focus-within:border-stone-500">
              <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password"
                placeholder="********"
                class="block w-full bg-transparent px-3 py-2.5 text-sm focus:outline-none" />
              <button type="button" (click)="toggle()" class="px-3 text-stone-400 hover:text-stone-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                  class="h-4 w-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </label>

          <a class="block text-sm text-stone-900 underline underline-offset-2 cursor-default">Forgot your password?</a>

          @if (error()) {
            <p class="text-sm text-red-600">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid"
            class="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400">
            Log in
          </button>

          <p class="text-sm text-stone-600 text-center">
            Not registered yet?
            <a routerLink="/signup" class="text-stone-900 underline">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  toggle(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (err) =>
        this.error.set(err?.error?.detail ?? 'Invalid credentials.')
    });
  }
}
