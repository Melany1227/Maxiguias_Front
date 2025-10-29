import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService, Orden } from '../../services/orders.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-details',
  imports: [CommonModule],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css'
})
export class OrderDetails implements OnInit, OnDestroy {
  order: Orden | null = null;
  loading: boolean = true;
  error: string | null = null;

  statusOptions = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_PROCESO', label: 'En Proceso' },
    { value: 'FINALIZADA', label: 'Finalizada' },
    { value: 'CANCELADA', label: 'Cancelada' },
    { value: 'FACTURADA', label: 'Facturada' }
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService
  ) {}

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(+orderId);
    } else {
      this.error = 'ID de orden no válido';
      this.loading = false;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadOrder(id: number) {
    this.loading = true;
    this.subscription.add(
      this.ordersService.getOrdenById(id).subscribe({
        next: (order) => {
          this.order = order;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading order:', error);
          this.error = 'Error al cargar la orden';
          this.loading = false;
        }
      })
    );
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  updateStatus(newStatus: string) {
    if (this.order) {
      // TODO: Implement status update API call
      console.log('Update status:', this.order.id, newStatus);
      this.order.estado = newStatus;
    }
  }

  getStatusLabel(estado: string): string {
    const statusOption = this.statusOptions.find(option => option.value === estado);
    return statusOption ? statusOption.label : estado;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getTotalItems(): number {
    return this.order?.detalles.reduce((total, detalle) => total + detalle.cantidad, 0) || 0;
  }

  printOrder() {
    window.print();
  }
}