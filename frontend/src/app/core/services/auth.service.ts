import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles?: string[];
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<AuthUser | null>(null);
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          this.setToken(res.token);
          this.currentUser$.next(this.normalizeUser(res.user));
        })
      );
  }

  registerPatient(payload: any): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/register-patient`, payload)
      .pipe(
        tap((res) => {
          this.setToken(res.token);
          this.currentUser$.next(this.normalizeUser(res.user));
        })
      );
  }

  registerDoctor(payload: any): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/register-doctor`, payload)
      .pipe(
        tap((res) => {
          this.setToken(res.token);
          this.currentUser$.next(this.normalizeUser(res.user));
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearToken();
        this.currentUser$.next(null);
      })
    );
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${environment.apiBaseUrl}/auth/me`).pipe(
      tap((user) => this.currentUser$.next(this.normalizeUser(user)))
    );
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser$.next(null);
  }

  changePassword(payload: { current_password: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/auth/change-password`, payload);
  }

  getCurrentUser(): Observable<AuthUser | null> {
    return this.currentUser$.asObservable();
  }

  private normalizeUser(user: any): AuthUser {
    const roles = Array.isArray(user?.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
      : user?.role
      ? [user.role]
      : [];
    return { ...user, roles };
  }
}
