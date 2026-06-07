import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  ApplicationService,
  type ApplicationOut,
  type PersonalStep
} from '../../../core/application.service';

@Component({
  selector: 'app-personal-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="next()" class="space-y-6">
      <header>
        <h2 class="text-lg font-medium">Personal — Borrower 1</h2>
        <p class="text-sm text-stone-500">Just enough to identify you.</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block text-sm">
          <span class="text-stone-700">First name</span>
          <input formControlName="first_name" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Last name</span>
          <input formControlName="last_name" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Date of birth</span>
          <input type="date" formControlName="date_of_birth"
            class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Dependents</span>
          <input type="number" min="0" formControlName="dependents"
            class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
      </div>

      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }

      <div class="flex justify-end">
        <button
          type="submit"
          [disabled]="saving()"
          class="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 disabled:opacity-60">
          {{ saving() ? 'Submitting…' : 'Save & submit' }}
        </button>
      </div>
    </form>
  `
})
export class PersonalStepComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private applications = inject(ApplicationService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    date_of_birth: ['', Validators.required],
    dependents: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    const id = this.applicationId();
    if (id) {
      this.applications.get(id).subscribe({
        next: (app) => this.populate(app),
        error: (err) => {
          console.error('load application failed', err);
          this.error.set('Could not load this application.');
        }
      });
    }
  }

  private applicationId(): string | null {
    return this.route.parent?.snapshot.paramMap.get('id') ?? null;
  }

  private populate(app: ApplicationOut): void {
    const borrower = app.borrowers.find((b) => b.position === 1) ?? app.borrowers[0];
    if (!borrower) return;
    this.form.patchValue({
      first_name: borrower.first_name ?? '',
      last_name: borrower.last_name ?? '',
      date_of_birth: borrower.date_of_birth ?? '',
      dependents: borrower.dependents ?? 0
    });
  }

  next(): void {
    if (this.form.invalid || this.saving()) return;
    const id = this.applicationId();
    if (!id) return;
    const raw = this.form.getRawValue();
    const payload: PersonalStep = {
      borrowers: [
        {
          position: 1,
          first_name: raw.first_name,
          last_name: raw.last_name,
          date_of_birth: raw.date_of_birth,
          dependents: raw.dependents
        }
      ]
    };
    this.saving.set(true);
    this.error.set(null);
    this.applications
      .patchPersonal(id, payload)
      .pipe(switchMap(() => this.applications.submit(id)))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['../submitted'], { relativeTo: this.route });
        },
        error: (err) => {
          this.saving.set(false);
          console.error('patch/submit personal failed', err);
          this.error.set('Could not submit. Please try again.');
        }
      });
  }
}
