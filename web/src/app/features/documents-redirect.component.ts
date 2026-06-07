import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApplicationService } from '../core/application.service';

@Component({
  selector: 'app-documents-redirect',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-md px-6 py-20 text-center space-y-4">
      @if (loading()) {
        <p class="text-sm text-stone-500">Loading your documents…</p>
      } @else {
        <h1 class="text-xl font-semibold tracking-tight text-stone-900">No application yet</h1>
        <p class="text-sm text-stone-600">
          Start a simulation and create your application to see your required documents here.
        </p>
        <a routerLink="/dashboard"
           class="inline-block rounded-md bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800">
          Go to dashboard
        </a>
      }
    </section>
  `
})
export class DocumentsRedirectComponent {
  private applications = inject(ApplicationService);
  private router = inject(Router);
  readonly loading = signal(true);

  constructor() {
    this.applications.list().subscribe({
      next: (apps) => {
        if (apps.length > 0) {
          this.router.navigate(['/applications', apps[0].id, 'documents']);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false)
    });
  }
}
