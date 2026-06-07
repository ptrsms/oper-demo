import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ApplicationService,
  type ApplicationOut
} from '../../../core/application.service';

@Component({
  selector: 'app-submitted',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6 text-center py-8">
      <div class="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-semibold">
        ✓
      </div>
      <header class="space-y-2">
        <h2 class="text-xl font-semibold tracking-tight">Application submitted</h2>
        <p class="text-stone-600 text-sm">
          Reference: <span class="font-mono">{{ applicationRef() }}</span>
        </p>
        <p class="text-stone-500 text-sm">
          We'll review and reach out by email.
        </p>
      </header>
      <div class="flex items-center justify-center gap-3">
        <a
          [routerLink]="['../documents']"
          class="inline-block rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800">
          Upload documents
        </a>
        <a
          routerLink="/dashboard"
          class="inline-block rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
          Back to dashboard
        </a>
      </div>
    </section>
  `
})
export class SubmittedComponent {
  private route = inject(ActivatedRoute);
  private applications = inject(ApplicationService);
  private params = toSignal(this.route.parent!.paramMap, { requireSync: true });

  readonly applicationId = computed(() => this.params().get('id') ?? '');
  readonly application = signal<ApplicationOut | null>(null);
  readonly applicationRef = computed(
    () => this.application()?.ref ?? this.applicationId() ?? '—'
  );

  constructor() {
    const id = this.applicationId();
    if (id) {
      this.applications.get(id).subscribe({
        next: (app) => this.application.set(app),
        error: (err) => console.error('load application failed', err)
      });
    }
  }
}
