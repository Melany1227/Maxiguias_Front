import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrdersService, Orden } from '../../services/orders.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-orders-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-list.html',
  styleUrl: './orders-list.css'
})
export class OrdersList implements OnInit, OnDestroy {
  orders: Orden[] = [];
  filteredOrders: Orden[] = [];
  
  searchTerm: string = '';
  selectedStatus: string = '';
  sortBy: string = 'date';
  
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_PROCESO', label: 'En Proceso' },
    { value: 'FINALIZADA', label: 'Finalizada' },
    { value: 'CANCELADA', label: 'Cancelada' },
    { value: 'FACTURADA', label: 'Facturada' }
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private ordersService: OrdersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.ordersService.orders$.subscribe(orders => {
        this.orders = orders;
        this.applyFilters();
      })
    );
    this.ordersService.loadOrdenesAndUpdate();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  applyFilters() {
    let filtered = this.orders;

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(order =>
        order.usuario.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.usuario.primerApellido.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.usuario.nombreUsuario.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.id.toString().includes(this.searchTerm)
      );
    }

    // Filtrar por estado
    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.estado === this.selectedStatus);
    }

    this.filteredOrders = filtered;
    this.sortOrders();
  }

  sortOrders() {
    this.filteredOrders.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime();
        case 'customer':
          return a.usuario.nombre.localeCompare(b.usuario.nombre);
        case 'total':
          return b.total - a.total;
        case 'status':
          return a.estado.localeCompare(b.estado);
        default:
          return 0;
      }
    });
  }

  updateStatus(orderId: number, newStatus: string) {
    // TODO: Implement order status update API call
    console.log('Update status:', orderId, newStatus);
  }

  viewOrder(orderId: number) {
    this.router.navigate(['/order-details', orderId]);
  }

  createNewOrder() {
    this.router.navigate(['/catalog']);
  }

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'status-pending';
      case 'EN_PROCESO': return 'status-progress';
      case 'FINALIZADA': return 'status-completed';
      case 'CANCELADA': return 'status-cancelled';
      case 'FACTURADA': return 'status-confirmed';
      default: return 'status-default';
    }
  }

  getPriceTypeLabel(tipoVenta: string): string {
    switch (tipoVenta) {
      case 'MAYORISTA': return 'Mayorista';
      case 'POR_ENCARGO': return 'Por encargo';
      case 'AL_PUBLICO': return 'Al público';
      default: return tipoVenta;
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}