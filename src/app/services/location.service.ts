import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Departamento, Ciudad } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private baseUrl = 'http://localhost:8080/api';
  private departamentos = new BehaviorSubject<Departamento[]>([]);
  private ciudades = new BehaviorSubject<Ciudad[]>([]);

  departamentos$ = this.departamentos.asObservable();
  ciudades$ = this.ciudades.asObservable();

  constructor(private http: HttpClient) {
    this.loadLocationData();
  }

  // Load location data using the existing endpoints
  loadLocationData(): void {
    // Load departments
    this.http.get<Departamento[]>(`${this.baseUrl}/departamentos`).subscribe({
      next: (departamentos) => {
        console.log('Departamentos loaded from API:', departamentos);
        this.departamentos.next(departamentos);
      },
      error: (error) => {
        console.error('Error loading departamentos from API:', error);
        this.loadFallbackDepartamentos();
      }
    });

    // Load cities
    this.http.get<Ciudad[]>(`${this.baseUrl}/ciudades`).subscribe({
      next: (ciudades) => {
        console.log('Ciudades loaded from API:', ciudades);
        this.ciudades.next(ciudades);
      },
      error: (error) => {
        console.error('Error loading ciudades from API:', error);
        this.loadFallbackCiudades();
      }
    });
  }

  // API Operations
  loadDepartamentosFromAPI(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(`${this.baseUrl}/departamentos`);
  }

  loadCiudadesFromAPI(): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(`${this.baseUrl}/ciudades`);
  }

  loadCiudadesByDepartamentoFromAPI(departamentoId: number): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(`${this.baseUrl}/ciudades?departamentoId=${departamentoId}`);
  }

  // Local operations
  getAllDepartamentos(): Departamento[] {
    return this.departamentos.value;
  }

  getAllCiudades(): Ciudad[] {
    return this.ciudades.value;
  }

  getCiudadesByDepartamento(departamentoId: number): Observable<Ciudad[]> {
    return this.loadCiudadesByDepartamentoFromAPI(departamentoId);
  }

  getCiudadesByDepartamentoLocal(departamentoId: number): Ciudad[] {
    return this.ciudades.value.filter(ciudad => ciudad.departamento.id === departamentoId);
  }

  getDepartamentoById(id: number): Departamento | undefined {
    return this.departamentos.value.find(dept => dept.id === id);
  }

  getCiudadById(id: number): Ciudad | undefined {
    return this.ciudades.value.find(ciudad => ciudad.id === id);
  }

  getDepartamentoByCiudadId(ciudadId: number): Departamento | undefined {
    const ciudad = this.getCiudadById(ciudadId);
    return ciudad?.departamento;
  }

  // Fallback methods for when API fails
  private loadFallbackDepartamentos(): void {
    const defaultDepartamentos: Departamento[] = [
      { id: 1, nombre: 'Cundinamarca' },
      { id: 2, nombre: 'Antioquia' },
      { id: 3, nombre: 'Valle del Cauca' },
      { id: 4, nombre: 'Atlántico' },
      { id: 5, nombre: 'Bolívar' },
      { id: 6, nombre: 'Santander' },
      { id: 7, nombre: 'Norte de Santander' },
      { id: 8, nombre: 'Tolima' },
      { id: 9, nombre: 'Huila' },
      { id: 10, nombre: 'Boyacá' }
    ];
    this.departamentos.next(defaultDepartamentos);
  }

  private loadFallbackCiudades(): void {
    const defaultCiudades: Ciudad[] = [
      // Cundinamarca
      { id: 1, nombre: 'Bogotá', departamento: { id: 1, nombre: 'Cundinamarca' } },
      { id: 2, nombre: 'Soacha', departamento: { id: 1, nombre: 'Cundinamarca' } },
      { id: 3, nombre: 'Zipaquirá', departamento: { id: 1, nombre: 'Cundinamarca' } },
      { id: 4, nombre: 'Chía', departamento: { id: 1, nombre: 'Cundinamarca' } },
      
      // Antioquia
      { id: 5, nombre: 'Medellín', departamento: { id: 2, nombre: 'Antioquia' } },
      { id: 6, nombre: 'Bello', departamento: { id: 2, nombre: 'Antioquia' } },
      { id: 7, nombre: 'Itagüí', departamento: { id: 2, nombre: 'Antioquia' } },
      { id: 8, nombre: 'Envigado', departamento: { id: 2, nombre: 'Antioquia' } },
      
      // Valle del Cauca
      { id: 9, nombre: 'Cali', departamento: { id: 3, nombre: 'Valle del Cauca' } },
      { id: 10, nombre: 'Palmira', departamento: { id: 3, nombre: 'Valle del Cauca' } },
      { id: 11, nombre: 'Buenaventura', departamento: { id: 3, nombre: 'Valle del Cauca' } },
      { id: 12, nombre: 'Tulua', departamento: { id: 3, nombre: 'Valle del Cauca' } },
      
      // Atlántico
      { id: 13, nombre: 'Barranquilla', departamento: { id: 4, nombre: 'Atlántico' } },
      { id: 14, nombre: 'Soledad', departamento: { id: 4, nombre: 'Atlántico' } },
      { id: 15, nombre: 'Malambo', departamento: { id: 4, nombre: 'Atlántico' } },
      { id: 16, nombre: 'Sabanagrande', departamento: { id: 4, nombre: 'Atlántico' } },
      
      // Bolívar
      { id: 17, nombre: 'Cartagena', departamento: { id: 5, nombre: 'Bolívar' } },
      { id: 18, nombre: 'Magangué', departamento: { id: 5, nombre: 'Bolívar' } },
      { id: 19, nombre: 'Turbaco', departamento: { id: 5, nombre: 'Bolívar' } },
      
      // Santander
      { id: 20, nombre: 'Bucaramanga', departamento: { id: 6, nombre: 'Santander' } },
      { id: 21, nombre: 'Floridablanca', departamento: { id: 6, nombre: 'Santander' } },
      { id: 22, nombre: 'Girón', departamento: { id: 6, nombre: 'Santander' } },
      { id: 23, nombre: 'Piedecuesta', departamento: { id: 6, nombre: 'Santander' } },
      
      // Norte de Santander
      { id: 24, nombre: 'Cúcuta', departamento: { id: 7, nombre: 'Norte de Santander' } },
      { id: 25, nombre: 'Ocaña', departamento: { id: 7, nombre: 'Norte de Santander' } },
      { id: 26, nombre: 'Villa del Rosario', departamento: { id: 7, nombre: 'Norte de Santander' } },
      
      // Tolima
      { id: 27, nombre: 'Ibagué', departamento: { id: 8, nombre: 'Tolima' } },
      { id: 28, nombre: 'Espinal', departamento: { id: 8, nombre: 'Tolima' } },
      { id: 29, nombre: 'Melgar', departamento: { id: 8, nombre: 'Tolima' } },
      
      // Huila
      { id: 30, nombre: 'Neiva', departamento: { id: 9, nombre: 'Huila' } },
      { id: 31, nombre: 'Pitalito', departamento: { id: 9, nombre: 'Huila' } },
      { id: 32, nombre: 'Garzón', departamento: { id: 9, nombre: 'Huila' } },
      
      // Boyacá
      { id: 33, nombre: 'Tunja', departamento: { id: 10, nombre: 'Boyacá' } },
      { id: 34, nombre: 'Duitama', departamento: { id: 10, nombre: 'Boyacá' } },
      { id: 35, nombre: 'Sogamoso', departamento: { id: 10, nombre: 'Boyacá' } }
    ];
    this.ciudades.next(defaultCiudades);
  }
}