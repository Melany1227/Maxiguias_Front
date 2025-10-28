import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Terminado {
  id?: number;
  medidaTerminadoProducto: number;
  precioPublico: number;
  precioPorMayor: number;
  precioPorEncargo: number;
  gananciaXMayor?: number;
  gananciaXEncargo?: number;
}

export interface ProductoBackend {
  id: number;
  nombre: string;
  imagen?: string;
  cantidadDisponible?: number;
  terminados: Terminado[];
}

export interface TerminadoCreateRequest {
  id?: number;  // Optional for new terminados
  medidaTerminadoProducto: number;
  precioPublico: number;
  precioPorMayor: number;
  precioPorEncargo: number;
  gananciaXMayor?: number;
  gananciaXEncargo?: number;
}

export interface ProductoCreateRequest {
  id: number;  // Required for creation
  nombre: string;
  cantidadDisponible?: number;
  imagen?: string;
  terminados: TerminadoCreateRequest[];
}

export interface ProductoUpdateRequest {
  id: number;  // Required for update
  nombre: string;
  cantidadDisponible?: number;
  imagen?: string;
  terminados?: TerminadoCreateRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = 'http://localhost:8080/api/productos';
  private productos = new BehaviorSubject<ProductoBackend[]>([]);
  
  productos$ = this.productos.asObservable();

  constructor(private http: HttpClient) {
    this.loadProductosFromAPI();
  }

  // API Methods
  loadProductos(keyword?: string): Observable<ProductoBackend[]> {
    const url = keyword ? `${this.baseUrl}?keyword=${encodeURIComponent(keyword)}` : this.baseUrl;
    return this.http.get<ProductoBackend[]>(url);
  }

  getProductoById(id: number): Observable<ProductoBackend> {
    return this.http.get<ProductoBackend>(`${this.baseUrl}/${id}`);
  }

  createProducto(producto: ProductoCreateRequest): Observable<string> {
    // Now the backend expects @RequestBody, so send JSON
    const payload = {
      id: producto.id,
      nombre: producto.nombre,
      cantidadDisponible: producto.cantidadDisponible || 0,
      imagen: 'assets/images/GuiaR.png',
      terminados: producto.terminados || []
    };
    
    console.log('=== ENVIANDO AL BACKEND ===');
    console.log('ID:', payload.id);
    console.log('Nombre:', payload.nombre);
    console.log('Terminados:', payload.terminados.length);
    console.log('Payload completo:', payload);
    
    return this.http.post(this.baseUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'text'  // Backend returns plain text, not JSON
    });
  }

  updateProducto(id: number, producto: ProductoUpdateRequest): Observable<string> {
    // Send as JSON to match backend @RequestBody
    const payload = {
      id: id,
      nombre: producto.nombre,
      cantidadDisponible: producto.cantidadDisponible || 0,
      imagen: 'assets/images/GuiaR.png',
      terminados: producto.terminados || []
    };
    
    console.log('=== ACTUALIZANDO PRODUCTO ===');
    console.log('ID:', payload.id);
    console.log('Payload completo:', payload);
    
    return this.http.put(`${this.baseUrl}/${id}`, payload, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'text'  // Backend returns plain text, not JSON
    });
  }

  deleteProducto(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      responseType: 'text'  // Backend returns plain text, not JSON
    });
  }

  // Local state management
  loadProductosFromAPI(keyword?: string): void {
    this.loadProductos(keyword).subscribe({
      next: (productos) => {
        console.log('Productos loaded from API:', productos);
        this.productos.next(productos);
      },
      error: (error) => {
        console.error('Error loading productos from API:', error);
        this.loadFallbackData();
      }
    });
  }

  refreshProductos(): void {
    this.loadProductosFromAPI();
  }

  // Search and filter (local)
  searchProductos(term: string): ProductoBackend[] {
    if (!term) return this.productos.value;
    
    const searchTerm = term.toLowerCase();
    return this.productos.value.filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm) ||
      producto.id.toString().includes(searchTerm)
    );
  }

  // Get current productos
  getAllProductos(): ProductoBackend[] {
    return this.productos.value;
  }

  getProductoByIdLocal(id: number): ProductoBackend | undefined {
    return this.productos.value.find(producto => producto.id === id);
  }

  // Fallback data if API fails
  private loadFallbackData(): void {
    const fallbackProductos: ProductoBackend[] = [
      {
        id: 1,
        nombre: 'Guía de Costura Básica',
        imagen: 'assets/images/GuiaR.png',
        cantidadDisponible: 0, // Not used since work by order
        terminados: [
          {
            id: 1,
            medidaTerminadoProducto: 1.0,
            precioPublico: 15000,
            precioPorMayor: 12000,
            precioPorEncargo: 18000
          },
          {
            id: 2,
            medidaTerminadoProducto: 1.5,
            precioPublico: 22000,
            precioPorMayor: 18000,
            precioPorEncargo: 25000
          }
        ]
      },
      {
        id: 2,
        nombre: 'Guía de Bordado Avanzado',
        imagen: 'assets/images/GuiaR.png',
        cantidadDisponible: 0,
        terminados: [
          {
            id: 3,
            medidaTerminadoProducto: 2.0,
            precioPublico: 35000,
            precioPorMayor: 28000,
            precioPorEncargo: 40000
          }
        ]
      }
    ];
    
    this.productos.next(fallbackProductos);
  }

  // Helper methods
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  // For compatibility with existing cart service
  convertToCartProduct(producto: ProductoBackend, terminado?: any): any {
    const selectedTerminado = terminado || (producto.terminados.length > 0 ? producto.terminados[0] : null);
    
    if (!selectedTerminado) {
      throw new Error('Producto sin terminados disponibles');
    }

    return {
      id: producto.id,
      name: producto.nombre,
      description: `${producto.nombre} - ${selectedTerminado.medidaTerminadoProducto}m`,
      retailPrice: selectedTerminado.precioPublico,
      wholesalePrice: selectedTerminado.precioPorMayor,
      customOrderPrice: selectedTerminado.precioPorEncargo,
      stock: 999, // High stock since it's made to order
      category: 'Guía',
      image: 'assets/images/GuiaR.png'
    };
  }
}