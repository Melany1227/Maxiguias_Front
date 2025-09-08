import { Component } from '@angular/core';
import { Table, TableColumn, TableAction } from './table';

@Component({
  selector: 'app-table-example',
  imports: [Table],
  template: `
    <div class="container mt-4">
      <h2>Ejemplo de Tabla - Listado de Personas</h2>
      <app-table 
        [data]="personas"
        [columns]="columns"
        [actions]="actions"
        [loading]="loading"
        (sort)="onSort($event)"
        (rowClick)="onRowClick($event)">
      </app-table>

      <h2 class="mt-5">Ejemplo de Tabla - Roles</h2>
      <app-table 
        [data]="roles"
        [columns]="rolesColumns"
        [actions]="rolesActions"
        emptyMessage="No hay roles configurados">
      </app-table>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 15px;
    }
  `]
})
export class TableExample {
  loading = false;

  // Datos de ejemplo para personas
  personas = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan@email.com',
      telefono: '123-456-7890',
      edad: 30,
      fechaCreacion: new Date('2023-01-15'),
      activo: true
    },
    {
      id: 2,
      nombre: 'María González',
      email: 'maria@email.com',
      telefono: '987-654-3210',
      edad: 28,
      fechaCreacion: new Date('2023-02-20'),
      activo: true
    },
    {
      id: 3,
      nombre: 'Carlos López',
      email: 'carlos@email.com',
      telefono: '555-123-4567',
      edad: 35,
      fechaCreacion: new Date('2023-03-10'),
      activo: false
    }
  ];

  // Configuración de columnas para personas
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, type: 'number' },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'edad', label: 'Edad', sortable: true, type: 'number' },
    { key: 'fechaCreacion', label: 'Fecha Creación', sortable: true, type: 'date' },
    { key: 'activo', label: 'Activo' }
  ];

  // Acciones para personas
  actions: TableAction[] = [
    {
      label: 'Editar',
      icon: '✏️',
      class: 'btn-outline-primary',
      action: (item) => this.editarPersona(item)
    },
    {
      label: 'Eliminar',
      icon: '🗑️',
      class: 'btn-outline-danger',
      action: (item) => this.eliminarPersona(item)
    },
    {
      label: 'Ver',
      class: 'btn-outline-warning',
      action: (item) => this.verPersona(item)
    }
  ];

  // Datos de ejemplo para roles
  roles = [
    {
      id: 1,
      nombre: 'Administrador',
      descripcion: 'Acceso completo al sistema',
      permisos: 15
    },
    {
      id: 2,
      nombre: 'Usuario',
      descripcion: 'Acceso limitado',
      permisos: 5
    }
  ];

  // Configuración de columnas para roles
  rolesColumns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, type: 'number' },
    { key: 'nombre', label: 'Nombre del Rol', sortable: true },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'permisos', label: 'Permisos', sortable: true, type: 'number' }
  ];

  // Acciones para roles
  rolesActions: TableAction[] = [
    {
      label: 'Configurar',
      action: (item) => this.configurarRol(item)
    }
  ];

  // Métodos de eventos
  onSort(event: { column: string; direction: 'asc' | 'desc' }) {
    console.log('Ordenar por:', event);
    // Aquí implementarías la lógica de ordenamiento
    // Por ejemplo, llamar a un servicio para obtener datos ordenados
  }

  onRowClick(item: any) {
    console.log('Fila clickeada:', item);
    // Navegar a detalle, abrir modal, etc.
  }

  // Métodos de acciones
  editarPersona(persona: any) {
    console.log('Editar persona:', persona);
    // Abrir modal de edición, navegar a formulario, etc.
  }

  eliminarPersona(persona: any) {
    console.log('Eliminar persona:', persona);
    // Mostrar confirmación, llamar servicio de eliminación, etc.
    if (confirm(`¿Estás seguro de eliminar a ${persona.nombre}?`)) {
      this.personas = this.personas.filter(p => p.id !== persona.id);
    }
  }

  verPersona(persona: any) {
    console.log('Ver persona:', persona);
    // Navegar a vista de detalle
  }

  configurarRol(rol: any) {
    console.log('Configurar rol:', rol);
    // Abrir configuración de permisos
  }
}