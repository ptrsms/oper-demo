import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ApplicationService,
  type ApplicationOut,
  type PropertyStep
} from '../../../core/application.service';

@Component({
  selector: 'app-property-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="next()" class="space-y-6">
      <header>
        <h2 class="text-lg font-medium">Property</h2>
        <p class="text-sm text-stone-500">Where and what are you buying?</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block text-sm">
          <span class="text-stone-700">Property type</span>
          <select formControlName="property_type" class="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="HOUSE">House</option>
            <option value="APARTMENT">Apartment</option>
            <option value="LAND">Land</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Region</span>
          <select formControlName="property_region" class="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="FLANDERS">Flanders</option>
            <option value="WALLONIA">Wallonia</option>
            <option value="BRUSSELS">Brussels</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Property price (EUR)</span>
          <input type="number" formControlName="property_price" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Use</span>
          <select formControlName="property_use" class="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="LIVING">Living</option>
            <option value="RENTAL">Rental</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Type of sale</span>
          <select formControlName="type_of_sale" class="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
            <option value="PRIVATE">Private</option>
            <option value="PUBLIC">Public</option>
            <option value="NEW_BUILD">New build</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">EPC score</span>
          <input formControlName="epc_score" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm md:col-span-2">
          <span class="text-stone-700">Street</span>
          <input formControlName="street" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">House number</span>
          <input formControlName="house_number" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Box (optional)</span>
          <input formControlName="box" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Postal code</span>
          <input formControlName="postal_code" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">City</span>
          <input formControlName="city" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="text-stone-700">Own funds (EUR)</span>
          <input type="number" formControlName="own_funds" class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
      </div>

      <label class="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" formControlName="main_residence" class="rounded border-stone-300" />
        Main residence
      </label>

      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }

      <div class="flex justify-end">
        <button
          type="submit"
          [disabled]="saving()"
          class="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 disabled:opacity-60">
          {{ saving() ? 'Saving…' : 'Save & continue' }}
        </button>
      </div>
    </form>
  `
})
export class PropertyStepComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private applications = inject(ApplicationService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    property_type: ['HOUSE', Validators.required],
    property_region: ['FLANDERS', Validators.required],
    property_price: [300000, [Validators.required, Validators.min(1)]],
    property_use: ['LIVING', Validators.required],
    main_residence: [true],
    type_of_sale: ['PRIVATE', Validators.required],
    epc_score: [''],
    street: ['', Validators.required],
    house_number: ['', Validators.required],
    box: [''],
    city: ['', Validators.required],
    postal_code: ['', Validators.required],
    own_funds: [60000, [Validators.required, Validators.min(0)]]
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
    this.form.patchValue({
      property_type: app.property_type,
      property_region: app.property_region,
      property_price: Number(app.property_price) || 0,
      property_use: app.property_use,
      main_residence: app.main_residence,
      type_of_sale: app.type_of_sale,
      epc_score: app.epc_score != null ? String(app.epc_score) : '',
      street: app.street ?? '',
      house_number: app.house_number ?? '',
      box: app.box ?? '',
      city: app.city ?? '',
      postal_code: app.postal_code ?? '',
      own_funds: Number(app.own_funds) || 0
    });
  }

  next(): void {
    if (this.form.invalid || this.saving()) return;
    const id = this.applicationId();
    if (!id) return;
    const raw = this.form.getRawValue();
    const payload: PropertyStep = {
      property_type: raw.property_type as 'HOUSE' | 'APARTMENT' | 'LAND',
      property_region: raw.property_region as 'FLANDERS' | 'WALLONIA' | 'BRUSSELS',
      property_price: raw.property_price,
      property_use: raw.property_use as 'LIVING' | 'RENTAL',
      main_residence: raw.main_residence,
      type_of_sale: raw.type_of_sale as 'PRIVATE' | 'PUBLIC' | 'NEW_BUILD',
      epc_score: raw.epc_score ? Number(raw.epc_score) || null : null,
      street: raw.street,
      house_number: raw.house_number,
      box: raw.box || null,
      city: raw.city,
      postal_code: raw.postal_code,
      own_funds: raw.own_funds
    };
    this.saving.set(true);
    this.error.set(null);
    this.applications.patchProperty(id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['../financials'], { relativeTo: this.route });
      },
      error: (err) => {
        this.saving.set(false);
        console.error('patch property failed', err);
        this.error.set('Could not save. Please try again.');
      }
    });
  }
}
