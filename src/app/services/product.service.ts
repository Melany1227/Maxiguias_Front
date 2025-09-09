import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from './cart.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products = new BehaviorSubject<Product[]>([]);
  products$ = this.products.asObservable();

  constructor() {
    this.loadProductsFromStorage();
    this.initializeDefaultProducts();
  }

  // CRUD Operations
  getAllProducts(): Product[] {
    return this.products.value;
  }

  getProductById(id: number): Product | undefined {
    return this.products.value.find(product => product.id === id);
  }

  createProduct(productData: Omit<Product, 'id'>): Product {
    const currentProducts = this.products.value;
    const newId = currentProducts.length > 0 ? Math.max(...currentProducts.map(p => p.id)) + 1 : 1;
    
    const newProduct: Product = {
      id: newId,
      ...productData
    };

    const updatedProducts = [...currentProducts, newProduct];
    this.products.next(updatedProducts);
    this.saveProductsToStorage();
    
    return newProduct;
  }

  updateProduct(id: number, productData: Partial<Product>): Product | null {
    const currentProducts = this.products.value;
    const productIndex = currentProducts.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return null;
    }

    const updatedProduct = { ...currentProducts[productIndex], ...productData, id };
    currentProducts[productIndex] = updatedProduct;
    
    this.products.next([...currentProducts]);
    this.saveProductsToStorage();
    
    return updatedProduct;
  }

  deleteProduct(id: number): boolean {
    const currentProducts = this.products.value;
    const filteredProducts = currentProducts.filter(p => p.id !== id);
    
    if (filteredProducts.length === currentProducts.length) {
      return false; // Product not found
    }

    this.products.next(filteredProducts);
    this.saveProductsToStorage();
    return true;
  }

  // Search and Filter
  searchProducts(term: string): Product[] {
    if (!term) return this.products.value;
    
    const searchTerm = term.toLowerCase();
    return this.products.value.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }

  getProductsByCategory(category: string): Product[] {
    if (!category) return this.products.value;
    return this.products.value.filter(product => product.category === category);
  }

  getCategories(): string[] {
    const categories = this.products.value.map(p => p.category);
    return [...new Set(categories)].sort();
  }

  // Inventory Management
  updateStock(id: number, newStock: number): boolean {
    const product = this.getProductById(id);
    if (!product) return false;
    
    return this.updateProduct(id, { stock: newStock }) !== null;
  }

  isInStock(id: number): boolean {
    const product = this.getProductById(id);
    return product ? (product.stock || 0) > 0 : false;
  }

  // Storage Operations
  private saveProductsToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('products', JSON.stringify(this.products.value));
    }
  }

  private loadProductsFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('products');
      if (saved) {
        this.products.next(JSON.parse(saved));
      }
    }
  }

  // Initialize with default products if none exist
  private initializeDefaultProducts() {
    if (this.products.value.length === 0) {
      const defaultProducts: Product[] = [
        {
          id: 1,
          name: 'Hilo Poliéster 40/2',
          description: 'Hilo de poliéster de alta resistencia, ideal para todo tipo de tejidos. Disponible en múltiples colores.',
          wholesalePrice: 6500,
          customOrderPrice: 8000,
          retailPrice: 8500,
          originalPrice: 10000,
          category: 'Hilos',
          image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=220&fit=crop',
          isNew: false,
          onSale: true,
          stock: 50
        },
        {
          id: 2,
          name: 'Agujas Schmetz Universal',
          description: 'Set de agujas universales para máquina de coser. Tamaños 70/10, 80/12, 90/14. Pack de 10 unidades.',
          wholesalePrice: 12000,
          customOrderPrice: 14000,
          retailPrice: 15000,
          category: 'Agujas',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=220&fit=crop',
          isNew: true,
          onSale: false,
          stock: 25
        },
        {
          id: 3,
          name: 'Cremallera Invisible 22cm',
          description: 'Cremallera invisible de alta calidad, perfecta para vestidos y faldas. Disponible en colores básicos.',
          wholesalePrice: 3200,
          customOrderPrice: 3800,
          retailPrice: 4200,
          category: 'Cierres',
          image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7f23?w=300&h=220&fit=crop',
          isNew: false,
          onSale: false,
          stock: 100
        },
        {
          id: 4,
          name: 'Botones Nácar 15mm',
          description: 'Hermosos botones de nácar natural, ideales para camisas y blusas elegantes. Pack de 12 unidades.',
          wholesalePrice: 14000,
          customOrderPrice: 16000,
          retailPrice: 18000,
          originalPrice: 22000,
          category: 'Botones',
          image: 'https://images.unsplash.com/photo-1604052276-8ac4aff36ce7?w=300&h=220&fit=crop',
          isNew: false,
          onSale: true,
          stock: 75
        },
        {
          id: 5,
          name: 'Tijeras de Sastre Profesionales',
          description: 'Tijeras de acero inoxidable de 25cm, con mango ergonómico. Ideal para cortes precisos en tela.',
          wholesalePrice: 68000,
          customOrderPrice: 78000,
          retailPrice: 85000,
          category: 'Herramientas',
          image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=300&h=220&fit=crop',
          isNew: true,
          onSale: false,
          stock: 15
        },
        {
          id: 6,
          name: 'Entretela Termoadhesiva',
          description: 'Entretela blanca termoadhesiva de peso medio. Rollo de 1 metro de ancho por 25 metros de largo.',
          wholesalePrice: 28000,
          customOrderPrice: 32000,
          retailPrice: 35000,
          category: 'Entretelas',
          image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=300&h=220&fit=crop',
          isNew: false,
          onSale: false,
          stock: 30
        },
        {
          id: 7,
          name: 'Cinta Métrica Profesional',
          description: 'Cinta métrica de 150cm con marcas precisas en centímetros y pulgadas. Material flexible y resistente.',
          wholesalePrice: 9500,
          customOrderPrice: 11000,
          retailPrice: 12000,
          category: 'Herramientas',
          image: 'https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=300&h=220&fit=crop',
          isNew: false,
          onSale: false,
          stock: 40
        },
        {
          id: 8,
          name: 'Elástico 2cm Blanco',
          description: 'Elástico plano de 2cm de ancho, suave y resistente. Ideal para cinturillas y puños. Rollo de 10 metros.',
          wholesalePrice: 6000,
          customOrderPrice: 7200,
          retailPrice: 8000,
          originalPrice: 10000,
          category: 'Elásticos',
          image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&h=220&fit=crop',
          isNew: false,
          onSale: true,
          stock: 60
        }
      ];

      this.products.next(defaultProducts);
      this.saveProductsToStorage();
    }
  }

  // Bulk operations
  importProducts(products: Product[]): void {
    this.products.next(products);
    this.saveProductsToStorage();
  }

  exportProducts(): Product[] {
    return this.products.value;
  }

  clearAllProducts(): void {
    this.products.next([]);
    this.saveProductsToStorage();
  }
}