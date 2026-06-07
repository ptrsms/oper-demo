import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { SimulationService, type SimulationOut } from '../../core/simulation.service';
import type { components } from '../../api/schema';

type ProjectPurpose = components['schemas']['ProjectPurpose'];
type IncomeType = components['schemas']['IncomeType'];
type ExpenseType = components['schemas']['ExpenseType'];

const CLAIM_TOKEN_KEY = 'oper.claim_token';
const DRAFT_KEY = 'oper.sim_draft';

interface PurposeCard {
  value: ProjectPurpose;
  label: string;
  icon: string;
}

const PURPOSE_CARDS: PurposeCard[] = [
  { value: 'PURCHASE',  label: 'Buy a property',       icon: 'M15.5 14a4.5 4.5 0 10-3.5 1.6L17 21l2-2-4-4M10 9.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0' },
  { value: 'BUILD',     label: 'Build a new property', icon: 'M14 4l-2-2-2 2m0 0L2 12h3v8h14v-8h3L12 2' },
  { value: 'BUYOUT',    label: 'Buy out',              icon: 'M3 12L12 3l9 9M5 10v10h14V10' },
  { value: 'RENOVATE',  label: 'Renovate my property', icon: 'M14 6l4 4-9 9H5v-4l9-9zM12 4l4 4 2-2-4-4-2 2z' },
  { value: 'REFINANCE', label: 'Refinance my mortgage', icon: 'M12 3a3 3 0 00-3 3v.5a1.5 1.5 0 003 0V6m0 0a3 3 0 013 3c0 4-6 4-6 8a3 3 0 003 3m0 0v1m0-1a3 3 0 003-3' }
];

const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  SALARY: 'Salary (employee)',
  SELF_EMPLOYED: 'Self-employed/Business owner',
  CHILD_BENEFIT: 'Child benefit',
  MEAL_VOUCHERS: 'Meal vouchers',
  COMPANY_CAR: 'Company car',
  HEALTH_INSURANCE: 'Health insurance',
  RENTAL: 'Rental',
  OTHER: 'Other'
};

const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  RENT: 'Rent',
  EXISTING_LOAN: 'Existing loan',
  ALIMONY: 'Alimony',
  OTHER: 'Other'
};

interface SimDraft {
  purpose: ProjectPurpose;
  numberOfBorrowers: 1 | 2;
  property: {
    property_type: string;
    property_region: string;
    property_price: number;
    property_use: string;
    main_residence: boolean;
    type_of_sale: string;
    epc_score: number | null;
  };
  contribution: {
    own_funds: number;
    duration_years: number;
  };
  incomes: Array<{ income_type: IncomeType; monthly_amount: number }>;
  expenses: Array<{ expense_type: ExpenseType; monthly_amount: number; description: string }>;
  personal: {
    date_of_birth: string;
    dependents: number;
  };
}

type SimStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, RouterLink],
  template: `
    <div class="w-full">
      <!-- steps 1 & 2 are full-width, no sidebar -->
      @if (step() <= 2) {
        <div class="mx-auto max-w-xl px-6 py-16">
          @if (step() === 1) {
            <header class="space-y-2 mb-8">
              <h1 class="text-2xl font-semibold tracking-tight text-stone-900">Welcome to your home journey!</h1>
              <p class="text-sm text-stone-600">What is project purpose?</p>
            </header>

            <div class="space-y-3">
              @for (card of cards; track card.value) {
                <button
                  type="button"
                  (click)="pickPurpose(card.value)"
                  class="w-full flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-left hover:border-stone-400 hover:shadow-sm transition">
                  <span class="grid h-9 w-9 place-items-center rounded-lg bg-stone-100 text-stone-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                      <path [attr.d]="card.icon" />
                    </svg>
                  </span>
                  <span class="font-medium text-sm text-stone-900">{{ card.label }}</span>
                </button>
              }
            </div>
          }

          @if (step() === 2) {
            <header class="space-y-2 mb-8">
              <h1 class="text-2xl font-semibold tracking-tight text-stone-900">Number of borrowers</h1>
              <p class="text-sm text-stone-600">Who is applying for the loan?</p>
            </header>

            <div class="space-y-3">
              <button
                type="button"
                (click)="pickBorrowers(1)"
                class="w-full flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-left hover:border-stone-400 hover:shadow-sm transition">
                <span class="grid h-9 w-9 place-items-center rounded-lg bg-stone-100 text-stone-700">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <span class="font-medium text-sm text-stone-900">I'm applying by myself</span>
              </button>

              <button
                type="button"
                (click)="pickBorrowers(2)"
                class="w-full flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-left hover:border-stone-400 hover:shadow-sm transition">
                <span class="grid h-9 w-9 place-items-center rounded-lg bg-stone-100 text-stone-700">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    <circle cx="9" cy="7" r="4"/>
                  </svg>
                </span>
                <span class="font-medium text-sm text-stone-900">I'm applying with someone</span>
              </button>

              <button
                type="button"
                (click)="back()"
                class="w-full rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-center text-sm text-stone-700 hover:border-stone-400 transition">
                Back
              </button>
            </div>
          }
        </div>
      }

      <!-- steps 3-8 have the two-column layout with stepper sidebar -->
      @if (step() >= 3) {
        <div class="flex">
          <!-- stepper sidebar -->
          <aside class="w-[280px] shrink-0 border-r border-stone-200 bg-white min-h-[calc(100vh-56px)] px-4 py-8">
            <div class="space-y-2">
              <!-- About project group -->
              <div [class]="groupClass('about')">
                <div class="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                    class="h-4 w-4 text-stone-500">
                    <circle cx="12" cy="12" r="9"/>
                  </svg>
                  <span>About project</span>
                </div>
                @if (currentGroup() === 'about') {
                  <div class="space-y-1 pl-2 pb-2">
                    <div [class]="subStepClass(3)">
                      <span class="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md w-full">
                        @if (step() > 3) {
                          <svg class="h-3.5 w-3.5 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
                        } @else {
                          <span [class]="dotClass(3)"></span>
                        }
                        Project details
                      </span>
                    </div>
                    <div [class]="subStepClass(4)">
                      <span class="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md w-full">
                        @if (step() > 4) {
                          <svg class="h-3.5 w-3.5 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
                        } @else {
                          <span [class]="dotClass(4)"></span>
                        }
                        Your contribution
                      </span>
                    </div>
                  </div>
                }
              </div>

              <!-- Financial details group -->
              <div [class]="groupClass('financial')">
                <div class="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                    class="h-4 w-4 text-stone-500">
                    <circle cx="12" cy="12" r="9"/>
                  </svg>
                  <span>Financial details</span>
                </div>
                @if (currentGroup() === 'financial') {
                  <div class="space-y-1 pl-2 pb-2">
                    <div [class]="subStepClass(5)">
                      <span class="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md w-full">
                        @if (step() > 5) {
                          <svg class="h-3.5 w-3.5 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
                        } @else {
                          <span [class]="dotClass(5)"></span>
                        }
                        Your income
                      </span>
                    </div>
                    <div [class]="subStepClass(6)">
                      <span class="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md w-full">
                        @if (step() > 6) {
                          <svg class="h-3.5 w-3.5 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>
                        } @else {
                          <span [class]="dotClass(6)"></span>
                        }
                        Your expenses
                      </span>
                    </div>
                  </div>
                }
              </div>

              <!-- Personal details -->
              <div [class]="groupClass('personal')">
                <div class="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                    class="h-4 w-4 text-stone-500">
                    <circle cx="12" cy="12" r="9"/>
                  </svg>
                  <span>Personal details</span>
                </div>
              </div>

              <!-- Simulation report -->
              <div [class]="groupClass('report')">
                <div class="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                    class="h-4 w-4 text-stone-500">
                    <circle cx="12" cy="12" r="9"/>
                  </svg>
                  <span>Simulation report</span>
                </div>
              </div>
            </div>
          </aside>

          <!-- content -->
          <section class="flex-1 px-6 py-10">
            <!-- step 3: project details -->
            @if (step() === 3) {
              <div class="mx-auto max-w-md">
                <header class="space-y-1 mb-6">
                  <h1 class="text-xl font-semibold text-stone-900">Project details</h1>
                  <p class="text-sm text-stone-600">Provide us some more details about your project.</p>
                </header>

                <form [formGroup]="projectForm" class="space-y-4">
                  <label class="block text-sm">
                    <span class="text-stone-600">Type of property</span>
                    <select formControlName="property_type" class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
                      <option value="HOUSE">House</option>
                      <option value="APARTMENT">Apartment</option>
                      <option value="LAND">Land</option>
                    </select>
                  </label>

                  <label class="block text-sm">
                    <span class="text-stone-600">Project location</span>
                    <select formControlName="property_region" class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
                      <option value="FLANDERS">Flanders</option>
                      <option value="WALLONIA">Wallonia</option>
                      <option value="BRUSSELS">Brussels</option>
                    </select>
                  </label>

                  <label class="block text-sm">
                    <span class="text-stone-600">Property price</span>
                    <div class="mt-1 flex items-center rounded-md border border-stone-300 bg-white focus-within:border-stone-500">
                      <span class="pl-3 pr-1 text-stone-500">€</span>
                      <input type="number" formControlName="property_price" class="block w-full bg-transparent px-2 py-2 text-sm focus:outline-none" />
                    </div>
                  </label>

                  <label class="block text-sm">
                    <span class="text-stone-600">Property will be used for</span>
                    <select formControlName="property_use" class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
                      <option value="LIVING">Living</option>
                      <option value="RENTAL">Rental</option>
                    </select>
                  </label>

                  <label class="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" formControlName="main_residence" class="rounded border-stone-300" />
                    Main &amp; only residence
                  </label>

                  <label class="block text-sm">
                    <span class="text-stone-600">Type of sale</span>
                    <select formControlName="type_of_sale" class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none">
                      <option value="PRIVATE">Private sale</option>
                      <option value="PUBLIC">Public sale</option>
                      <option value="NEW_BUILD">New build</option>
                    </select>
                  </label>

                  <label class="block text-sm">
                    <span class="text-stone-600">EPC score</span>
                    <div class="mt-1 flex items-center rounded-md border border-stone-300 bg-white focus-within:border-stone-500">
                      <input type="number" formControlName="epc_score" placeholder="100" class="block w-full bg-transparent px-3 py-2 text-sm focus:outline-none" />
                      <span class="pr-3 text-stone-500 text-xs">kWh/m²</span>
                    </div>
                  </label>

                  <button type="button" disabled class="w-full inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-400 cursor-not-allowed">
                    <span>+</span> I want to renovate
                  </button>

                  <div class="pt-4">
                    <h2 class="text-base font-semibold text-stone-900 mb-2">Additional refinance</h2>
                    <p class="text-xs text-stone-500 mb-3">
                      You can provide details of other loans that you wish to refinance. If the mortgage contains multiple parts, add them as tranches.
                    </p>
                    <button type="button" disabled class="w-full inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-400 cursor-not-allowed mb-2">
                      <span>+</span> Add mortgage loan to refinance
                    </button>
                    <button type="button" disabled class="w-full inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-400 cursor-not-allowed">
                      <span>+</span> Add non-mortgage loan to refinance
                    </button>
                  </div>

                  <button
                    type="button"
                    (click)="goto(4)"
                    [disabled]="projectForm.invalid"
                    class="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400">
                    Next
                  </button>
                </form>
              </div>
            }

            <!-- step 4: your contribution -->
            @if (step() === 4) {
              <div class="mx-auto max-w-md">
                <header class="space-y-1 mb-6">
                  <h1 class="text-xl font-semibold text-stone-900">Your contribution</h1>
                  <p class="text-sm text-stone-600">
                    Here you see the personal contribution that you registered previously.
                    In case you've provided also an additional collateral, we need some more details about the property.
                  </p>
                </header>

                <form [formGroup]="contributionForm" class="space-y-4">
                  <label class="block text-sm">
                    <span class="text-stone-600">Own funds</span>
                    <div class="mt-1 flex items-center rounded-md border border-stone-300 bg-white focus-within:border-stone-500">
                      <span class="pl-3 pr-1 text-stone-500">€</span>
                      <input type="number" formControlName="own_funds" placeholder="Own funds" class="block w-full bg-transparent px-2 py-2 text-sm focus:outline-none" />
                    </div>
                  </label>

                  <label class="block text-sm">
                    <span class="text-stone-600">Duration (years)</span>
                    <input type="number" min="5" max="30" formControlName="duration_years"
                      class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none" />
                  </label>

                  <button type="button" disabled class="w-full inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-400 cursor-not-allowed">
                    <span>+</span> Add collateral
                  </button>
                  <button type="button" disabled class="w-full inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-400 cursor-not-allowed">
                    <span>+</span> Add a bridge loan
                  </button>

                  <button
                    type="button"
                    (click)="goto(5)"
                    [disabled]="contributionForm.invalid"
                    class="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400">
                    Next
                  </button>
                  <button
                    type="button"
                    (click)="goto(3)"
                    class="w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100">
                    Back
                  </button>
                </form>
              </div>
            }

            <!-- step 5: your income -->
            @if (step() === 5) {
              <div class="mx-auto max-w-md">
                <header class="space-y-1 mb-6">
                  <h1 class="text-xl font-semibold text-stone-900">Your income</h1>
                  <p class="text-sm text-stone-600">
                    An accurate simulation starts with knowing your income — it helps us tailor the loan to your needs.
                  </p>
                </header>

                <form [formGroup]="incomeForm">
                  <div class="rounded-lg border border-stone-200 bg-white p-4">
                    <p class="text-sm font-semibold text-stone-900 mb-3">Borrower 1</p>
                    <div formArrayName="incomes" class="space-y-3">
                      @for (row of incomesArray().controls; track $index; let i = $index) {
                        <div [formGroupName]="i" class="space-y-2">
                          <div class="grid grid-cols-2 gap-3">
                            <label class="block text-xs">
                              <span class="text-stone-600 inline-flex items-center gap-1">
                                Income type
                                <svg class="h-3 w-3 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2.5-2.5 4M12 17.5h.01"/></svg>
                              </span>
                              <select formControlName="income_type" class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-2 py-2 text-sm focus:border-stone-500 focus:outline-none">
                                <option value="">Please select</option>
                                @for (opt of incomeTypeOptions; track opt.value) {
                                  <option [value]="opt.value">{{ opt.label }}</option>
                                }
                              </select>
                            </label>
                            <label class="block text-xs">
                              <span class="text-stone-600">Monthly</span>
                              <div class="mt-1 flex items-center rounded-md border border-stone-300 bg-white focus-within:border-stone-500">
                                <span class="pl-2 pr-1 text-stone-500">€</span>
                                <input type="number" formControlName="monthly_amount" placeholder="Monthly" class="block w-full bg-transparent px-1 py-2 text-sm focus:outline-none" />
                              </div>
                            </label>
                          </div>
                          @if (incomesArray().length > 1) {
                            <button type="button" (click)="removeIncome(i)" class="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1">
                              <span>×</span> Remove
                            </button>
                          }
                        </div>
                      }
                    </div>

                    <button type="button" (click)="addIncome()" class="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
                      <span>+</span> More incomes
                    </button>
                  </div>

                  <div class="mt-4 space-y-2">
                    <button
                      type="button"
                      (click)="goto(6)"
                      [disabled]="!incomeFormValid()"
                      class="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400">
                      Next
                    </button>
                    <button
                      type="button"
                      (click)="goto(4)"
                      class="w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100">
                      Back
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- step 6: your expenses -->
            @if (step() === 6) {
              <div class="mx-auto max-w-md">
                <header class="space-y-1 mb-6">
                  <h1 class="text-xl font-semibold text-stone-900">Your expenses</h1>
                  <p class="text-sm text-stone-600">
                    To get a complete picture of your finances and provide an accurate loan simulation,
                    we also need to understand your current expenses and existing commitments.
                  </p>
                </header>

                <form [formGroup]="expenseForm">
                  <div formArrayName="expenses" class="space-y-3">
                    @for (row of expensesArray().controls; track $index; let i = $index) {
                      <div [formGroupName]="i" class="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
                        <div class="grid grid-cols-2 gap-3">
                          <label class="block text-xs">
                            <span class="text-stone-600">Expense type</span>
                            <select formControlName="expense_type" class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-2 py-2 text-sm focus:border-stone-500 focus:outline-none">
                              @for (opt of expenseTypeOptions; track opt.value) {
                                <option [value]="opt.value">{{ opt.label }}</option>
                              }
                            </select>
                          </label>
                          <label class="block text-xs">
                            <span class="text-stone-600">Monthly</span>
                            <div class="mt-1 flex items-center rounded-md border border-stone-300 bg-white focus-within:border-stone-500">
                              <span class="pl-2 pr-1 text-stone-500">€</span>
                              <input type="number" formControlName="monthly_amount" class="block w-full bg-transparent px-1 py-2 text-sm focus:outline-none" />
                            </div>
                          </label>
                        </div>
                        <label class="block text-xs">
                          <span class="text-stone-600">Description (optional)</span>
                          <input type="text" formControlName="description" class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none" />
                        </label>
                        <button type="button" (click)="removeExpense(i)" class="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1">
                          <span>×</span> Remove
                        </button>
                      </div>
                    }
                  </div>

                  <button type="button" (click)="addExpense()" class="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
                    <span>+</span> Add expense
                  </button>

                  <div class="mt-4 space-y-2">
                    <button
                      type="button"
                      (click)="goto(7)"
                      class="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800">
                      Next
                    </button>
                    <button
                      type="button"
                      (click)="goto(5)"
                      class="w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100">
                      Back
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- step 7: personal details -->
            @if (step() === 7) {
              <div class="mx-auto max-w-md">
                <header class="space-y-1 mb-6">
                  <h1 class="text-xl font-semibold text-stone-900">Personal details</h1>
                  <p class="text-sm text-stone-600">Let's get to know more about you</p>
                </header>

                <form [formGroup]="personalForm">
                  <div class="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
                    <p class="text-sm font-semibold text-stone-900">Borrower 1</p>
                    <label class="block text-sm">
                      <span class="text-stone-600">Date of birth</span>
                      <input type="date" formControlName="date_of_birth" placeholder="dd/mm/yyyy"
                        class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none" />
                    </label>
                    <label class="block text-sm">
                      <span class="text-stone-600">Number of dependents</span>
                      <input type="number" min="0" formControlName="dependents" placeholder="Number of dependents"
                        class="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none" />
                    </label>
                  </div>

                  <div class="mt-4 space-y-2">
                    <button
                      type="button"
                      (click)="submitSimulation()"
                      [disabled]="personalForm.invalid || submitting()"
                      class="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400">
                      {{ submitting() ? 'Simulating…' : 'Next' }}
                    </button>
                    <button
                      type="button"
                      (click)="goto(6)"
                      class="w-full rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100">
                      Back
                    </button>
                  </div>

                  @if (error()) {
                    <p class="mt-3 text-sm text-red-600">{{ error() }}</p>
                  }
                </form>
              </div>
            }

            <!-- step 8: simulation report -->
            @if (step() === 8 && simulation()) {
              <div class="mx-auto max-w-5xl space-y-6">
                <!-- header strip -->
                <div class="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <img src="https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=200&h=120&fit=crop"
                       class="h-16 w-24 rounded-md object-cover" alt="" />

                  <div class="grid grid-cols-4 flex-1 gap-6">
                    <div>
                      <p class="text-xs text-stone-500">Loan amount</p>
                      <p class="text-base font-semibold text-stone-900">€ {{ num(simulation()!.loan_amount) | number:'1.0-0' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-stone-500">Monthly payment</p>
                      <p class="text-base font-semibold text-stone-900">€ {{ num(simulation()!.monthly_payment) | number:'1.0-0' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-stone-500">Duration</p>
                      <p class="text-base font-semibold text-stone-900">{{ simulation()!.duration_years }} Years</p>
                    </div>
                    <div>
                      <p class="text-xs text-stone-500">Interest rate</p>
                      <p class="text-base font-semibold text-stone-900">{{ num(simulation()!.interest_rate) | number:'1.2-2' }}%</p>
                    </div>
                  </div>

                  <a
                    [routerLink]="['/signup']"
                    [queryParams]="{ claim_token: claimToken(), sim_id: simulation()!.id }"
                    class="rounded-md bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 whitespace-nowrap">
                    Save and log-in for 14 days
                  </a>
                </div>

                <!-- rate adjustments info row -->
                <div class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                  <span class="font-medium">0.00% Rate Adjustments Applied</span>
                  <span class="text-stone-500"> · Activate discounts now to reduce your monthly payment</span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <!-- mortgage overview -->
                  <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="font-semibold text-stone-900">Mortgage overview</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <div class="rounded-lg bg-stone-900 px-4 py-3 text-white">
                        <p class="text-xs text-stone-300">Loan amount</p>
                        <p class="text-base font-semibold">€ {{ num(simulation()!.loan_amount) | number:'1.0-0' }}</p>
                      </div>
                      <div class="rounded-lg bg-stone-900 px-4 py-3 text-white">
                        <p class="text-xs text-stone-300">Own funds</p>
                        <p class="text-base font-semibold">€ {{ num(simulation()!.own_funds) | number:'1.0-0' }}</p>
                      </div>
                    </div>
                    <div class="rounded-lg bg-stone-900 px-4 py-3 text-white">
                      <p class="text-xs text-stone-300">Duration</p>
                      <p class="text-base font-semibold">{{ simulation()!.duration_years }} Years</p>
                    </div>
                  </div>

                  <!-- costs -->
                  <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="font-semibold text-stone-900">Costs</h3>
                      <a class="text-xs text-stone-500 hover:text-stone-700 cursor-default">More Details</a>
                    </div>
                    <div class="space-y-2.5 text-sm">
                      <div class="flex items-center justify-between">
                        <span class="text-stone-700 font-medium">Total project cost</span>
                        <span class="font-semibold text-stone-900">€ {{ num(simulation()!.total_project_cost) | number:'1.0-0' }}</span>
                      </div>
                      <div class="border-t border-stone-200 pt-2.5 space-y-1.5">
                        <div class="flex items-center justify-between text-stone-600">
                          <span>Purchase price</span>
                          <span>€ {{ num(simulation()!.property_price) | number:'1.0-0' }}</span>
                        </div>
                        <div class="flex items-center justify-between text-stone-600">
                          <span>Purchase costs</span>
                          <span>€ {{ num(simulation()!.purchase_costs) | number:'1.0-0' }}</span>
                        </div>
                        <div class="flex items-center justify-between text-stone-600">
                          <span>Credit costs</span>
                          <span>€ {{ num(simulation()!.credit_costs) | number:'1.0-0' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- product recommendation -->
                <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 class="font-semibold text-stone-900 mb-3">Product recommendation</h3>
                  <div class="rounded-lg border border-stone-200 p-4">
                    <p class="text-xs text-stone-500">Fixed rate</p>
                    <p class="font-semibold text-stone-900 mb-3">Fixed</p>
                    <p class="text-xs text-stone-500">Monthly payment</p>
                    <p class="font-semibold text-stone-900">€ {{ num(simulation()!.monthly_payment) | number:'1.0-0' }}</p>
                  </div>
                </div>
              </div>
            }
          </section>
        </div>
      }
    </div>
  `
})
export class SimulatorComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private simulations = inject(SimulationService);

  readonly cards = PURPOSE_CARDS;
  readonly incomeTypeOptions = Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => ({ value: value as IncomeType, label }));
  readonly expenseTypeOptions = Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => ({ value: value as ExpenseType, label }));

  readonly step = signal<SimStep>(1);
  readonly purpose = signal<ProjectPurpose>('PURCHASE');
  readonly numberOfBorrowers = signal<1 | 2>(1);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly simulation = signal<SimulationOut | null>(null);
  readonly claimToken = signal<string>('');

  readonly projectForm = this.fb.nonNullable.group({
    property_type: ['HOUSE', Validators.required],
    property_region: ['FLANDERS', Validators.required],
    property_price: [300000, [Validators.required, Validators.min(1)]],
    property_use: ['LIVING', Validators.required],
    main_residence: [false],
    type_of_sale: ['PRIVATE', Validators.required],
    epc_score: [null as number | null]
  });

  readonly contributionForm = this.fb.nonNullable.group({
    own_funds: [60000, [Validators.required, Validators.min(0)]],
    duration_years: [25, [Validators.required, Validators.min(5), Validators.max(30)]]
  });

  readonly incomeForm = this.fb.nonNullable.group({
    incomes: this.fb.array<FormGroup>([this.makeIncomeRow()])
  });

  readonly expenseForm = this.fb.nonNullable.group({
    expenses: this.fb.array<FormGroup>([])
  });

  readonly personalForm = this.fb.nonNullable.group({
    date_of_birth: ['', Validators.required],
    dependents: [0, [Validators.required, Validators.min(0)]]
  });

  readonly currentGroup = computed(() => {
    const s = this.step();
    if (s === 3 || s === 4) return 'about';
    if (s === 5 || s === 6) return 'financial';
    if (s === 7) return 'personal';
    if (s === 8) return 'report';
    return null;
  });

  constructor() {
    this.restoreDraft();
  }

  incomesArray(): FormArray<FormGroup> {
    return this.incomeForm.get('incomes') as FormArray<FormGroup>;
  }

  expensesArray(): FormArray<FormGroup> {
    return this.expenseForm.get('expenses') as FormArray<FormGroup>;
  }

  private makeIncomeRow(): FormGroup {
    return this.fb.nonNullable.group({
      income_type: ['', Validators.required],
      monthly_amount: [null as number | null, [Validators.required, Validators.min(0)]]
    });
  }

  private makeExpenseRow(): FormGroup {
    return this.fb.nonNullable.group({
      expense_type: ['OTHER', Validators.required],
      monthly_amount: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    });
  }

  addIncome(): void {
    this.incomesArray().push(this.makeIncomeRow());
  }

  removeIncome(i: number): void {
    if (this.incomesArray().length > 1) {
      this.incomesArray().removeAt(i);
    }
  }

  addExpense(): void {
    this.expensesArray().push(this.makeExpenseRow());
  }

  removeExpense(i: number): void {
    this.expensesArray().removeAt(i);
  }

  incomeFormValid(): boolean {
    if (this.incomesArray().length === 0) return false;
    return this.incomeForm.valid;
  }

  pickPurpose(value: ProjectPurpose): void {
    this.purpose.set(value);
    this.persistDraft();
    this.step.set(2);
  }

  pickBorrowers(n: 1 | 2): void {
    this.numberOfBorrowers.set(n);
    this.persistDraft();
    this.step.set(3);
  }

  goto(s: SimStep): void {
    this.persistDraft();
    this.step.set(s);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }

  back(): void {
    const s = this.step();
    if (s > 1) {
      this.step.set((s - 1) as SimStep);
    }
  }

  groupClass(group: 'about' | 'financial' | 'personal' | 'report'): string {
    const active = this.currentGroup() === group;
    return active
      ? 'rounded-lg bg-stone-100 text-stone-900'
      : 'rounded-lg text-stone-500';
  }

  subStepClass(stepNum: SimStep): string {
    const isCurrent = this.step() === stepNum;
    return isCurrent
      ? 'rounded-md bg-white border border-stone-200 text-stone-900'
      : 'text-stone-500';
  }

  dotClass(stepNum: SimStep): string {
    const isCurrent = this.step() === stepNum;
    return isCurrent
      ? 'h-2 w-2 rounded-full bg-stone-900'
      : 'h-2 w-2 rounded-full border border-stone-300';
  }

  num(v: string | number | null | undefined): number {
    if (v == null) return 0;
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) ? n : 0;
  }

  submitSimulation(): void {
    if (this.personalForm.invalid || this.submitting()) return;
    this.persistDraft();
    this.submitting.set(true);
    this.error.set(null);

    const proj = this.projectForm.getRawValue();
    const contrib = this.contributionForm.getRawValue();

    const payload = {
      project_purpose: this.purpose(),
      number_of_borrowers: this.numberOfBorrowers(),
      property_type: proj.property_type as 'HOUSE' | 'APARTMENT' | 'LAND',
      property_region: proj.property_region as 'FLANDERS' | 'WALLONIA' | 'BRUSSELS',
      property_price: proj.property_price,
      property_use: proj.property_use as 'LIVING' | 'RENTAL',
      main_residence: proj.main_residence,
      type_of_sale: proj.type_of_sale as 'PRIVATE' | 'PUBLIC' | 'NEW_BUILD',
      epc_score: proj.epc_score != null && proj.epc_score !== ('' as unknown as number)
        ? Number(proj.epc_score) || null
        : null,
      own_funds: contrib.own_funds,
      duration_years: contrib.duration_years
    };

    this.simulations.create(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.claim_token) {
          try {
            sessionStorage.setItem(CLAIM_TOKEN_KEY, res.claim_token);
            this.claimToken.set(res.claim_token);
          } catch { /* ignore */ }
        }
        this.simulation.set(res.simulation);
        this.step.set(8);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('simulation create failed', err);
        this.error.set('Something went wrong. Please try again.');
      }
    });
  }

  private persistDraft(): void {
    const draft: SimDraft = {
      purpose: this.purpose(),
      numberOfBorrowers: this.numberOfBorrowers(),
      property: this.projectForm.getRawValue() as SimDraft['property'],
      contribution: this.contributionForm.getRawValue(),
      incomes: this.incomesArray().controls.map((c) => c.getRawValue()),
      expenses: this.expensesArray().controls.map((c) => c.getRawValue()),
      personal: this.personalForm.getRawValue()
    };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* ignore */ }
  }

  private restoreDraft(): void {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<SimDraft>;
      if (draft.purpose) this.purpose.set(draft.purpose);
      if (draft.numberOfBorrowers) this.numberOfBorrowers.set(draft.numberOfBorrowers);
      if (draft.property) this.projectForm.patchValue(draft.property);
      if (draft.contribution) this.contributionForm.patchValue(draft.contribution);
      if (draft.incomes && draft.incomes.length > 0) {
        this.incomesArray().clear();
        draft.incomes.forEach((inc) => {
          const row = this.makeIncomeRow();
          row.patchValue(inc);
          this.incomesArray().push(row);
        });
      }
      if (draft.expenses && draft.expenses.length > 0) {
        this.expensesArray().clear();
        draft.expenses.forEach((exp) => {
          const row = this.makeExpenseRow();
          row.patchValue(exp);
          this.expensesArray().push(row);
        });
      }
      if (draft.personal) this.personalForm.patchValue(draft.personal);
    } catch { /* ignore */ }
  }
}
