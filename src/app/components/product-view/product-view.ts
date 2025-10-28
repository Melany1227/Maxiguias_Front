import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, ProductoBackend } from '../../services/product.service';

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
    private productService: ProductService
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
          alert('Guía no encontrada');
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

  deleteProduct() {
    if (this.producto && confirm(`¿Estás seguro de que quieres eliminar "${this.producto.nombre}"?`)) {
      this.productService.deleteProducto(this.producto.id).subscribe({
        next: (response) => {
          alert(response || 'Producto eliminado exitosamente');
          this.router.navigate(['/productos-admin']);
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          alert('Error al eliminar el producto: ' + error.message);
        }
      });
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