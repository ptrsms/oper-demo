import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

interface Step {
  path: string;
  label: string;
  index: number;
}

@Component({
  selector: 'app-application-wizard-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="mx-auto max-w-4xl space-y-6">
      <header class="space-y-1">
        <p class="text-xs uppercase tracking-widest text-stone-500">
          Application #{{ shortId() }}
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-stone-900">
          Mortgage application
        </h1>
      </header>

      <nav class="flex flex-wrap gap-2">
        @for (step of steps; track step.path) {
          <a
            [routerLink]="['./', step.path]"
            routerLinkActive
            #rla="routerLinkActive"
            class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition"
            [class.bg-stone-900]="rla.isActive"
            [class.text-white]="rla.isActive"
            [class.border-stone-900]="rla.isActive"
            [class.bg-white]="!rla.isActive"
            [class.text-stone-600]="!rla.isActive"
            [class.border-stone-200]="!rla.isActive"
            [class.hover:border-stone-400]="!rla.isActive">
            <span class="grid h-5 w-5 place-items-center rounded-full text-xs"
              [class.bg-white]="rla.isActive"
              [class.text-stone-900]="rla.isActive"
              [class.bg-stone-100]="!rla.isActive">{{ step.index }}</span>
            {{ step.label }}
          </a>
        }
      </nav>

      <div class="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <router-outlet />
      </div>
    </section>
  `
})
export class ApplicationWizardShellComponent {
  private route = inject(ActivatedRoute);
  private params = toSignal(this.route.paramMap, { requireSync: true });
  readonly applicationId = computed(() => this.params().get('id') ?? '');
  readonly shortId = computed(() => this.applicationId().slice(0, 8));

  readonly steps: Step[] = [
    { path: 'property', label: 'Property', index: 1 },
    { path: 'financials', label: 'Financials', index: 2 },
    { path: 'personal', label: 'Personal', index: 3 },
    { path: 'documents', label: 'Documents', index: 4 },
    { path: 'submitted', label: 'Submitted', index: 5 }
  ];
}
