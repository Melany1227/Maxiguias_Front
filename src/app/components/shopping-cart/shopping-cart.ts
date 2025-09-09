import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shopping-cart',
  imports: [CommonModule],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.css'
})
export class ShoppingCart implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  cartItemCount: number = 0;
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
        this.cartItemCount = this.cartService.getCartItemCount();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  updateQuantity(productId: number, priceType: 'wholesale' | 'custom' | 'retail', quantity: number) {
    this.cartService.updateQuantity(productId, priceType, quantity);
  }

  removeItem(productId: number, priceType: 'wholesale' | 'custom' | 'retail') {
    this.cartService.removeFromCart(productId, priceType);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  proceedToCheckout() {
    if (this.cartItems.length > 0) {
      this.router.navigate(['/order-create']);
    }
  }

  continueShopping() {
    this.router.navigate(['/catalog']);
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