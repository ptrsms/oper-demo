import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ApplicationService,
  type DocSlot
} from '../../../core/application.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <header>
        <h2 class="text-lg font-medium">Documents</h2>
        <p class="text-sm text-stone-500">Upload the items below to finalise your application.</p>
      </header>

      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="text-sm text-stone-500">Loading…</p>
      } @else {
        <ul class="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          @for (slot of slots(); track slotKey(slot)) {
            <li class="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p class="text-sm font-medium text-stone-900">{{ slot.label }}</p>
                <p class="text-xs text-stone-500">
                  @if (slot.borrower_name) {
                    {{ slot.borrower_name }} ·
                  }
                  @if (slot.status === 'UPLOADED') {
                    Uploaded — {{ slot.document?.filename }}
                  } @else {
                    Requested
                  }
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="rounded-full px-2 py-0.5 text-xs"
                  [class.bg-stone-100]="slot.status === 'REQUESTED'"
                  [class.text-stone-600]="slot.status === 'REQUESTED'"
                  [class.bg-emerald-100]="slot.status === 'UPLOADED'"
                  [class.text-emerald-800]="slot.status === 'UPLOADED'">
                  {{ slot.status }}
                </span>
                <label class="cursor-pointer rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100">
                  {{ slot.status === 'UPLOADED' ? 'Replace' : 'Upload' }}
                  <input
                    type="file"
                    class="hidden"
                    [disabled]="uploadingKey() === slotKey(slot)"
                    (change)="onFile(slot, $event)" />
                </label>
              </div>
            </li>
          }
        </ul>
      }

      <div class="flex justify-end">
        <a
          routerLink="/dashboard"
          class="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800">
          Done
        </a>
      </div>
    </section>
  `
})
export class DocumentsComponent {
  private route = inject(ActivatedRoute);
  private applications = inject(ApplicationService);
  private params = toSignal(this.route.parent!.paramMap, { requireSync: true });

  readonly applicationId = computed(() => this.params().get('id') ?? '');
  readonly slots = signal<DocSlot[]>([]);
  readonly loading = signal(true);
  readonly uploadingKey = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    this.refresh();
  }

  slotKey(slot: DocSlot): string {
    return `${slot.doc_type}:${slot.borrower_id ?? 'app'}`;
  }

  private refresh(): void {
    const id = this.applicationId();
    if (!id) return;
    this.loading.set(true);
    this.applications.listDocSlots(id).subscribe({
      next: (list) => {
        this.slots.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('load doc slots failed', err);
        this.loading.set(false);
        this.error.set('Could not load documents.');
      }
    });
  }

  onFile(slot: DocSlot, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const id = this.applicationId();
    if (!id) return;
    const key = this.slotKey(slot);
    this.uploadingKey.set(key);
    this.error.set(null);
    this.applications
      .uploadDocument(id, slot.doc_type, file, slot.borrower_id ?? null)
      .subscribe({
        next: () => {
          this.uploadingKey.set(null);
          input.value = '';
          this.refresh();
        },
        error: (err) => {
          this.uploadingKey.set(null);
          input.value = '';
          console.error('upload failed', err);
          this.error.set('Upload failed. Please try again.');
        }
      });
  }
}
