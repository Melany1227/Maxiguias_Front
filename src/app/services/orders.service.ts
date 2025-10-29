import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DetalleOrden {
  id: number;
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
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
  fechaRegistro: Date;
}

export interface Orden {
  id: number;
  usuario: Usuario;
  fechaPedido: Date;
  fechaEntrega?: Date;
  estado: string;
  tipoVenta: string;
  total: number;
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

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private baseUrl = 'http://localhost:8080/api/ordenes';
  private ordersSubject = new BehaviorSubject<Orden[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {}

  getOrdenes(page: number = 0, size: number = 10, sortBy: string = 'fechaPedido', sortDir: string = 'desc', estado?: string, tipoVenta?: string): Observable<PageResponse<Orden>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (estado && estado.trim() !== '') {
      params = params.set('estado', estado);
    }

    if (tipoVenta && tipoVenta.trim() !== '') {
      params = params.set('tipoVenta', tipoVenta);
    }

    return this.http.get<PageResponse<Orden>>(this.baseUrl, { params }).pipe(
      map(response => ({
        ...response,
        content: response.content.map(orden => ({
          ...orden,
          fechaPedido: new Date(orden.fechaPedido),
          fechaEntrega: orden.fechaEntrega ? new Date(orden.fechaEntrega) : undefined,
          usuario: {
            ...orden.usuario,
            fechaRegistro: new Date(orden.usuario.fechaRegistro)
          }
        }))
      }))
    );
  }

  getOrdenById(id: number): Observable<Orden> {
    return this.http.get<Orden>(`${this.baseUrl}/${id}`).pipe(
      map(orden => ({
        ...orden,
        fechaPedido: new Date(orden.fechaPedido),
        fechaEntrega: orden.fechaEntrega ? new Date(orden.fechaEntrega) : undefined,
        usuario: {
          ...orden.usuario,
          fechaRegistro: new Date(orden.usuario.fechaRegistro)
        }
      }))
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
}