import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, User, UserType, UserProfile } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-users-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './users-admin.html',
  styleUrl: './users-admin.css'
})
export class UsersAdmin implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  userTypes: UserType[] = [];
  userProfiles: UserProfile[] = [];
  userStats: any = {};
  
  searchTerm: string = '';
  selectedUserType: string = '';
  selectedProfile: string = '';
  selectedStatus: string = '';
  sortBy: string = 'nombre';
  
  private subscription: Subscription = new Subscription();

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.userService.users$.subscribe(users => {
        this.users = users;
        this.applyFilters();
        this.userStats = this.userService.getUserStats();
      })
    );

    this.subscription.add(
      this.userService.userTypes$.subscribe(types => {
        this.userTypes = types;
      })
    );

    this.subscription.add(
      this.userService.userProfiles$.subscribe(profiles => {
        this.userProfiles = profiles;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  applyFilters() {
    let filtered = this.users;

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      filtered = this.userService.searchUsers(this.searchTerm);
    }

    // Filtrar por tipo de usuario
    if (this.selectedUserType) {
      filtered = filtered.filter(user => user.tipoUsuario === this.selectedUserType);
    }

    // Filtrar por perfil
    if (this.selectedProfile) {
      filtered = filtered.filter(user => user.perfil === this.selectedProfile);
    }

    // Filtrar por estado
    if (this.selectedStatus) {
      filtered = filtered.filter(user => user.estado === this.selectedStatus);
    }

    this.filteredUsers = filtered;
    this.sortUsers();
  }

  sortUsers() {
    this.filteredUsers.sort((a, b) => {
      switch (this.sortBy) {
        case 'nombre':
          return `${a.nombre} ${a.primerApellido}`.localeCompare(`${b.nombre} ${b.primerApellido}`);
        case 'documento':
          return a.documento.localeCompare(b.documento);
        case 'usuario':
          return a.usuario.localeCompare(b.usuario);
        case 'tipoUsuario':
          return a.tipoUsuario.localeCompare(b.tipoUsuario);
        case 'estado':
          return a.estado.localeCompare(b.estado);
        case 'fechaCreacion':
          return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        default:
          return 0;
      }
    });
  }

  createUser() {
    this.router.navigate(['/usuarios/crear']);
  }

  editUser(id: number) {
    this.router.navigate(['/usuarios/editar', id]);
  }

  viewUser(id: number) {
    this.router.navigate(['/usuarios/ver', id]);
  }

  deleteUser(user: User) {
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${user.nombre} ${user.primerApellido}"?`)) {
      const success = this.userService.deleteUser(user.id);
      if (success) {
        alert('Usuario eliminado exitosamente');
      } else {
        alert('Error al eliminar el usuario');
      }
    }
  }

  changeUserStatus(user: User, newStatus: 'Activo' | 'Inactivo' | 'Suspendido') {
    let success = false;
    
    switch (newStatus) {
      case 'Activo':
        success = this.userService.activateUser(user.id);
        break;
      case 'Inactivo':
        success = this.userService.deactivateUser(user.id);
        break;
      case 'Suspendido':
        success = this.userService.suspendUser(user.id);
        break;
    }

    if (success) {
      alert(`Usuario ${newStatus.toLowerCase()} exitosamente`);
    } else {
      alert('Error al cambiar el estado del usuario');
    }
  }

  exportUsers() {
    const users = this.userService.exportUsers();
    const dataStr = JSON.stringify(users, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'usuarios.json';
    link.click();
  }

  importUsers(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const users = JSON.parse(e.target?.result as string);
          this.userService.importUsers(users);
          alert('Usuarios importados exitosamente');
        } catch (error) {
          alert('Error al importar usuarios: archivo inválido');
        }
      };
      reader.readAsText(file);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Activo': return 'status-active';
      case 'Inactivo': return 'status-inactive';
      case 'Suspendido': return 'status-suspended';
      default: return 'status-default';
    }
  }

  getUserTypeClass(tipo: string): string {
    switch (tipo) {
      case 'Administrador': return 'type-admin';
      case 'Empleado': return 'type-employee';
      case 'Cliente': return 'type-client';
      default: return 'type-default';
    }
  }

  getFullName(user: User): string {
    return `${user.nombre} ${user.primerApellido} ${user.segundoApellido}`.trim();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatLastAccess(date?: Date): string {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days <= 7) return `Hace ${days} días`;
    
    return this.formatDate(date);
  }
}