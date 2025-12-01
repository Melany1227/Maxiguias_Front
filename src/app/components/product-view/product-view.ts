import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, ProductoBackend } from '../../services/product.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-product-view',
  imports: [CommonModule],
  templateUrl: './product-view.html',
  styleUrl: './product-view.css'
})
export class ProductView implements OnInit {
  producto?: ProductoBackend;
  isLoading = false;
  productId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.productId = +this.route.snapshot.params['id'];
    if (this.productId) {
      this.loadProducto();
    }
  }

  loadProducto() {
    if (this.productId) {
      this.isLoading = true;
      this.productService.getProductoById(this.productId).subscribe({
        next: (producto) => {
          this.producto = producto;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading producto:', error);
          this.alertService.showError('Guía no encontrada', 'Error');
          this.router.navigate(['/productos-admin']);
          this.isLoading = false;
        }
      });
    }
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }

  editProduct() {
    if (this.productId) {
      this.router.navigate(['/productos-admin/editar', this.productId]);
    }
  }

  async deleteProduct() {
    if (this.producto) {
      const confirmed = await this.alertService.confirm({
        title: 'Confirmar eliminación',
        message: `¿Estás seguro de que quieres eliminar "${this.producto.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      });

      if (confirmed) {
        this.productService.deleteProducto(this.producto.id).subscribe({
          next: (response) => {
            this.alertService.showSuccess(response || 'Producto eliminado exitosamente', 'Éxito');
            this.router.navigate(['/productos-admin']);
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.alertService.showError('Error al eliminar el producto: ' + error.message, 'Error');
          }
        });
      }
    }
  }

  goBack() {
    this.router.navigate(['/productos-admin']);
  }

  getTerminadosCount(): number {
    return this.producto?.terminados.length || 0;
  }

  getPriceRange(): string {
    if (!this.producto || this.producto.terminados.length === 0) return 'Sin precios';
    
    const precios = this.producto.terminados.map(t => t.precioPublico);
    const min = Math.min(...precios);
    const max = Math.max(...precios);
    
    if (min === max) {
      return this.formatPrice(min);
    } else {
      return `${this.formatPrice(min)} - ${this.formatPrice(max)}`;
    }
  }

  getAveragePrice(): number {
    if (!this.producto || this.producto.terminados.length === 0) return 0;
    
    const total = this.producto.terminados.reduce((sum, terminado) => sum + terminado.precioPublico, 0);
    return total / this.producto.terminados.length;
  }
}