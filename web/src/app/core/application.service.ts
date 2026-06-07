import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { components } from '../api/schema.d';

export type ApplicationOut = components['schemas']['ApplicationOut'];
export type ApplicationSummary = components['schemas']['ApplicationSummary'];
export type PropertyStep = components['schemas']['PropertyStep'];
export type FinancialsStep = components['schemas']['FinancialsStep'];
export type PersonalStep = components['schemas']['PersonalStep'];
export type DocSlot = components['schemas']['DocSlot'];
export type DocumentOut = components['schemas']['DocumentOut'];
export type DocType = components['schemas']['DocType'];

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/api/v1/applications`;

  create(simulationId: string): Observable<ApplicationOut> {
    return this.http.post<ApplicationOut>(this.base, {
      simulation_id: simulationId
    });
  }

  get(id: string): Observable<ApplicationOut> {
    return this.http.get<ApplicationOut>(`${this.base}/${id}`);
  }

  list(): Observable<ApplicationSummary[]> {
    return this.http.get<ApplicationSummary[]>(this.base);
  }

  patchProperty(id: string, body: PropertyStep): Observable<ApplicationOut> {
    return this.http.patch<ApplicationOut>(`${this.base}/${id}/property`, body);
  }

  patchFinancials(id: string, body: FinancialsStep): Observable<ApplicationOut> {
    return this.http.patch<ApplicationOut>(`${this.base}/${id}/financials`, body);
  }

  patchPersonal(id: string, body: PersonalStep): Observable<ApplicationOut> {
    return this.http.patch<ApplicationOut>(`${this.base}/${id}/personal`, body);
  }

  submit(id: string): Observable<ApplicationOut> {
    return this.http.post<ApplicationOut>(`${this.base}/${id}/submit`, {});
  }

  listDocSlots(id: string): Observable<DocSlot[]> {
    return this.http.get<DocSlot[]>(`${this.base}/${id}/documents`);
  }

  uploadDocument(
    appId: string,
    docType: DocType,
    file: File,
    borrowerId?: string | null
  ): Observable<DocumentOut> {
    const form = new FormData();
    form.append('doc_type', docType);
    form.append('file', file);
    if (borrowerId) {
      form.append('borrower_id', borrowerId);
    }
    return this.http.post<DocumentOut>(
      `${this.base}/${appId}/documents`,
      form
    );
  }
}
