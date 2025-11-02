import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  description: string;
  wholesalePrice: number;
  customOrderPrice: number;
  retailPrice: number;
  originalPrice?: number;
  category: string;
  image: string;
  isNew?: boolean;
  onSale?: boolean;
  stock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  priceType: 'wholesale' | 'custom' | 'retail';
  unitPrice: number;
  subtotal: number;
  terminadoId: number;
}

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priceType: 'wholesale' | 'custom' | 'retail';
  orderDate: Date;
  deliveryDate?: Date;
  notes?: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private orders = new BehaviorSubject<Order[]>([]);
  
  cartItems$ = this.cartItems.asObservable();
  orders$ = this.orders.asObservable();

  constructor() {
    this.loadCartFromStorage();
    this.loadOrdersFromStorage();
  }

  // Cart Methods
  addToCart(product: Product, quantity: number = 1, priceType: 'wholesale' | 'custom' | 'retail' = 'retail', terminadoId?: number) {
    console.log('🛒 CartService.addToCart llamado:', { product: product.name, quantity, priceType, terminadoId });
    
    if (!terminadoId) {
      console.error('⚠️ terminadoId es requerido');
      throw new Error('terminadoId es requerido para agregar al carrito');
    }
    
    const currentItems = this.cartItems.value;
    console.log('📦 Items actuales en carrito:', currentItems.length);
    
    const unitPrice = this.getProductPrice(product, priceType);
    console.log('💰 Precio unitario:', unitPrice);
    
    const existingItemIndex = currentItems.findIndex(
      item => item.product.id === product.id && item.priceType === priceType && item.terminadoId === terminadoId
    );

    if (existingItemIndex > -1) {
      console.log('✏️ Actualizando item existente');
      currentItems[existingItemIndex].quantity += quantity;
      currentItems[existingItemIndex].subtotal = currentItems[existingItemIndex].quantity * unitPrice;
    } else {
      console.log('➕ Agregando nuevo item');
      const newItem: CartItem = {
        product,
        quantity,
        priceType,
        unitPrice,
        subtotal: quantity * unitPrice,
        terminadoId
      };
      currentItems.push(newItem);
    }

    console.log('📦 Items después del cambio:', currentItems.length);
    this.cartItems.next(currentItems);
    this.saveCartToStorage();
    console.log('✅ Item agregado al carrito exitosamente');
  }

  removeFromCart(productId: number, priceType: 'wholesale' | 'custom' | 'retail', terminadoId?: number) {
    const currentItems = this.cartItems.value.filter(
      item => !(item.product.id === productId && item.priceType === priceType && (terminadoId ? item.terminadoId === terminadoId : true))
    );
    this.cartItems.next(currentItems);
    this.saveCartToStorage();
  }

  updateQuantity(productId: number, priceType: 'wholesale' | 'custom' | 'retail', quantity: number, terminadoId?: number) {
    const currentItems = this.cartItems.value;
    const itemIndex = currentItems.findIndex(
      item => item.product.id === productId && item.priceType === priceType && (terminadoId ? item.terminadoId === terminadoId : true)
    );

    if (itemIndex > -1) {
      if (quantity <= 0) {
        this.removeFromCart(productId, priceType, terminadoId);
      } else {
        currentItems[itemIndex].quantity = quantity;
        currentItems[itemIndex].subtotal = quantity * currentItems[itemIndex].unitPrice;
        this.cartItems.next(currentItems);
        this.saveCartToStorage();
      }
    }
  }

  clearCart() {
    this.cartItems.next([]);
    this.saveCartToStorage();
  }

  getCartTotal(): number {
    return this.cartItems.value.reduce((total, item) => total + item.subtotal, 0);
  }

  getCartItemCount(): number {
    return this.cartItems.value.reduce((count, item) => count + item.quantity, 0);
  }

  // Order Methods
  createOrder(customerInfo: { name: string; email: string; phone: string; notes?: string; deliveryDate?: Date }): Order {
    const cartItems = this.cartItems.value;
    if (cartItems.length === 0) {
      throw new Error('El carrito está vacío');
    }

    const orderItems: OrderItem[] = cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal
    }));

    const newOrder: Order = {
      id: Date.now(), // En producción usarías un ID del backend
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      items: orderItems,
      totalAmount: this.getCartTotal(),
      status: 'pending',
      priceType: cartItems[0]?.priceType || 'retail', // Asume mismo tipo para toda la orden
      orderDate: new Date(),
      deliveryDate: customerInfo.deliveryDate,
      notes: customerInfo.notes
    };

    const currentOrders = this.orders.value;
    currentOrders.unshift(newOrder);
    this.orders.next(currentOrders);
    this.saveOrdersToStorage();
    
    this.clearCart();
    return newOrder;
  }

  updateOrderStatus(orderId: number, status: Order['status']) {
    const currentOrders = this.orders.value;
    const orderIndex = currentOrders.findIndex(order => order.id === orderId);
    
    if (orderIndex > -1) {
      currentOrders[orderIndex].status = status;
      this.orders.next(currentOrders);
      this.saveOrdersToStorage();
    }
  }

  getOrderById(id: number): Order | undefined {
    return this.orders.value.find(order => order.id === id);
  }

  // Helper Methods
  private getProductPrice(product: Product, priceType: 'wholesale' | 'custom' | 'retail'): number {
    switch (priceType) {
      case 'wholesale':
        return product.wholesalePrice;
      case 'custom':
        return product.customOrderPrice;
      case 'retail':
      default:
        return product.retailPrice;
    }
  }

  private saveCartToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
    }
  }

  private loadCartFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('cart');
      if (saved) {
        try {
          const items = JSON.parse(saved);
          // Verificar que todos los items tengan terminadoId
          const validItems = items.filter((item: any) => item.terminadoId != null);
          this.cartItems.next(validItems);
          
          // Si hubo items inválidos, guardar la versión limpia
          if (validItems.length !== items.length) {
            this.saveCartToStorage();
          }
        } catch (error) {
          console.error('Error loading cart from storage:', error);
          this.cartItems.next([]);
        }
      }
    }
  }

  private saveOrdersToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('orders', JSON.stringify(this.orders.value));
    }
  }

  private loadOrdersFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('orders');
      if (saved) {
        this.orders.next(JSON.parse(saved));
      }
    }
  }
}