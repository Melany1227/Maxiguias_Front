import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, ProductoBackend, ProductoCreateRequest, ProductoUpdateRequest, TerminadoCreateRequest } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductForm implements OnInit {
  isEditMode = false;
  productId?: number;
  isLoading = false;
  isSaving = false;
  
  producto = {
    id: 0,
    nombre: '',
    cantidadDisponible: 0
  };

  terminados: TerminadoCreateRequest[] = [];

  errors: { [key: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit() {
    // Check if we're in edit mode
    this.productId = +this.route.snapshot.params['id'];
    if (this.productId) {
      this.isEditMode = true;
      this.loadProducto();
    } else {
      // Initialize with one empty terminado for new products
      this.addTerminado();
    }
  }

  loadProducto() {
    if (this.productId) {
      this.isLoading = true;
      this.productService.getProductoById(this.productId).subscribe({
        next: (producto) => {
          console.log('Producto loaded:', producto);
          this.producto = {
            id: producto.id,
            nombre: producto.nombre,
            cantidadDisponible: producto.cantidadDisponible || 0
          };
          // Load existing terminados for editing
          this.terminados = producto.terminados.map(t => ({
            medidaTerminadoProducto: t.medidaTerminadoProducto,
            precioPublico: t.precioPublico,
            precioPorMayor: t.precioPorMayor,
            precioPorEncargo: t.precioPorEncargo,
            gananciaXMayor: t.gananciaXMayor,
            gananciaXEncargo: t.gananciaXEncargo
          }));
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

  onSubmit() {
    if (this.validateForm() && !this.isSaving) {
      this.isSaving = true;
      
      if (this.isEditMode && this.productId) {
        // Update existing producto
        const updateRequest: ProductoUpdateRequest = {
          id: this.producto.id,
          nombre: this.producto.nombre,
          cantidadDisponible: this.producto.cantidadDisponible,
          terminados: this.terminados
        };
        
        this.productService.updateProducto(this.productId, updateRequest).subscribe({
          next: (response) => {
            console.log('Update response:', response);
            alert(response || 'Guía actualizada exitosamente');
            this.router.navigate(['/productos-admin']);
          },
          error: (error) => {
            console.error('Error updating producto:', error);
            alert('Error al actualizar la guía: ' + (error.error || error.message));
            this.isSaving = false;
          }
        });
      } else {
        // Create new producto
        const createRequest: ProductoCreateRequest = {
          id: this.producto.id,
          nombre: this.producto.nombre,
          cantidadDisponible: this.producto.cantidadDisponible,
          terminados: this.terminados
        };
        
        console.log('Creating product with data:', createRequest);
        
        this.productService.createProducto(createRequest).subscribe({
          next: (response) => {
            console.log('Create response:', response);
            alert(response || 'Guía creada exitosamente');
            this.router.navigate(['/productos-admin']);
          },
          error: (error) => {
            console.error('Error creating producto:', error);
            alert('Error al crear la guía: ' + (error.error || error.message));
            this.isSaving = false;
          }
        });
      }
    }
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    // Required fields
    if (!this.isEditMode && (!this.producto.id || this.producto.id <= 0)) {
      this.errors['id'] = 'El ID del producto es requerido y debe ser mayor a 0';
      isValid = false;
    }

    if (!this.producto.nombre.trim()) {
      this.errors['nombre'] = 'El nombre es requerido';
      isValid = false;
    }

    if (this.producto.nombre.trim().length < 3) {
      this.errors['nombre'] = 'El nombre debe tener al menos 3 caracteres';
      isValid = false;
    }

    // Since we ignore stock, we'll allow any value but default to 0
    if (this.producto.cantidadDisponible < 0) {
      this.errors['cantidadDisponible'] = 'La cantidad no puede ser negativa';
      isValid = false;
    }

    // Validate terminados
    if (this.terminados.length === 0) {
      this.errors['terminados'] = 'Debe agregar al menos una medida terminada';
      isValid = false;
    }

    // Validate each terminado
    this.terminados.forEach((terminado, index) => {
      if (!terminado.medidaTerminadoProducto || terminado.medidaTerminadoProducto <= 0) {
        this.errors[`terminado_${index}_medida`] = 'La medida debe ser mayor a 0';
        isValid = false;
      }

      if (!terminado.precioPublico || terminado.precioPublico <= 0) {
        this.errors[`terminado_${index}_precioPublico`] = 'El precio público debe ser mayor a 0';
        isValid = false;
      }

      if (!terminado.precioPorMayor || terminado.precioPorMayor <= 0) {
        this.errors[`terminado_${index}_precioPorMayor`] = 'El precio por mayor debe ser mayor a 0';
        isValid = false;
      }

      if (!terminado.precioPorEncargo || terminado.precioPorEncargo <= 0) {
        this.errors[`terminado_${index}_precioPorEncargo`] = 'El precio por encargo debe ser mayor a 0';
        isValid = false;
      }

      // Check for duplicate measures
      const duplicates = this.terminados.filter(t => t.medidaTerminadoProducto === terminado.medidaTerminadoProducto);
      if (duplicates.length > 1) {
        this.errors[`terminado_${index}_medida`] = 'Ya existe otra medida con este valor';
        isValid = false;
      }
    });

    return isValid;
  }

  onCancel() {
    this.router.navigate(['/productos-admin']);
  }

  getTitle(): string {
    return this.isEditMode ? 'Editar Guía' : 'Nueva Guía';
  }

  getSubmitText(): string {
    if (this.isSaving) {
      return this.isEditMode ? 'Actualizando...' : 'Creando...';
    }
    return this.isEditMode ? 'Actualizar Guía' : 'Crear Guía';
  }

  // Terminados management methods
  addTerminado() {
    this.terminados.push({
      medidaTerminadoProducto: 0,
      precioPublico: 0,
      precioPorMayor: 0,
      precioPorEncargo: 0,
      gananciaXMayor: 0,
      gananciaXEncargo: 0
    });
  }

  removeTerminado(index: number) {
    if (this.terminados.length > 1) {
      this.terminados.splice(index, 1);
    }
  }

  formatPrice(price: number): string {
    return this.productService.formatPrice(price);
  }

  onTerminadoChange(index: number, field: keyof TerminadoCreateRequest, value: any) {
    if (this.terminados[index]) {
      (this.terminados[index] as any)[field] = value;
      // Clear any existing error for this field
      delete this.errors[`terminado_${index}_${field}`];
    }
  }

  calculateGanancia(precio: number, costo: number): number {
    if (costo === 0) return 0;
    return Math.round(((precio - costo) / costo) * 100);
  }
}