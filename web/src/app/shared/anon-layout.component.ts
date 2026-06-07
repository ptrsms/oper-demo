import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-anon-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="min-h-screen flex flex-col bg-white">
      <header class="border-b border-stone-200 bg-white">
        <div class="w-full px-6 py-3 flex items-center justify-between">
          <a routerLink="/simulate" class="flex items-center gap-2 text-stone-900">
            <span class="grid h-7 w-7 place-items-center rounded-full bg-stone-900 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                class="h-3.5 w-3.5">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </span>
            <span class="text-base font-serif tracking-tight">Oper Credits</span>
          </a>

          <nav class="flex items-center gap-2 text-sm text-stone-700">
            <span class="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                class="h-4 w-4 text-stone-500">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M3 12h18"></path>
                <path d="M12 3a14 14 0 010 18M12 3a14 14 0 000 18"></path>
              </svg>
              <span>Mortgage Simulator</span>
            </span>

            <a class="inline-flex items-center gap-1.5 px-3 py-1.5 text-stone-700 hover:text-stone-900 cursor-default">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                class="h-4 w-4">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Contact
            </a>

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

      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `
})
export class AnonLayoutComponent {}
