import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService, Order } from '../../services/cart.service';

@Component({
  selector: 'app-order-details',
  imports: [CommonModule],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css'
})
export class OrderDetails implements OnInit {
  order: Order | null = null;
  orderId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId = +params['id'];
      this.loadOrder();
    });
  }

  loadOrder() {
    const foundOrder = this.cartService.getOrderById(this.orderId);
    this.order = foundOrder || null;
    if (!this.order) {
      this.router.navigate(['/orders']);
    }
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  updateStatus(newStatus: Order['status']) {
    if (this.order) {
      this.cartService.updateOrderStatus(this.order.id, newStatus);
      this.order.status = newStatus;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'in_progress': return 'En progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  printOrder() {
    window.print();
  }
}