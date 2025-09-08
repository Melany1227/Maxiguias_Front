import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'actions';
}

export interface TableAction {
  label: string;
  icon?: string;
  class?: string;
  action: (item: any) => void;
}

@Component({
  selector: 'app-table',
  imports: [CommonModule],
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class Table {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() loading: boolean = false;
  @Input() emptyMessage: string = 'No hay registros para mostrar';
  @Input() sortable: boolean = true;
  @Input() striped: boolean = true;
  @Input() bordered: boolean = true;
  @Input() hover: boolean = true;

  @Output() sort = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  @Output() rowClick = new EventEmitter<any>();

  currentSort: { column: string; direction: 'asc' | 'desc' } | null = null;

  onSort(column: TableColumn) {
    if (!column.sortable || !this.sortable) return;

    const direction = this.currentSort?.column === column.key && this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    this.currentSort = { column: column.key, direction };
    this.sort.emit(this.currentSort);
  }

  onRowClick(item: any) {
    this.rowClick.emit(item);
  }

  executeAction(action: TableAction, item: any) {
    action.action(item);
  }

  getValue(item: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], item);
  }

  getSortIcon(column: TableColumn): string {
    if (!column.sortable || !this.sortable) return '';
    if (this.currentSort?.column !== column.key) return '↕️';
    return this.currentSort.direction === 'asc' ? '↑' : '↓';
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
