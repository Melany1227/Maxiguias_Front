import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Terminado {
  id: number;
  medidaTerminadoProducto: number;
  precioPublico: number;
  precioPorMayor: number;
  precioPorEncargo: number;
  gananciaXMayor?: number;
  gananciaXEncargo?: number;
  producto: {
    id: number;
    nombre: string;
    imagen?: string;
    cantidadDisponible: number;
  };
}

export interface DetalleOrden {
  terminado: Terminado;
  descripcion: string;
  cantidad: number;
  valor: number;
}

export interface Usuario {
  documento: number;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  direccion: string;
  telefono: number;
  nombreUsuario: string;
  contrasena: string;
  fechaRegistro?: Date;
  tipoUsuario?: {
    id: number;
    nombre: string;
  };
}

export interface CrearOrdenRequest {
  orden: {
    usuario: Usuario;
    fechaEntrega: Date;
    descripcionVenta: string;
    totalFactura: number;
  };
  terminadosId: number[];
  cantidades: number[];
  valores: number[];
  descripciones: string[];
}

export interface OrdenBackend {
  id: number;
  usuario: Usuario;
  fechaOrden: string;
  fechaEntrega?: string;
  estado: string;
  descripcionVenta?: string;
  totalFactura?: number;
  total?: number;
  notas?: string;
  detalles: DetalleOrden[];
}

export interface Orden {
  id: number;
  usuario: Usuario;
  fechaPedido: Date;
  fechaEntrega?: Date;
  estado: string;
  totalFactura?: number;
  total?: number; // Para compatibilidad
  notas?: string;
  detalles: DetalleOrden[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface OrdenDetalleResponse {
  orden: OrdenBackend;
  detalles: DetalleOrden[];
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private baseUrl = 'http://localhost:8080/api/ordenes';
  private ordersSubject = new BehaviorSubject<Orden[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {}

  getOrdenes(page: number = 0, size: number = 10, sortBy: string = 'fechaOrden', sortDir: string = 'desc', estado?: string): Observable<PageResponse<Orden>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (estado && estado.trim() !== '') {
      params = params.set('estado', estado);
    }

    return this.http.get<PageResponse<OrdenBackend>>(this.baseUrl, { params }).pipe(
      map(response => ({
        ...response,
        content: response.content.map(orden => ({
          ...orden,
          total: orden.totalFactura || orden.total || 0,
          fechaPedido: new Date(orden.fechaOrden),
          fechaEntrega: orden.fechaEntrega ? new Date(orden.fechaEntrega) : undefined,
          usuario: {
            ...orden.usuario,
            fechaRegistro: orden.usuario.fechaRegistro ? new Date(orden.usuario.fechaRegistro) : undefined
          }
        }))
      }))
    );
  }

  getOrdenById(id: number): Observable<Orden> {
    return this.http.get<OrdenDetalleResponse>(`${this.baseUrl}/${id}`).pipe(
      map(response => {
        const orden = response.orden;
        const detalles = response.detalles || orden.detalles || [];
        
        return {
          ...orden,
          detalles,
          total: orden.totalFactura || orden.total || 0,
          fechaPedido: new Date(orden.fechaOrden),
          fechaEntrega: orden.fechaEntrega ? new Date(orden.fechaEntrega) : undefined,
          usuario: {
            ...orden.usuario,
            fechaRegistro: orden.usuario.fechaRegistro ? new Date(orden.usuario.fechaRegistro) : undefined
          }
        };
      })
    );
  }

  loadOrdenesAndUpdate(page: number = 0, size: number = 100): void {
    this.getOrdenes(page, size).subscribe({
      next: (response) => {
        this.ordersSubject.next(response.content);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.ordersSubject.next([]);
      }
    });
  }

  refreshOrders(): void {
    this.loadOrdenesAndUpdate();
  }

  buscarUsuarios(termino: string): Observable<Usuario[]> {
    const params = new HttpParams().set('termino', termino);
    return this.http.get<Usuario[]>(`${this.baseUrl}/buscar-usuarios`, { params });
  }

  crearOrden(request: CrearOrdenRequest): Observable<string> {
    return this.http.post(this.baseUrl, request, {
      responseType: 'text'
    });
  }
}