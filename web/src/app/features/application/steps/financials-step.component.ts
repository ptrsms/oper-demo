import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApplicationService,
  type ApplicationOut,
  type FinancialsStep
} from '../../../core/application.service';

type IncomeType =
  | 'SALARY'
  | 'SELF_EMPLOYED'
  | 'CHILD_BENEFIT'
  | 'MEAL_VOUCHERS'
  | 'COMPANY_CAR'
  | 'HEALTH_INSURANCE'
  | 'RENTAL'
  | 'OTHER';
type ExpenseType = 'RENT' | 'EXISTING_LOAN' | 'ALIMONY' | 'OTHER';

@Component({
  selector: 'app-financials-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="next()" class="space-y-8">
      <header>
        <h2 class="text-lg font-medium">Financials — Borrower 1</h2>
        <p class="text-sm text-stone-500">Income and recurring expenses.</p>
      </header>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-sm">Incomes</h3>
          <button type="button" (click)="addIncome()"
            class="text-sm text-stone-700 underline">+ Add income</button>
        </div>
        <div formArrayName="incomes" class="space-y-3">
          @for (row of incomes.controls; track $index) {
            <div [formGroupName]="$index" class="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <label class="block text-sm">
                <span class="text-stone-700">Type</span>
                <select formControlName="income_type" class="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                  <option value="SALARY">Salary</option>
                  <option value="SELF_EMPLOYED">Self-employed</option>
                  <option value="RENTAL">Rental</option>
                  <option value="CHILD_BENEFIT">Child benefit</option>
                  <option value="MEAL_VOUCHERS">Meal vouchers</option>
                  <option value="COMPANY_CAR">Company car</option>
                  <option value="HEALTH_INSURANCE">Health insurance</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label class="block text-sm">
                <span class="text-stone-700">Monthly amount (EUR)</span>
                <input type="number" formControlName="monthly_amount"
                  class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
              <button type="button" (click)="removeIncome($index)"
                class="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">
                Remove
              </button>
            </div>
          }
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-sm">Expenses</h3>
          <button type="button" (click)="addExpense()"
            class="text-sm text-stone-700 underline">+ Add expense</button>
        </div>
        <div formArrayName="expenses" class="space-y-3">
          @for (row of expenses.controls; track $index) {
            <div [formGroupName]="$index" class="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end">
              <label class="block text-sm">
                <span class="text-stone-700">Type</span>
                <select formControlName="expense_type" class="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                  <option value="EXISTING_LOAN">Existing loan</option>
                  <option value="ALIMONY">Alimony</option>
                  <option value="RENT">Rent</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label class="block text-sm">
                <span class="text-stone-700">Monthly amount (EUR)</span>
                <input type="number" formControlName="monthly_amount"
                  class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
              <label class="block text-sm">
                <span class="text-stone-700">Description (optional)</span>
                <input formControlName="description"
                  class="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
              <button type="button" (click)="removeExpense($index)"
                class="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">
                Remove
              </button>
            </div>
          }
        </div>
      </section>

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
export class FinancialsStepComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private applications = inject(ApplicationService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    incomes: this.fb.array<FormGroup>([this.newIncome()]),
    expenses: this.fb.array<FormGroup>([])
  });

  get incomes(): FormArray<FormGroup> {
    return this.form.controls.incomes;
  }
  get expenses(): FormArray<FormGroup> {
    return this.form.controls.expenses;
  }

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
    if (borrower && borrower.incomes.length > 0) {
      this.incomes.clear();
      for (const inc of borrower.incomes) {
        this.incomes.push(
          this.fb.nonNullable.group({
            income_type: [inc.income_type, Validators.required],
            monthly_amount: [
              Number(inc.monthly_amount) || 0,
              [Validators.required, Validators.min(0)]
            ]
          })
        );
      }
    }
    if (app.expenses.length > 0) {
      this.expenses.clear();
      for (const e of app.expenses) {
        this.expenses.push(
          this.fb.nonNullable.group({
            expense_type: [e.expense_type, Validators.required],
            monthly_amount: [
              Number(e.monthly_amount) || 0,
              [Validators.required, Validators.min(0)]
            ],
            description: [e.description ?? '']
          })
        );
      }
    }
  }

  private newIncome(): FormGroup {
    return this.fb.nonNullable.group({
      income_type: ['SALARY', Validators.required],
      monthly_amount: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private newExpense(): FormGroup {
    return this.fb.nonNullable.group({
      expense_type: ['OTHER', Validators.required],
      monthly_amount: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    });
  }

  addIncome(): void {
    this.incomes.push(this.newIncome());
  }
  removeIncome(i: number): void {
    this.incomes.removeAt(i);
  }
  addExpense(): void {
    this.expenses.push(this.newExpense());
  }
  removeExpense(i: number): void {
    this.expenses.removeAt(i);
  }

  next(): void {
    if (this.form.invalid || this.saving()) return;
    const id = this.applicationId();
    if (!id) return;
    const raw = this.form.getRawValue();
    const payload: FinancialsStep = {
      borrowers: [
        {
          position: 1,
          incomes: raw.incomes.map((row: any) => ({
            income_type: row.income_type as IncomeType,
            monthly_amount: row.monthly_amount
          }))
        }
      ],
      expenses: raw.expenses.map((row: any) => ({
        expense_type: row.expense_type as ExpenseType,
        monthly_amount: row.monthly_amount,
        description: row.description || null
      }))
    };
    this.saving.set(true);
    this.error.set(null);
    this.applications.patchFinancials(id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['../personal'], { relativeTo: this.route });
      },
      error: (err) => {
        this.saving.set(false);
        console.error('patch financials failed', err);
        this.error.set('Could not save. Please try again.');
      }
    });
  }
}
