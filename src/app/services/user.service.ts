import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface User {
  documento: number;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  direccion: string;
  telefono: number;
  correo: string;
  nombreUsuario: string;
  contrasena?: string;
  fechaRegistro: Date;
  tipoUsuario: TipoUsuario;
  perfil: Perfil;
  ciudad: Ciudad;
}

export interface TipoUsuario {
  id: number;
  nombre: string;
}

export interface Perfil {
  id: number;
  nombrePerfil: string;
  rol: Rol;
}

export interface Rol {
  id: number;
  nombre: string;
}

export interface Ciudad {
  id: number;
  nombre: string;
  departamento: Departamento;
}

export interface Departamento {
  id: number;
  nombre: string;
}


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8080/api/usuarios';
  private users = new BehaviorSubject<User[]>([]);
  private userTypes = new BehaviorSubject<TipoUsuario[]>([]);
  private userProfiles = new BehaviorSubject<Perfil[]>([]);

  users$ = this.users.asObservable();
  userTypes$ = this.userTypes.asObservable();
  userProfiles$ = this.userProfiles.asObservable();

  constructor(private http: HttpClient) {
    this.initializeDefaultData();
    this.loadInitialUsers();
  }

  // API Operations for Users
  loadUsersFromAPI(page: number = 0, size: number = 10, buscar?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (buscar) {
      params = params.set('buscar', buscar);
    }

    return this.http.get<any>(`${this.baseUrl}`, { params });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  createUser(userData: Omit<User, 'fechaRegistro'>): Observable<string> {
    return this.http.post(this.baseUrl, userData, { 
      responseType: 'text',
      headers: { 'Content-Type': 'application/json' }
    }) as Observable<string>;
  }

  updateUser(id: number, userData: Partial<User>): Observable<string> {
    return this.http.put(`${this.baseUrl}/${id}`, userData, { 
      responseType: 'text',
      headers: { 'Content-Type': 'application/json' }
    }) as Observable<string>;
  }

  deleteUser(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { 
      responseType: 'text'
    }) as Observable<string>;
  }

  getFormularioData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/formulario-data`);
  }

  // Local operations for UI
  getAllUsers(): User[] {
    return this.users.value;
  }

  getUserByDocument(documento: number): User | undefined {
    return this.users.value.find(user => user.documento === documento);
  }

  getUserByUsername(nombreUsuario: string): User | undefined {
    return this.users.value.find(user => user.nombreUsuario === nombreUsuario);
  }


  // Search and Filter
  searchUsers(term: string): User[] {
    if (!term) return this.users.value;
    
    const searchTerm = term.toLowerCase();
    return this.users.value.filter(user =>
      user.nombre.toLowerCase().includes(searchTerm) ||
      user.primerApellido.toLowerCase().includes(searchTerm) ||
      user.segundoApellido.toLowerCase().includes(searchTerm) ||
      user.documento.toString().includes(term) ||
      user.nombreUsuario.toLowerCase().includes(searchTerm) ||
      user.telefono.toString().includes(term)
    );
  }

  getUsersByType(tipoUsuario: string): User[] {
    if (!tipoUsuario) return this.users.value;
    return this.users.value.filter(user => user.tipoUsuario.nombre === tipoUsuario);
  }

  getUsersByProfile(perfil: string): User[] {
    if (!perfil) return this.users.value;
    return this.users.value.filter(user => user.perfil.nombrePerfil === perfil);
  }

  // User Types Management
  getAllUserTypes(): TipoUsuario[] {
    return this.userTypes.value;
  }

  // User Profiles Management
  getAllUserProfiles(): Perfil[] {
    return this.userProfiles.value;
  }

  // Statistics - Dynamic based on actual user types
  getUserStats() {
    const users = this.users.value;
    const userTypes = this.userTypes.value;
    console.log('Calculating dynamic stats for users:', users.length);
    console.log('Available user types:', userTypes);
    
    const stats = {
      total: users.length,
      types: userTypes.map(type => ({
        id: type.id,
        nombre: type.nombre,
        count: users.filter(u => u.tipoUsuario?.nombre === type.nombre).length
      }))
    };
    
    console.log('Dynamic user stats calculated:', stats);
    return stats;
  }

  // Observable for stats that updates automatically when users or user types change
  getUserStats$() {
    return this.users$.pipe(
      map(users => {
        const userTypes = this.userTypes.value;
        const stats = {
          total: users.length,
          types: userTypes.map(type => ({
            id: type.id,
            nombre: type.nombre,
            count: users.filter(u => u.tipoUsuario?.nombre === type.nombre).length
          }))
        };
        console.log('Dynamic stats updated via Observable:', stats);
        return stats;
      })
    );
  }

  // Bulk Operations
  importUsers(users: User[]): void {
    this.users.next(users);
    this.saveUsersToStorage();
  }

  exportUsers(): User[] {
    return this.users.value;
  }

  // Storage Operations
  private saveUsersToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('users', JSON.stringify(this.users.value));
    }
  }

  private loadUsersFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('users');
      if (saved) {
        const users = JSON.parse(saved).map((user: any) => ({
          ...user,
          fechaCreacion: new Date(user.fechaCreacion),
          fechaUltimoAcceso: user.fechaUltimoAcceso ? new Date(user.fechaUltimoAcceso) : undefined
        }));
        this.users.next(users);
      }
    }
  }

  // Load users from API and update local state
  private loadInitialUsers(): void {
    this.loadUsersFromAPI(0, 100).subscribe({
      next: (response) => {
        console.log('Initial users loaded from API:', response);
        const users = response.content || response || [];
        this.users.next(users);
        if (users.length > 0) {
          this.saveUsersToStorage(); // Save to local storage for fallback
        }
      },
      error: (error) => {
        console.error('Error loading users from API:', error);
        this.loadUsersFromStorage(); // Fallback to local storage
      }
    });
  }

  // Initialize default data
  private initializeDefaultData() {
    // Intentar cargar datos desde la API primero
    this.getFormularioData().subscribe({
      next: (data) => {
        console.log('Form data loaded from API in initialization:', data);
        this.userTypes.next(data.tiposUsuario || []);
        this.userProfiles.next(data.perfiles || []);
      },
      error: (error) => {
        console.error('Error loading form data from API, using default data:', error);
        // Fallback a datos por defecto si la API falla
        const defaultUserTypes: TipoUsuario[] = [
          { id: 1, nombre: 'Administrador' },
          { id: 2, nombre: 'Empleado' },
          { id: 3, nombre: 'Cliente' }
        ];

        const defaultUserProfiles: Perfil[] = [
          { 
            id: 1, 
            nombrePerfil: 'Super Admin',
            rol: { id: 1, nombre: 'Admin' }
          },
          { 
            id: 2, 
            nombrePerfil: 'Administrativo',
            rol: { id: 2, nombre: 'Empleado' }
          },
          { 
            id: 3, 
            nombrePerfil: 'Básico',
            rol: { id: 3, nombre: 'Cliente' }
          }
        ];

        this.userTypes.next(defaultUserTypes);
        this.userProfiles.next(defaultUserProfiles);
      }
    });
  }

  // Validation helpers
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^[0-9\-\+\s\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  validateDocument(document: string): boolean {
    return document.length >= 6 && document.length <= 15 && /^[0-9]+$/.test(document);
  }

  // Helper method to check if response indicates an error
  isErrorResponse(response: string): boolean {
    if (!response) return false;
    
    return (
      response.includes('Error:') || 
      response.includes('error') || 
      response.toLowerCase().includes('no se pudo') ||
      response.toLowerCase().includes('ya existe')
    );
  }

  // Helper method to extract error messages from backend responses
  extractErrorMessage(error: any): string {
    let errorMessage = 'Error en el servidor';
    
    console.log('Processing error:', error);
    
    // Si el error es un HttpErrorResponse (error HTTP)
    if (error?.error) {
      // Si el error.error es un string (respuesta de texto plano del backend)
      if (typeof error.error === 'string') {
        // Verificar si el string contiene JSON
        try {
          const parsedError = JSON.parse(error.error);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          } else if (typeof parsedError === 'string') {
            errorMessage = parsedError;
          } else {
            errorMessage = error.error;
          }
        } catch {
          // Si no es JSON válido, usar el string directamente
          errorMessage = error.error;
        }
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.details) {
        errorMessage = error.error.details;
      } else if (typeof error.error === 'object') {
        // Si es un objeto, intentar stringificarlo de manera legible
        errorMessage = JSON.stringify(error.error);
      }
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.log('Extracted error message:', errorMessage);
    return errorMessage;
  }
}