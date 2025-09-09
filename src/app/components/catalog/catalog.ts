import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Product {
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
}

@Component({
  selector: 'app-catalog',
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css'
})
export class Catalog implements OnInit {

  searchTerm: string = '';
  selectedCategory: string = '';
  sortBy: string = 'name';
  
  products: Product[] = [
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
      onSale: true
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
      onSale: false
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
      onSale: false
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
      onSale: true
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
      onSale: false
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
      onSale: false
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
      onSale: false
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
      onSale: true
    }
  ];

  filteredProducts: Product[] = [];
  categories: string[] = [];

  ngOnInit() {
    this.loadCategories();
    this.filteredProducts = this.products;
  }

  loadCategories() {
    this.categories = [...new Set(this.products.map(p => p.category))];
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

  addToCart(product: Product) {
    console.log('Agregado al carrito:', product);
    // Aquí implementarías la lógica del carrito
  }

  viewDetails(product: Product) {
    console.log('Ver detalles de:', product);
    // Aquí implementarías la navegación a la página de detalles
  }
}
