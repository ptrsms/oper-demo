import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth.service';
import { ApplicationService } from '../../core/application.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md px-6 py-16">
      <div class="rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
        <header class="space-y-2 mb-6 text-center">
          <h1 class="text-2xl font-semibold tracking-tight text-stone-900">Sign up</h1>
          <p class="text-sm text-stone-600">Create an account to save your simulation and continue.</p>
          @if (claimToken()) {
            <p class="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
              Your simulation will be linked to this account
            </p>
          }
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <label class="block text-sm">
            <span class="text-stone-700">E-mail</span>
            <input type="email" formControlName="email" autocomplete="email" placeholder="you@example.com"
              class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-stone-500 focus:outline-none" />
          </label>

          <label class="block text-sm">
            <span class="text-stone-700">Password</span>
            <div class="mt-1 flex items-center rounded-md border border-stone-300 bg-white focus-within:border-stone-500">
              <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="new-password"
                placeholder="At least 8 characters"
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

          <label class="block text-sm">
            <span class="text-stone-700">Confirm password</span>
            <input [type]="showPassword() ? 'text' : 'password'" formControlName="passwordConfirm" autocomplete="new-password"
              placeholder="Re-type your password"
              class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-stone-500 focus:outline-none" />
          </label>

          @if (error()) {
            <p class="text-sm text-red-600">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400">
            {{ submitting() ? 'Creating account…' : 'Sign up' }}
          </button>

          <p class="text-sm text-stone-600 text-center">
            Already have an account?
            <a routerLink="/login" class="text-stone-900 underline">Log in</a>
          </p>
        </form>
      </div>
    </div>
  `
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private applications = inject(ApplicationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private query = toSignal(this.route.queryParamMap, { requireSync: true });

  readonly claimToken = computed(() => this.query().get('claim_token') ?? '');
  readonly simId = computed(() => this.query().get('sim_id') ?? '');
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirm: ['', [Validators.required]]
  });

  toggle(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const { email, password, passwordConfirm } = this.form.getRawValue();
    if (password !== passwordConfirm) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.auth
      .signup({ email, password, claim_token: this.claimToken() || null })
      .subscribe({
        next: () => {
          const simId = this.simId();
          if (simId) {
            this.applications.create(simId).subscribe({
              next: (app) => {
                this.submitting.set(false);
                this.router.navigate(['/applications', app.id, 'property']);
              },
              error: (err) => {
                this.submitting.set(false);
                console.error('application create failed', err);
                this.router.navigateByUrl('/dashboard');
              }
            });
          } else {
            this.submitting.set(false);
            this.router.navigateByUrl('/dashboard');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          console.error('signup failed', err);
          this.error.set(err?.error?.detail ?? 'Could not sign up. Try again.');
        }
      });
  }
}
