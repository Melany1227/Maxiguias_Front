import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: number;
  documento: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  direccion: string;
  telefono: string;
  email: string;
  usuario: string;
  password?: string;
  tipoUsuario: 'Administrador' | 'Empleado' | 'Cliente';
  perfil: string;
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  fechaCreacion: Date;
  fechaUltimoAcceso?: Date;
  avatar?: string;
}

export interface UserType {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface UserProfile {
  id: number;
  nombrePerfil: string;
  permisos: string[];
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users = new BehaviorSubject<User[]>([]);
  private userTypes = new BehaviorSubject<UserType[]>([]);
  private userProfiles = new BehaviorSubject<UserProfile[]>([]);

  users$ = this.users.asObservable();
  userTypes$ = this.userTypes.asObservable();
  userProfiles$ = this.userProfiles.asObservable();

  constructor() {
    this.initializeDefaultData();
    this.loadUsersFromStorage();
  }

  // CRUD Operations for Users
  getAllUsers(): User[] {
    return this.users.value;
  }

  getUserById(id: number): User | undefined {
    return this.users.value.find(user => user.id === id);
  }

  getUserByDocument(documento: string): User | undefined {
    return this.users.value.find(user => user.documento === documento);
  }

  getUserByUsername(usuario: string): User | undefined {
    return this.users.value.find(user => user.usuario === usuario);
  }

  createUser(userData: Omit<User, 'id' | 'fechaCreacion'>): User {
    const currentUsers = this.users.value;
    
    // Validar documento único
    if (this.getUserByDocument(userData.documento)) {
      throw new Error('Ya existe un usuario con este documento');
    }

    // Validar nombre de usuario único
    if (this.getUserByUsername(userData.usuario)) {
      throw new Error('Ya existe un usuario con este nombre de usuario');
    }

    const newId = currentUsers.length > 0 ? Math.max(...currentUsers.map(u => u.id)) + 1 : 1;
    
    const newUser: User = {
      ...userData,
      id: newId,
      fechaCreacion: new Date()
    };

    const updatedUsers = [...currentUsers, newUser];
    this.users.next(updatedUsers);
    this.saveUsersToStorage();
    
    return newUser;
  }

  updateUser(id: number, userData: Partial<User>): User | null {
    const currentUsers = this.users.value;
    const userIndex = currentUsers.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return null;
    }

    // Validar documento único (excepto el usuario actual)
    if (userData.documento) {
      const existingUser = this.getUserByDocument(userData.documento);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Ya existe un usuario con este documento');
      }
    }

