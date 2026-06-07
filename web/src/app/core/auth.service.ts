import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'oper.access_token';

export interface AuthUser {
  id?: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  claim_token?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  user?: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiBase}/api/v1/auth`;
  private readonly _token = signal<string | null>(this.readToken());
  private readonly _user = signal<AuthUser | null>(null);

  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  private readonly http = inject(HttpClient);

  loadCurrentUser(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.base}/me`)
      .pipe(tap((user) => this._user.set(user)));
  }

  login(payload: LoginPayload): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.base}/login`, payload)
      .pipe(tap((res) => this.persist(res)));
  }

  signup(payload: SignupPayload): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.base}/signup`, payload)
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private persist(res: TokenResponse): void {
    if (res?.access_token) {
      localStorage.setItem(TOKEN_KEY, res.access_token);
      this._token.set(res.access_token);
      if (res.user) {
        this._user.set(res.user);
      }
    }
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
