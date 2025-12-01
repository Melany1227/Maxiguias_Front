import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoginRequest {
  nombreUsuario: string;
  contrasena: string;
}

export interface LoginResponse {
  token?: string;
  usuario?: any;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkStoredAuth();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials, { headers })
      .pipe(
        tap(response => {
          if (response.token) {
            this.handleLoginSuccess(response);
          }
        })
      );
  }

  logout(): void {
    this.clearStoredAuth();
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private handleLoginSuccess(response: LoginResponse): void {
    if (typeof localStorage !== 'undefined' && response.token) {
      localStorage.setItem('auth_token', response.token);
      if (response.usuario) {
        localStorage.setItem('current_user', JSON.stringify(response.usuario));
      }
    }
    
    this.currentUserSubject.next(response.usuario);
    this.isLoggedInSubject.next(true);
  }

  private clearStoredAuth(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }
  }

  private checkStoredAuth(): void {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('current_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
        } catch (error) {
          this.clearStoredAuth();
        }
      }
    }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && (
      user.perfil?.rol?.nombreRol === 'ADMINISTRADOR' || 
      user.tipoUsuario?.nombre === 'ADMIN'
    );
  }

  getUserRole(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    return user.perfil?.rol?.nombreRol || user.tipoUsuario?.nombre || '';
  }

  getUserType(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    return user.tipoUsuario?.nombre || '';
  }

  isJuridico(): boolean {
    const user = this.getCurrentUser();
    return user && (
      user.perfil?.rol?.nombreRol === 'JURIDICO' ||
      user.tipoUsuario?.nombre === 'JURIDICO'
    );
  }

  extractErrorMessage(error: any): string {
    let errorMessage = 'Error en el servidor';
    
    if (error?.error) {
      if (typeof error.error === 'string') {
        try {
          const parsedError = JSON.parse(error.error);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          } else {
            errorMessage = error.error;
          }
        } catch {
          errorMessage = error.error;
        }
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return errorMessage;
  }
}