    // Validar nombre de usuario único (excepto el usuario actual)
    if (userData.usuario) {
      const existingUser = this.getUserByUsername(userData.usuario);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Ya existe un usuario con este nombre de usuario');
      }
    }

    const updatedUser = { ...currentUsers[userIndex], ...userData, id };
    currentUsers[userIndex] = updatedUser;
    
    this.users.next([...currentUsers]);
    this.saveUsersToStorage();
    
    return updatedUser;
  }

  deleteUser(id: number): boolean {
    const currentUsers = this.users.value;
    const filteredUsers = currentUsers.filter(u => u.id !== id);
    
    if (filteredUsers.length === currentUsers.length) {
      return false; // User not found
    }

    this.users.next(filteredUsers);
    this.saveUsersToStorage();
    return true;
  }

  // User Status Management
  activateUser(id: number): boolean {
    return this.updateUser(id, { estado: 'Activo' }) !== null;
  }

  deactivateUser(id: number): boolean {
    return this.updateUser(id, { estado: 'Inactivo' }) !== null;
  }

  suspendUser(id: number): boolean {
    return this.updateUser(id, { estado: 'Suspendido' }) !== null;
  }

  // Search and Filter
  searchUsers(term: string): User[] {
    if (!term) return this.users.value;
    
    const searchTerm = term.toLowerCase();
    return this.users.value.filter(user =>
      user.nombre.toLowerCase().includes(searchTerm) ||
      user.primerApellido.toLowerCase().includes(searchTerm) ||
      user.segundoApellido.toLowerCase().includes(searchTerm) ||
      user.documento.includes(term) ||
      user.usuario.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.telefono.includes(term)
    );
  }

  getUsersByType(tipoUsuario: string): User[] {
    if (!tipoUsuario) return this.users.value;
    return this.users.value.filter(user => user.tipoUsuario === tipoUsuario);
  }

  getUsersByProfile(perfil: string): User[] {
    if (!perfil) return this.users.value;
    return this.users.value.filter(user => user.perfil === perfil);
  }

  getUsersByStatus(estado: string): User[] {
    if (!estado) return this.users.value;
    return this.users.value.filter(user => user.estado === estado);
  }

  // User Types Management
  getAllUserTypes(): UserType[] {
    return this.userTypes.value;
  }

  createUserType(typeData: Omit<UserType, 'id'>): UserType {
    const currentTypes = this.userTypes.value;
    const newId = currentTypes.length > 0 ? Math.max(...currentTypes.map(t => t.id)) + 1 : 1;
    
    const newType: UserType = {
      id: newId,
      ...typeData
    };

    this.userTypes.next([...currentTypes, newType]);
    return newType;
  }

  // User Profiles Management
  getAllUserProfiles(): UserProfile[] {
    return this.userProfiles.value;
  }

  createUserProfile(profileData: Omit<UserProfile, 'id'>): UserProfile {
    const currentProfiles = this.userProfiles.value;
    const newId = currentProfiles.length > 0 ? Math.max(...currentProfiles.map(p => p.id)) + 1 : 1;
    
    const newProfile: UserProfile = {
      id: newId,
      ...profileData
    };

    this.userProfiles.next([...currentProfiles, newProfile]);
    return newProfile;
  }

  // Statistics
  getUserStats() {
    const users = this.users.value;
    return {
      total: users.length,
      activos: users.filter(u => u.estado === 'Activo').length,
      inactivos: users.filter(u => u.estado === 'Inactivo').length,
      suspendidos: users.filter(u => u.estado === 'Suspendido').length,
      administradores: users.filter(u => u.tipoUsuario === 'Administrador').length,
      empleados: users.filter(u => u.tipoUsuario === 'Empleado').length,
      clientes: users.filter(u => u.tipoUsuario === 'Cliente').length
    };
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

  // Initialize default data
  private initializeDefaultData() {
    // User Types
    const defaultUserTypes: UserType[] = [
      {
        id: 1,
        nombre: 'Administrador',
        descripcion: 'Usuario con acceso completo al sistema'
      },
      {
        id: 2,
        nombre: 'Empleado',
        descripcion: 'Usuario empleado con acceso limitado'
      },
      {
        id: 3,
        nombre: 'Cliente',
        descripcion: 'Usuario cliente del sistema'
      }
    ];

    // User Profiles
    const defaultUserProfiles: UserProfile[] = [
      {
        id: 1,
        nombrePerfil: 'Super Admin',
        permisos: ['create', 'read', 'update', 'delete', 'admin'],
        descripcion: 'Acceso completo a todas las funciones'
      },
      {
        id: 2,
        nombrePerfil: 'Administrativo',
        permisos: ['create', 'read', 'update'],
        descripcion: 'Acceso para gestión administrativa'
      },
      {
        id: 3,
        nombrePerfil: 'Almacén',
        permisos: ['read', 'update'],
        descripcion: 'Acceso para gestión de inventario'
      },
      {
        id: 4,
        nombrePerfil: 'Básico',
        permisos: ['read'],
        descripcion: 'Acceso de solo lectura'
      }
    ];

    // Default Users (only if no users exist)
    if (this.users.value.length === 0) {
      const defaultUsers: User[] = [
        {
          id: 1,
          documento: '12345678',
          nombre: 'Juan',
          primerApellido: 'Pérez',
          segundoApellido: 'García',
          direccion: 'Calle 123 #45-67',
          telefono: '300-123-4567',
          email: 'juan.perez@example.com',
          usuario: 'juan.perez',
          tipoUsuario: 'Empleado',
          perfil: 'Administrativo',
          estado: 'Activo',
          fechaCreacion: new Date('2024-01-15'),
          fechaUltimoAcceso: new Date('2024-12-01')
        },
        {
          id: 2,
          documento: '87654321',
          nombre: 'María',
          primerApellido: 'González',
          segundoApellido: 'López',
          direccion: 'Carrera 45 #12-34',
          telefono: '310-987-6543',
          email: 'maria.gonzalez@example.com',
          usuario: 'maria.gonzalez',
          tipoUsuario: 'Cliente',
          perfil: 'Básico',
          estado: 'Activo',
          fechaCreacion: new Date('2024-02-10'),
          fechaUltimoAcceso: new Date('2024-11-30')
        },
        {
          id: 3,
          documento: '11223344',
          nombre: 'Carlos',
          primerApellido: 'Rodríguez',
          segundoApellido: 'Martínez',
          direccion: 'Avenida 67 #89-12',
          telefono: '320-555-7890',
          email: 'carlos.rodriguez@example.com',
          usuario: 'carlos.rodriguez',
          tipoUsuario: 'Administrador',
          perfil: 'Super Admin',
          estado: 'Activo',
          fechaCreacion: new Date('2024-01-01'),
          fechaUltimoAcceso: new Date('2024-12-02')
        }
      ];

      this.users.next(defaultUsers);
      this.saveUsersToStorage();
    }

    this.userTypes.next(defaultUserTypes);
    this.userProfiles.next(defaultUserProfiles);
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
}