import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import {
  SimulationService,
  type SimulationOut
} from '../../core/simulation.service';

const CLAIM_TOKEN_KEY = 'oper.claim_token';

@Component({
  selector: 'app-simulator-result',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <section class="space-y-6">
      <header class="space-y-2">
        <p class="text-xs uppercase tracking-widest text-stone-500">Step 2 of 2</p>
        <h1 class="text-2xl font-semibold tracking-tight">Your simulation</h1>
        <p class="text-stone-600 text-sm">
          Indicative figures. Sign up to turn this into an application.
        </p>
      </header>

      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }

      <div class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div>
            <dt class="text-stone-500">Loan amount</dt>
            <dd class="text-lg font-semibold">
              {{ num(simulation()?.loan_amount) | number:'1.0-0' }} EUR
            </dd>
          </div>
          <div>
            <dt class="text-stone-500">Monthly payment</dt>
            <dd class="text-lg font-semibold">
              {{ num(simulation()?.monthly_payment) | number:'1.0-0' }} EUR / mo
            </dd>
          </div>
          <div>
            <dt class="text-stone-500">Duration</dt>
            <dd class="text-lg font-semibold">
              {{ simulation()?.duration_years ?? '—' }} years
            </dd>
          </div>
          <div>
            <dt class="text-stone-500">Interest rate</dt>
            <dd class="text-lg font-semibold">
              {{ num(simulation()?.interest_rate) | number:'1.2-2' }}%
            </dd>
          </div>
          <div>
            <dt class="text-stone-500">Purchase costs</dt>
            <dd class="text-lg font-semibold">
              {{ num(simulation()?.purchase_costs) | number:'1.0-0' }} EUR
            </dd>
          </div>
          <div>
            <dt class="text-stone-500">Credit costs</dt>
            <dd class="text-lg font-semibold">
              {{ num(simulation()?.credit_costs) | number:'1.0-0' }} EUR
            </dd>
          </div>
          <div class="md:col-span-2 border-t border-stone-200 pt-4">
            <dt class="text-stone-500">Total project cost</dt>
            <dd class="text-xl font-semibold">
              {{ num(simulation()?.total_project_cost) | number:'1.0-0' }} EUR
            </dd>
          </div>
        </dl>
      </div>

      <div class="flex items-center justify-between">
        <a routerLink="/simulate" class="text-sm text-stone-600 hover:text-stone-900">
          ← Edit simulation
        </a>
        <a
          [routerLink]="['/signup']"
          [queryParams]="{ claim_token: claimToken(), sim_id: simulationId() }"
          class="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800">
          Sign up to apply
        </a>
      </div>
    </section>
  `
})
export class SimulatorResultComponent {
  private route = inject(ActivatedRoute);
  private simulations = inject(SimulationService);
  private params = toSignal(this.route.paramMap, { requireSync: true });

  readonly simulationId = computed(() => this.params().get('id') ?? '');
  readonly claimToken = signal<string>('');
  readonly simulation = signal<SimulationOut | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    let token: string | null = null;
    try {
      token = sessionStorage.getItem(CLAIM_TOKEN_KEY);
    } catch {
      token = null;
    }
    this.claimToken.set(token ?? '');

    const id = this.simulationId();
    if (id) {
      this.simulations.get(id, token).subscribe({
        next: (sim) => this.simulation.set(sim),
        error: (err) => {
          console.error('simulation fetch failed', err);
          this.error.set('Could not load this simulation.');
        }
      });
    }
  }

  num(v: string | number | null | undefined): number {
    if (v == null) return 0;
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) ? n : 0;
  }
}
