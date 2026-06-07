import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import {
  SimulationService,
  type SimulationOut
} from '../../core/simulation.service';
import {
  ApplicationService,
  type ApplicationSummary
} from '../../core/application.service';

const HOUSE_PHOTO =
  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=400&fit=crop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, TitleCasePipe],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-10 space-y-8">
      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- main column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- My application -->
          @if (latestApp(); as app) {
            <section class="space-y-3">
              <h2 class="text-sm font-semibold text-stone-900">My application</h2>
              <article class="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <img [src]="housePhoto" alt="" class="h-44 w-full object-cover" />
                <div class="p-5 space-y-3">
                  <div class="flex items-center gap-3 text-xs text-stone-500">
                    <span class="font-mono">#{{ app.ref }}</span>
                  </div>
                  <p class="text-2xl font-semibold text-stone-900">
                    € {{ num(app.property_price) | number:'1.0-0' }}
                  </p>
                  <div class="flex flex-wrap items-center gap-2 text-xs">
                    @if (app.submitted_at) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        Submitted on {{ app.submitted_at | date:'dd/MM/yyyy' }}
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                        Draft · step {{ app.current_step }}
                      </span>
                    }
                    <span class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">
                      Purchase
                    </span>
                    <a
                      [routerLink]="['/applications', app.id, stepPath(app)]"
                      class="ml-auto rounded-md border border-stone-200 px-3 py-1.5 text-stone-700 hover:bg-stone-100">
                      Continue application
                    </a>
                  </div>
                </div>
              </article>
            </section>
          }

          <!-- Simulations -->
          <section class="space-y-3">
            <h2 class="text-sm font-semibold text-stone-900">Simulations</h2>
            @if (loading()) {
              <p class="text-sm text-stone-500">Loading…</p>
            } @else if (simulations().length === 0) {
              <p class="text-sm text-stone-500">No simulations yet.</p>
            } @else {
              <ul class="space-y-3">
                @for (sim of simulations(); track sim.id) {
                  <li class="rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <div class="flex items-center gap-4 p-4">
                      <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-600">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                          class="h-5 w-5">
                          <circle cx="8" cy="14" r="4"/>
                          <path d="M11 11l9-9M14.5 4.5l3 3M18 8l2-2"/>
                        </svg>
                      </span>
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-mono text-stone-500">#{{ sim.ref }}</p>
                        <p class="text-lg font-semibold text-stone-900">
                          € {{ num(sim.property_price) | number:'1.0-0' }}
                        </p>
                        <div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            class="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                            [class.bg-emerald-50]="sim.status === 'ACTIVE'"
                            [class.text-emerald-700]="sim.status === 'ACTIVE'"
                            [class.bg-stone-100]="sim.status !== 'ACTIVE'"
                            [class.text-stone-600]="sim.status !== 'ACTIVE'">
                            @if (sim.status === 'ACTIVE') {
                              Apply until {{ sim.apply_until | date:'dd/MM/yyyy' }}
                            } @else {
                              {{ sim.status | titlecase }}
                            }
                          </span>
                          <span class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">
                            {{ purposeLabel(sim.project_purpose) }}
                          </span>
                        </div>
                      </div>

                      @if (sim.status === 'ACTIVE') {
                        <button
                          type="button"
                          (click)="reviewAndApply(sim)"
                          [disabled]="busyId() === sim.id"
                          class="rounded-md bg-stone-900 px-3.5 py-2 text-sm text-white hover:bg-stone-800 disabled:opacity-60 whitespace-nowrap">
                          {{ busyId() === sim.id ? 'Opening…' : 'Review and apply' }}
                        </button>
                      } @else {
                        <a
                          [routerLink]="['/simulate', sim.id]"
                          class="rounded-md border border-stone-200 px-3.5 py-2 text-sm text-stone-700 hover:bg-stone-100 whitespace-nowrap">
                          View simulation
                        </a>
                      }
                    </div>
                  </li>
                }
              </ul>
            }

            <a
              routerLink="/simulate"
              class="flex items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-4 text-sm text-stone-700 hover:border-stone-400 hover:bg-stone-50">
              <span class="grid h-9 w-9 place-items-center rounded-full border border-stone-300 text-stone-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                  class="h-4 w-4">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </span>
              New Simulation
            </a>
          </section>
        </div>

        <!-- Notifications side panel -->
        <aside class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-stone-900">Notifications</h2>
            <span class="text-xs text-stone-500">All</span>
          </div>
          <div class="rounded-2xl border border-stone-200 bg-white shadow-sm divide-y divide-stone-200">
            @if (hasDraftApp()) {
              <a
                [routerLink]="documentsLink()"
                class="block px-4 py-3 hover:bg-stone-50">
                <p class="text-sm font-medium text-stone-900">Please upload your documents</p>
                <p class="text-xs text-stone-500">Required for your application to proceed</p>
              </a>
            }
            <div class="px-4 py-3">
              <p class="text-sm text-stone-700">Welcome to Oper Credits 👋</p>
              <p class="text-xs text-stone-500">Your simulation is saved for 14 days.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `
})
export class DashboardComponent {
  private simulationsApi = inject(SimulationService);
  private applicationsApi = inject(ApplicationService);
  private router = inject(Router);

  readonly housePhoto = HOUSE_PHOTO;
  readonly simulations = signal<SimulationOut[]>([]);
  readonly applications = signal<ApplicationSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly latestApp = computed(() => this.applications()[0] ?? null);
  readonly hasDraftApp = computed(() => this.applications().some(a => a.status === 'DRAFT'));
  readonly documentsLink = computed(() => {
    const app = this.latestApp();
    return app ? ['/applications', app.id, 'documents'] : ['/documents'];
  });

  constructor() {
    forkJoin({
      simulations: this.simulationsApi.list(),
      applications: this.applicationsApi.list()
    }).subscribe({
      next: ({ simulations, applications }) => {
        this.simulations.set(simulations);
        this.applications.set(applications);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('dashboard load failed', err);
        this.loading.set(false);
        this.error.set('Could not load your dashboard.');
      }
    });
  }

  num(v: string | number | null | undefined): number {
    if (v == null) return 0;
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) ? n : 0;
  }

  purposeLabel(p: SimulationOut['project_purpose']): string {
    switch (p) {
      case 'PURCHASE': return 'Purchase';
      case 'BUILD': return 'Build';
      case 'BUYOUT': return 'Buy out';
      case 'RENOVATE': return 'Renovate';
      case 'REFINANCE': return 'Refinance';
      default: return p;
    }
  }

  stepPath(app: ApplicationSummary): string {
    if (app.status === 'SUBMITTED') return 'submitted';
    switch (app.current_step) {
      case 'PROPERTY': return 'property';
      case 'FINANCIALS': return 'financials';
      case 'PERSONAL': return 'personal';
      case 'DONE': return 'submitted';
      default: return 'property';
    }
  }

  reviewAndApply(sim: SimulationOut): void {
    if (this.busyId()) return;
    this.busyId.set(sim.id);
    this.applicationsApi.create(sim.id).subscribe({
      next: (app) => {
        this.busyId.set(null);
        this.router.navigate(['/applications', app.id, 'property']);
      },
      error: (err) => {
        this.busyId.set(null);
        console.error('application create failed', err);
        this.error.set('Could not start the application.');
      }
    });
  }
}
