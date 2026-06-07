import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { components } from '../api/schema.d';

export type SimulationCreate = components['schemas']['SimulationCreate'];
export type SimulationOut = components['schemas']['SimulationOut'];
export type SimulationCreateResponse =
  components['schemas']['SimulationCreateResponse'];

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/api/v1/simulations`;

  create(payload: SimulationCreate): Observable<SimulationCreateResponse> {
    return this.http.post<SimulationCreateResponse>(this.base, payload);
  }

  get(id: string, claimToken?: string | null): Observable<SimulationOut> {
    let params = new HttpParams();
    if (claimToken) {
      params = params.set('claim_token', claimToken);
    }
    return this.http.get<SimulationOut>(`${this.base}/${id}`, { params });
  }

  list(): Observable<SimulationOut[]> {
    return this.http.get<SimulationOut[]>(this.base);
  }
}
