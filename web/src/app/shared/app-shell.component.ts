import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-white">
      <header class="border-b border-stone-200 bg-white">
        <div class="w-full px-6 py-3 flex items-center justify-between">
          <a routerLink="/dashboard" class="flex items-center gap-2 text-stone-900">
            <span class="grid h-7 w-7 place-items-center rounded-full bg-stone-900 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                class="h-3.5 w-3.5">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </span>
            <span class="text-base font-serif tracking-tight">Oper Credits</span>
          </a>

          <nav class="flex items-center gap-1 text-sm text-stone-700">
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-stone-100"
              class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 hover:text-stone-900">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                class="h-4 w-4 text-stone-500">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
              Dashboard
            </a>

            <a
              [routerLink]="documentsLink()"
              routerLinkActive="bg-stone-100"
              [routerLinkActiveOptions]="{ exact: false }"
              class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 hover:text-stone-900">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                class="h-4 w-4 text-stone-500">
                <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              </svg>
              Documents
            </a>

            <a class="inline-flex items-center gap-1.5 px-3 py-1.5 text-stone-700 hover:text-stone-900 cursor-default">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                class="h-4 w-4">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Contact
            </a>

            <button
              type="button"
              (click)="logout()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-stone-700 hover:text-stone-900">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                class="h-4 w-4">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>

            <span class="h-5 w-px bg-stone-200"></span>

            <button type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-stone-700 hover:text-stone-900">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                class="h-4 w-4">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M3 12h18"></path>
                <path d="M12 3a14 14 0 010 18M12 3a14 14 0 000 18"></path>
              </svg>
              English
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                class="h-3.5 w-3.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </nav>
        </div>
      </header>

      <main class="flex-1 bg-stone-50/40">
        <router-outlet />
      </main>
    </div>
  `
})
export class AppShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly documentsLink = computed(() => '/documents');

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
