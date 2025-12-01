import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, ProductoBackend } from '../../services/product.service';
import { AlertService } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './products-admin.html',
  styleUrl: './products-admin.css'
})
export class ProductsAdmin implements OnInit, OnDestroy {
  productos: ProductoBackend[] = [];
  filteredProductos: ProductoBackend[] = [];
  
  searchTerm: string = '';
  sortBy: string = 'nombre';
  isLoading: boolean = false;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private productService: ProductService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadProductos();
    
    this.subscription.add(
      this.productService.productos$.subscribe(productos => {
        this.productos = productos;
        this.applyFilters();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadProductos() {
    this.isLoading = true;
    this.productService.loadProductosFromAPI(this.searchTerm || undefined);
    setTimeout(() => this.isLoading = false, 1000);
  }

  applyFilters() {
    let filtered = this.productos;

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      filtered = this.productService.searchProductos(this.searchTerm);
    }

    this.filteredProductos = filtered;
    this.sortProducts();
  }

  onSearchChange() {
    this.loadProductos();
  }

  sortProducts() {
    this.filteredProductos.sort((a, b) => {
      switch (this.sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'id':
          return a.id - b.id;
        case 'terminados':
          return b.terminados.length - a.terminados.length;
        default:
          return 0;
      }
    });
  }

  createProduct() {
    this.router.navigate(['/productos-admin/crear']);
  }

  editProduct(id: number) {
    this.router.navigate(['/productos-admin/editar', id]);
  }

  viewProduct(id: number) {
    this.router.navigate(['/productos-admin/ver', id]);
  }

  async deleteProduct(producto: ProductoBackend) {
    const confirmed = await this.alertService.confirm({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar "${producto.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      this.productService.deleteProducto(producto.id).subscribe({
        next: (response) => {
          console.log('Response from backend:', response);
          this.alertService.showSuccess(response || 'Producto eliminado exitosamente', 'Éxito');
          this.loadProductos(); // Reload the list
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.alertService.showError('Error al eliminar el producto: ' + error.message, 'Error');
        }
      });
    }
  }

  refreshProductos() {
    this.searchTerm = '';
    this.loadProductos();
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }

  getAveragePrice(producto: ProductoBackend): number {
    if (producto.terminados.length === 0) return 0;
    
    const total = producto.terminados.reduce((sum, terminado) => sum + terminado.precioPublico, 0);
    return total / producto.terminados.length;
  }

  getPriceRange(producto: ProductoBackend): string {
    if (producto.terminados.length === 0) return 'Sin precios';
    
    const precios = producto.terminados.map(t => t.precioPublico);
    const min = Math.min(...precios);
    const max = Math.max(...precios);
    
    if (min === max) {
      return this.formatPrice(min);
    } else {
      return `${this.formatPrice(min)} - ${this.formatPrice(max)}`;
    }
  }

  getTerminadosCount(producto: ProductoBackend): number {
    return producto.terminados.length;
  }

  getTotalTerminados(): number {
    return this.productos.reduce((total, p) => total + p.terminados.length, 0);
  }
}