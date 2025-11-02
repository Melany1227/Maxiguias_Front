import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { OrdersService, Usuario, CrearOrdenRequest } from '../../services/orders.service';
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-order-create',
  imports: [CommonModule, FormsModule],
  templateUrl: './order-create.html',
  styleUrl: './order-create.css'
})
export class OrderCreate implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  
  searchTerm: string = '';
  searchResults: Usuario[] = [];
  selectedUser: Usuario | null = null;
  deliveryDate: string = '';
  description: string = '';

  isSubmitting = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private cartService: CartService,
    private ordersService: OrdersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.cartService.cartItems$.subscribe(items => {
        // Filtrar items que tengan terminadoId válido
        this.cartItems = items.filter(item => item.terminadoId != null);
        this.cartTotal = this.cartService.getCartTotal();
        
        // Redirigir si el carrito está vacío
        if (this.cartItems.length === 0) {
          this.router.navigate(['/catalog']);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSearchTermChange() {
    if (this.searchTerm.trim().length >= 2) {
      this.ordersService.buscarUsuarios(this.searchTerm.trim()).subscribe({
        next: (usuarios) => {
          this.searchResults = usuarios;
        },
        error: (error) => {
          console.error('Error buscando usuarios:', error);
          this.searchResults = [];
        }
      });
    } else {
      this.searchResults = [];
    }
  }

  selectUser(usuario: Usuario) {
    this.selectedUser = usuario;
    this.searchResults = [];
    this.searchTerm = `${usuario.nombre} ${usuario.primerApellido}`;
  }

  clearSelection() {
    this.selectedUser = null;
    this.searchTerm = '';
    this.searchResults = [];
  }

  calculateDynamicPrice(item: CartItem, usuario: Usuario): number {
    // Obtener el tipo de usuario - necesito el campo que indique si es JURIDICO o NATURAL
    // Asumo que existe un campo tipoUsuario o similar
    const tipoUsuario = (usuario as any).tipoUsuario?.nombre || 'NATURAL';
    
    if (tipoUsuario === 'JURIDICO') {
      // Cliente jurídico: por encargo, pero si cantidad >= 2 entonces mayorista
      if (item.quantity >= 2) {
        return item.product.wholesalePrice;
      } else {
        return item.product.customOrderPrice;
      }
    } else {
      // Cliente natural: siempre precio al público
      return item.product.retailPrice;
    }
  }

  getDynamicPrice(item: CartItem): number {
    if (!this.selectedUser) {
      return item.unitPrice;
    }
    return this.calculateDynamicPrice(item, this.selectedUser);
  }

  getDynamicSubtotal(item: CartItem): number {
    return this.getDynamicPrice(item) * item.quantity;
  }

  getDynamicTotal(): number {
    if (!this.selectedUser) {
      return this.cartTotal;
    }
    return this.cartItems.reduce((total, item) => total + this.getDynamicSubtotal(item), 0);
  }

  onSubmit() {
    if (this.isValidForm() && !this.isSubmitting) {
      this.isSubmitting = true;
      
      // Validar que todos los items tengan terminadoId
      const invalidItems = this.cartItems.filter(item => !item.terminadoId);
      if (invalidItems.length > 0) {
        alert('Error: Algunos productos no tienen información completa. Por favor, vuelve a agregarlos al carrito.');
        this.isSubmitting = false;
        return;
      }
      
      // Recalcular precios según el tipo de cliente seleccionado
      const itemsWithDynamicPricing = this.cartItems.map(item => {
        const precio = this.calculateDynamicPrice(item, this.selectedUser!);
        return {
          ...item,
          unitPrice: precio,
          subtotal: precio * item.quantity
        };
      });

      const totalRecalculado = itemsWithDynamicPricing.reduce((total, item) => total + item.subtotal, 0);

      const request: CrearOrdenRequest = {
        orden: {
          usuario: this.selectedUser!,
          fechaEntrega: new Date(this.deliveryDate),
          descripcionVenta: this.description,
          totalFactura: totalRecalculado
        },
        terminadosId: itemsWithDynamicPricing.map(item => item.terminadoId),
        cantidades: itemsWithDynamicPricing.map(item => item.quantity),
        valores: itemsWithDynamicPricing.map(item => item.unitPrice),
        descripciones: itemsWithDynamicPricing.map(item => item.product.description)
      };

      this.ordersService.crearOrden(request).subscribe({
        next: (response) => {
          alert(response);
          this.cartService.clearCart();
          this.router.navigate(['/orders']);
        },
        error: (error) => {
          console.error('Error al crear la orden:', error);
          alert('Error al crear el pedido. Por favor intenta nuevamente.');
          this.isSubmitting = false;
        }
      });
    }
  }

  isValidForm(): boolean {
    return !!(
      this.selectedUser &&
      this.deliveryDate.trim() &&
      this.description.trim() &&
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