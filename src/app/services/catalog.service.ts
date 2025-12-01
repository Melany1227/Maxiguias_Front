import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Terminado {
  id: number;
  medidaTerminadoProducto: number;
  precioPublico: number;
  precioPorMayor: number;
  precioPorEncargo: number;
  gananciaXMayor?: number;
  gananciaXEncargo?: number;
}

export interface ProductoCatalogoDTO {
  id: number;
  nombre: string;
  imagen?: string;
  terminados: Terminado[];
}

export interface CatalogoResponse {
  productos: ProductoCatalogoDTO[];
}

export interface BusquedaRequest {
  busqueda: string;
}

export interface CatalogStats {
  totalProductos: number;
  precioPromedio: number;
  totalTerminados: number;
  disponibilidadPorEncargo: string;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private baseUrl = 'http://localhost:8080/api/productos';
  private productos = new BehaviorSubject<ProductoCatalogoDTO[]>([]);
  private stats = new BehaviorSubject<CatalogStats>({
    totalProductos: 0,
    precioPromedio: 0,
    totalTerminados: 0,
    disponibilidadPorEncargo: '100%'
  });

  productos$ = this.productos.asObservable();
  stats$ = this.stats.asObservable();

  constructor(private http: HttpClient) {
    console.log('CatalogService initialized, loading catalog...');
    this.loadCatalog();
  }

  // Load all products from catalog
  loadCatalog(): void {
    console.log('Making request to:', `${this.baseUrl}/catalogo`);
    this.http.get<CatalogoResponse>(`${this.baseUrl}/catalogo`).subscribe({
      next: (response) => {
        console.log('Catalog loaded from API:', response);
        this.productos.next(response.productos);
        this.updateStats(response.productos);
      },
      error: (error) => {
        console.error('Error loading catalog from API:', error);
        console.error('Error details:', error);
        this.loadFallbackData();
      }
    });
  }

  // Search products
  searchProducts(busqueda: string): Observable<CatalogoResponse> {
    const request: BusquedaRequest = { busqueda };
    return this.http.post<CatalogoResponse>(`${this.baseUrl}/catalogo/buscar`, request);
  }

  // Search and update local state
  searchAndUpdate(busqueda: string): void {
    this.searchProducts(busqueda).subscribe({
      next: (response) => {
        console.log('Search results:', response);
        this.productos.next(response.productos);
        this.updateStats(response.productos);
      },
      error: (error) => {
        console.error('Error searching products:', error);
      }
    });
  }

  // Get all products (local)
  getAllProducts(): ProductoCatalogoDTO[] {
    return this.productos.value;
  }

  // Get product by ID
  getProductById(id: number): ProductoCatalogoDTO | undefined {
    return this.productos.value.find(producto => producto.id === id);
  }

  // Get current stats
  getCurrentStats(): CatalogStats {
    return this.stats.value;
  }

  // Update stats based on products
  private updateStats(productos: ProductoCatalogoDTO[]): void {
    const totalProductos = productos.length;
    
    // Calculate average price from all terminados and count total terminados
    let totalPrecios = 0;
    let totalTerminados = 0;
    productos.forEach(producto => {
      totalTerminados += producto.terminados.length;
      producto.terminados.forEach(terminado => {
        totalPrecios += terminado.precioPublico;
      });
    });
    
    const precioPromedio = totalTerminados > 0 ? totalPrecios / totalTerminados : 0;
    
    const stats: CatalogStats = {
      totalProductos,
      precioPromedio,
      totalTerminados,
      disponibilidadPorEncargo: '100%'
    };
    console.log('Stats updated:', stats);
    this.stats.next(stats);
  }

  // Fallback data if API fails
  private loadFallbackData(): void {
    const fallbackProducts: ProductoCatalogoDTO[] = [
      {
        id: 1,
        nombre: 'Guía de ejemplo',
        imagen: undefined,
        terminados: [
          {
            id: 1,
            medidaTerminadoProducto: 1.5,
            precioPublico: 25000,
            precioPorMayor: 20000,
            precioPorEncargo: 30000
          }
        ]
      }
    ];
    
    this.productos.next(fallbackProducts);
    this.updateStats(fallbackProducts);
  }

  // Refresh catalog
  refreshCatalog(): void {
    this.loadCatalog();
  }


  // Format price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

}