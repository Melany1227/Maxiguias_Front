import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './products-admin.html',
  styleUrl: './products-admin.css'
})
export class ProductsAdmin implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  
  searchTerm: string = '';
  selectedCategory: string = '';
  sortBy: string = 'name';
  
  categories: string[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.productService.products$.subscribe(products => {
        this.products = products;
        this.categories = this.productService.getCategories();
        this.applyFilters();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  applyFilters() {
    let filtered = this.products;

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      filtered = this.productService.searchProducts(this.searchTerm);
    }

    // Filtrar por categoría
    if (this.selectedCategory) {
      filtered = filtered.filter(product => product.category === this.selectedCategory);
    }

    this.filteredProducts = filtered;
    this.sortProducts();
  }

  sortProducts() {
    this.filteredProducts.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'retailPrice':
          return a.retailPrice - b.retailPrice;
        case 'stock':
          return (b.stock || 0) - (a.stock || 0);
        default:
          return 0;
      }
    });
  }

  createProduct() {
    this.router.navigate(['/products/create']);
  }

  editProduct(id: number) {
    this.router.navigate(['/products/edit', id]);
  }

  viewProduct(id: number) {
    this.router.navigate(['/products/details', id]);
  }

  deleteProduct(product: Product) {
    if (confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) {
      const success = this.productService.deleteProduct(product.id);
      if (success) {
        alert('Producto eliminado exitosamente');
      } else {
        alert('Error al eliminar el producto');
      }
    }
  }

  toggleProductStatus(product: Product, field: 'isNew' | 'onSale') {
    const updates = { [field]: !product[field] };
    this.productService.updateProduct(product.id, updates);
  }

  updateStock(product: Product, newStock: number) {
    if (newStock >= 0) {
      this.productService.updateStock(product.id, newStock);
    }
  }

  exportProducts() {
    const products = this.productService.exportProducts();
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'productos.json';
    link.click();
  }

  importProducts(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const products = JSON.parse(e.target?.result as string);
          this.productService.importProducts(products);
          alert('Productos importados exitosamente');
        } catch (error) {
          alert('Error al importar productos: archivo inválido');
        }
      };
      reader.readAsText(file);
    }
  }

  getStockStatus(stock?: number): string {
    if (!stock || stock === 0) return 'Sin stock';
    if (stock <= 10) return 'Stock bajo';
    return 'En stock';
  }

  getStockClass(stock?: number): string {
    if (!stock || stock === 0) return 'stock-out';
    if (stock <= 10) return 'stock-low';
    return 'stock-ok';
  }
}