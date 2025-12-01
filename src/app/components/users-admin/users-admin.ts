import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, User, TipoUsuario, Perfil } from '../../services/user.service';
import { AlertService } from '../../services/alert.service';
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
  userTypes: TipoUsuario[] = [];
  userProfiles: Perfil[] = [];
  userStats: any = {
    total: 0,
    types: []
  };
  
  searchTerm: string = '';
  selectedUserType: string = '';
  selectedProfile: string = '';
  sortBy: string = 'nombre';
  
  private subscription: Subscription = new Subscription();

  constructor(
    private userService: UserService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Primero cargar datos desde API
    this.loadUsers();
    this.loadFormularioData();
    
    // Subscribirse a cambios en el servicio
    this.subscription.add(
      this.userService.users$.subscribe(users => {
        console.log('Users received:', users);
        this.users = users;
        this.applyFilters();
      })
    );

    // Subscribe to stats updates
    this.subscription.add(
      this.userService.getUserStats$().subscribe(stats => {
        console.log('Stats received in component:', stats);
        this.userStats = stats;
      })
    );

    this.subscription.add(
      this.userService.userTypes$.subscribe(types => {
        console.log('User types received:', types);
        this.userTypes = types;
      })
    );

    this.subscription.add(
      this.userService.userProfiles$.subscribe(profiles => {
        console.log('User profiles received:', profiles);
        this.userProfiles = profiles;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  applyFilters() {
    let filtered = this.users;

    // Filtrar por término de búsqueda (se maneja en la API)
    // Solo aplicar filtros locales adicionales
    
    // Filtrar por tipo de usuario
    if (this.selectedUserType) {
      filtered = filtered.filter(user => user.tipoUsuario?.nombre === this.selectedUserType);
    }

    // Filtrar por perfil
    if (this.selectedProfile) {
      filtered = filtered.filter(user => user.perfil?.nombrePerfil === this.selectedProfile);
    }

    this.filteredUsers = filtered;
    this.sortUsers();
  }

  onSearchChange() {
    // Cuando cambie el término de búsqueda, recargar desde la API
    this.loadUsers();
  }

  refreshUsers() {
    console.log('Refreshing users...');
    this.searchTerm = ''; // Limpiar búsqueda
    this.selectedUserType = '';
    this.selectedProfile = '';
    this.loadUsers();
    this.loadFormularioData();
  }

  sortUsers() {
    this.filteredUsers.sort((a, b) => {
      switch (this.sortBy) {
        case 'nombre':
          return `${a.nombre} ${a.primerApellido}`.localeCompare(`${b.nombre} ${b.primerApellido}`);
        case 'documento':
          return a.documento.toString().localeCompare(b.documento.toString());
        case 'usuario':
          return (a.nombreUsuario || '').localeCompare(b.nombreUsuario || '');
        case 'tipoUsuario':
          return (a.tipoUsuario?.nombre || '').localeCompare(b.tipoUsuario?.nombre || '');
        case 'fechaRegistro':
          const dateA = a.fechaRegistro ? new Date(a.fechaRegistro).getTime() : 0;
          const dateB = b.fechaRegistro ? new Date(b.fechaRegistro).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });
  }

  createUser() {
    this.router.navigate(['/usuarios-admin/crear']);
  }

  editUser(documento: number) {
    this.router.navigate(['/usuarios-admin/editar', documento]);
  }

  viewUser(documento: number) {
    this.router.navigate(['/usuarios-admin/ver', documento]);
  }

  async deleteUser(user: User) {
    const confirmed = await this.alertService.confirm({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar al usuario "${user.nombre} ${user.primerApellido}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      this.userService.deleteUser(user.documento).subscribe({
        next: (response) => {
          console.log('Response from backend:', response);
          // Verificar si la respuesta indica un error
          if (this.userService.isErrorResponse(response)) {
            this.alertService.showError(response, 'Error');
          } else {
            this.alertService.showSuccess(response || 'Usuario eliminado exitosamente', 'Éxito');
            this.loadUsers(); // Recargar la lista solo si fue exitoso
          }
        },
        error: (error) => {
          this.alertService.showError(this.userService.extractErrorMessage(error), 'Error');
          console.error('Error completo:', error);
        }
      });
    }
  }

  loadUsers() {
    console.log('Loading users from API...');
    this.userService.loadUsersFromAPI(0, 100, this.searchTerm).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        // La respuesta de la API tiene el formato de paginación de Spring
        const users = response.content || response || [];
        console.log('Processed users:', users);
        
        // Actualizar el estado del servicio para que se propague a todos los componentes
        this.userService.importUsers(users);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Fallback a datos locales si la API falla
        console.log('Using fallback data');
      }
    });
  }

  loadFormularioData() {
    this.userService.getFormularioData().subscribe({
      next: (data) => {
        // Actualizar los datos del formulario desde la API
        this.userTypes = data.tiposUsuario || [];
        this.userProfiles = data.perfiles || [];
      },
      error: (error) => {
        console.error('Error loading form data:', error);
      }
    });
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
}