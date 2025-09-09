import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService, Product } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css'
})
export class Catalog implements OnInit, OnDestroy {
  searchTerm: string = '';
  selectedCategory: string = '';
  sortBy: string = 'name';
  
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  
  private subscription: Subscription = new Subscription();

  constructor(
    private cartService: CartService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.productService.products$.subscribe(products => {
        this.products = products;
        this.loadCategories();
        this.filterProducts();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadCategories() {
    this.categories = this.productService.getCategories();
  }

  filterProducts() {
    let filtered = this.products;

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
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
        case 'price':
          return a.retailPrice - b.retailPrice;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  addToCart(product: Product, priceType: 'wholesale' | 'custom' | 'retail' = 'retail') {
    console.log('Botón presionado - Producto:', product.name, 'Precio:', priceType);
    try {
      this.cartService.addToCart(product, 1, priceType);
      console.log(`✅ Producto ${product.name} agregado al carrito con precio ${priceType}`);
      alert(`✅ ${product.name} agregado al carrito`);
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      alert('Error al agregar al carrito');
    }
  }

  viewDetails(product: Product) {
    console.log('Ver detalles de:', product);
    // Aquí implementarías la navegación a la página de detalles
  }

  getPriceType(value: string): 'wholesale' | 'custom' | 'retail' {
    if (value === 'wholesale' || value === 'custom' || value === 'retail') {
      return value;
    }
    return 'retail';
  }
}
