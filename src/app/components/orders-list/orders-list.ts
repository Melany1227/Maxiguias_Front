import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, Order } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-orders-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-list.html',
  styleUrl: './orders-list.css'
})
export class OrdersList implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  
  searchTerm: string = '';
  selectedStatus: string = '';
  sortBy: string = 'date';
  
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.cartService.orders$.subscribe(orders => {
        this.orders = orders;
        this.applyFilters();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  applyFilters() {
    let filtered = this.orders;

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.id.toString().includes(this.searchTerm)
      );
    }

    // Filtrar por estado
    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    this.filteredOrders = filtered;
    this.sortOrders();
  }

  sortOrders() {
    this.filteredOrders.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'total':
          return b.totalAmount - a.totalAmount;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }

  updateStatus(orderId: number, newStatus: Order['status']) {
    this.cartService.updateOrderStatus(orderId, newStatus);
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'in_progress': return 'status-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  getPriceTypeLabel(priceType: string): string {
    switch (priceType) {
      case 'wholesale': return 'Mayorista';
      case 'custom': return 'Por encargo';
      case 'retail': return 'Al público';
      default: return priceType;
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