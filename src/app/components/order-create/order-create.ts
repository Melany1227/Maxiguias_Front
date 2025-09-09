import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem, Order } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-create',
  imports: [CommonModule, FormsModule],
  templateUrl: './order-create.html',
  styleUrl: './order-create.css'
})
export class OrderCreate implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  
  customerInfo = {
    name: '',
    email: '',
    phone: '',
    notes: '',
    deliveryDate: ''
  };

  isSubmitting = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.cartService.cartItems$.subscribe(items => {
        this.cartItems = items;
        this.cartTotal = this.cartService.getCartTotal();
        
        // Redirigir si el carrito está vacío
        if (items.length === 0) {
          this.router.navigate(['/catalog']);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSubmit() {
    if (this.isValidForm() && !this.isSubmitting) {
      this.isSubmitting = true;
      
      try {
        const orderData = {
          name: this.customerInfo.name,
          email: this.customerInfo.email,
          phone: this.customerInfo.phone,
          notes: this.customerInfo.notes || undefined,
          deliveryDate: this.customerInfo.deliveryDate ? new Date(this.customerInfo.deliveryDate) : undefined
        };

        const newOrder = this.cartService.createOrder(orderData);
        
        // Mostrar mensaje de éxito y redirigir
        alert(`¡Pedido creado exitosamente! Número de orden: ${newOrder.id}`);
        this.router.navigate(['/orders']);
        
      } catch (error) {
        console.error('Error al crear la orden:', error);
        alert('Error al crear el pedido. Por favor intenta nuevamente.');
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  isValidForm(): boolean {
    return !!(
      this.customerInfo.name.trim() &&
      this.customerInfo.email.trim() &&
      this.customerInfo.phone.trim() &&
      this.cartItems.length > 0
    );
  }

  goBack() {
    this.router.navigate(['/cart']);
  }

  getPriceTypeLabel(priceType: string): string {
    switch (priceType) {
      case 'wholesale': return 'Mayorista';
      case 'custom': return 'Por encargo';
      case 'retail': return 'Al público';
      default: return priceType;
    }
  }
}