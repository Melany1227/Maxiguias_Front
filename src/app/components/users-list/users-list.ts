import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Table, TableColumn, TableAction } from '../table/table';
import { UserService, User } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-users-list',
  imports: [Table, RouterModule, FormsModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css'
})
export class UsersList implements OnInit, OnDestroy {

  searchTerm: string = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  
  private subscription: Subscription = new Subscription();

  columns: TableColumn[] = [
    { key: 'documento', label: 'Documento' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'primerApellido', label: 'Primer Apellido' },
    { key: 'segundoApellido', label: 'Segundo Apellido' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'tipoUsuario', label: 'Tipo Usuario' },
    { key: 'perfil', label: 'Perfil' },
    { key: 'estado', label: 'Estado' }
  ];

  actions: TableAction[] = [
    {
      label: 'Editar',
      icon: '✏️',
      class: 'btn-outline-primary',
      action: (user) => this.editarUsuario(user)
    },
    {
      label: 'Eliminar',
      icon: '🗑️',
      class: 'btn-outline-danger',
      action: (user) => this.eliminarUsuario(user)
    }
  ];

  loading = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.subscription.add(
      this.userService.users$.subscribe(users => {
        this.users = users;
        this.filterUsers();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  filterUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.userService.searchUsers(this.searchTerm);
  }

  onRowClick(user: User) {
    console.log('Usuario seleccionado:', user);
  }

  editarUsuario(user: User) {
    console.log('Editar usuario:', user);
  }

  eliminarUsuario(user: User) {
    if (confirm(`¿Estás seguro de eliminar al usuario ${user.nombre} ${user.primerApellido}?`)) {
      const success = this.userService.deleteUser(user.id);
      if (success) {
        alert('Usuario eliminado exitosamente');
      } else {
        alert('Error al eliminar el usuario');
      }
    }
  }
}
