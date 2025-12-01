import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService, Product } from '../../services/cart.service';
import { CatalogService, ProductoCatalogoDTO, CatalogStats } from '../../services/catalog.service';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css'
})
export class Catalog implements OnInit, OnDestroy {
  searchTerm: string = '';
  sortBy: string = 'nombre';
  
  productos: ProductoCatalogoDTO[] = [];
  catalogStats: CatalogStats = {
    totalProductos: 0,
    precioPromedio: 0,
    totalTerminados: 0,
    disponibilidadPorEncargo: '100%'
  };
  isLoading: boolean = false;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private cartService: CartService,
    public catalogService: CatalogService,
    public authService: AuthService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    console.log('Catalog component initialized');
    // Subscribe to products from catalog service
    this.subscription.add(
      this.catalogService.productos$.subscribe(productos => {
        console.log('Catalog component received products:', productos);
        this.productos = productos;
        this.sortProducts();
      })
    );

    // Subscribe to catalog stats
    this.subscription.add(
      this.catalogService.stats$.subscribe(stats => {
        console.log('Catalog component received stats:', stats);
        this.catalogStats = stats;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onSearchChange() {
    if (this.searchTerm.trim()) {
      this.isLoading = true;
      this.catalogService.searchAndUpdate(this.searchTerm.trim());
      // Loading will be set to false when subscription receives new data
      setTimeout(() => this.isLoading = false, 1000);
    } else {
      this.refreshCatalog();
    }
  }

  refreshCatalog() {
    this.isLoading = true;
    this.catalogService.refreshCatalog();
    setTimeout(() => this.isLoading = false, 1000);
  }

  sortProducts() {
    this.productos.sort((a, b) => {
      switch (this.sortBy) {
        case 'precio':
          const priceA = a.terminados.length > 0 ? a.terminados[0].precioPublico : 0;
          const priceB = b.terminados.length > 0 ? b.terminados[0].precioPublico : 0;
          return priceA - priceB;
        case 'medidas':
          return b.terminados.length - a.terminados.length;
        case 'nombre':
        default:
          return a.nombre.localeCompare(b.nombre);
      }
    });
  }

  addToCart(producto: ProductoCatalogoDTO, terminado?: any) {
    // Use first terminado if none specified
    const selectedTerminado = terminado || (producto.terminados.length > 0 ? producto.terminados[0] : null);
    
    if (!selectedTerminado) {
      this.alertService.showError('Producto sin información de precios', 'Error');
      return;
    }
    
    console.log('Botón presionado - Producto:', producto.nombre, 'Terminado:', selectedTerminado);
    
    try {
      // Convert ProductoCatalogoDTO to Product for cart service
      const cartProduct: Product = {
        id: producto.id,
        name: producto.nombre,
        description: `${producto.nombre} - ${selectedTerminado.medidaTerminadoProducto}m`,
        retailPrice: selectedTerminado.precioPublico,
        wholesalePrice: selectedTerminado.precioPorMayor,
        customOrderPrice: selectedTerminado.precioPorEncargo,
        stock: 999, // High stock since it's made to order
        category: 'Guía', // Default category for guides
        image: 'assets/images/GuiaR.png'
      };
      
      this.cartService.addToCart(cartProduct, 1, 'retail', selectedTerminado.id);
      console.log(`✅ Producto ${producto.nombre} agregado al carrito`);
      this.alertService.showSuccess(`${producto.nombre} agregado al carrito`, 'Éxito');
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      this.alertService.showError('Error al agregar al carrito', 'Error');
    }
  }

  viewDetails(producto: ProductoCatalogoDTO) {
    console.log('Ver detalles de:', producto);
    // Aquí implementarías la navegación a la página de detalles
  }

  formatPrice(price: number): string {
    return this.catalogService.formatPrice(price);
  }

  // Check if user is logged in
  isUserLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  // Check if user is juridical
  isJuridicalUser(): boolean {
    return this.authService.isJuridico();
  }

}
