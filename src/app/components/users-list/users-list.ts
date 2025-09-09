import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Table, TableColumn, TableAction } from '../table/table';

@Component({
  selector: 'app-users-list',
  imports: [Table, RouterModule, FormsModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css'
})
export class UsersList implements OnInit {

  searchTerm: string = '';
  allUsers: any[] = [
    {
      id: 1,
      documento: '12345678',
      nombre: 'Juan',
      primerApellido: 'Pérez',
      segundoApellido: 'García',
      direccion: 'Calle 123 #45-67',
      telefono: '300-123-4567',
      usuario: 'juan.perez',
      tipoUsuario: 'Empleado',
      perfil: 'Administrativo'
    },
    {
      id: 2,
      documento: '87654321',
      nombre: 'María',
      primerApellido: 'González',
      segundoApellido: 'López',
      direccion: 'Carrera 45 #12-34',
      telefono: '310-987-6543',
      usuario: 'maria.gonzalez',
      tipoUsuario: 'Cliente',
      perfil: 'Básico'
    },
    {
      id: 3,
      documento: '11223344',
      nombre: 'Carlos',
      primerApellido: 'Rodríguez',
      segundoApellido: 'Martínez',
      direccion: 'Avenida 67 #89-12',
      telefono: '320-555-7890',
      usuario: 'carlos.rodriguez',
      tipoUsuario: 'Administrador',
      perfil: 'Super Admin'
    }
  ];

  users: any[] = [];
  filteredUsers: any[] = [];

  columns: TableColumn[] = [
    { key: 'documento', label: 'Documento' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'primerApellido', label: 'Primer Apellido' },
    { key: 'segundoApellido', label: 'Segundo Apellido' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'tipoUsuario', label: 'Tipo Usuario' },
    { key: 'perfil', label: 'Perfil' }
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

  ngOnInit() {
    this.users = [...this.allUsers];
    this.filteredUsers = [...this.allUsers];
  }

  filterUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.allUsers];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user =>
      user.nombre.toLowerCase().includes(searchLower) ||
      user.primerApellido.toLowerCase().includes(searchLower) ||
      user.segundoApellido.toLowerCase().includes(searchLower) ||
      user.documento.includes(this.searchTerm) ||
      user.tipoUsuario.toLowerCase().includes(searchLower) ||
      user.usuario.toLowerCase().includes(searchLower) ||
      user.perfil.toLowerCase().includes(searchLower)
    );
  }

  onRowClick(user: any) {
    console.log('Usuario seleccionado:', user);
  }

  editarUsuario(user: any) {
    console.log('Editar usuario:', user);
  }

  eliminarUsuario(user: any) {
    console.log('Eliminar usuario:', user);
    if (confirm(`¿Estás seguro de eliminar al usuario ${user.nombre} ${user.primerApellido}?`)) {
      this.allUsers = this.allUsers.filter(u => u.id !== user.id);
      this.users = this.users.filter(u => u.id !== user.id);
      this.filterUsers(); // Refiltra después de eliminar
    }
  }
}
