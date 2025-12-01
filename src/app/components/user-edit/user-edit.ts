import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, User, TipoUsuario, Perfil, Departamento, Ciudad } from '../../services/user.service';
import { LocationService } from '../../services/location.service';
import { AlertService } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-edit',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.css'
})
export class UserEdit implements OnInit, OnDestroy {
  
  userForm!: FormGroup;
  userTypes: TipoUsuario[] = [];
  userProfiles: Perfil[] = [];
  departamentos: Departamento[] = [];
  ciudades: Ciudad[] = [];
  ciudadesFiltradas: Ciudad[] = [];
  isSubmitting: boolean = false;
  isLoading: boolean = true;
  
  currentUser: User | null = null;
  userId: number = 0;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadData();
    this.loadUser();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  initForm() {
    this.userForm = this.fb.group({
      documento: ['', [
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(15),
        Validators.pattern(/^[0-9]+$/)
      ]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      primerApellido: [''],
      segundoApellido: [''],
      direccion: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9\-\+\s\(\)]{10,}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: [''], // No required for editing
      tipoUsuario: ['', Validators.required],
      perfil: ['', Validators.required],
      departamento: [''], // Hacer opcional temporalmente
      ciudad: [''] // Hacer opcional temporalmente
    });
  }

  loadData() {
    // Cargar datos del formulario desde la API
    this.userService.getFormularioData().subscribe({
      next: (data) => {
        console.log('Form data loaded from API:', data);
        this.userTypes = data.tiposUsuario || [];
        this.userProfiles = data.perfiles || [];
      },
      error: (error) => {
        console.error('Error loading form data:', error);
        // Fallback a los datos del servicio si la API falla
        this.subscription.add(
          this.userService.userTypes$.subscribe(types => {
            this.userTypes = types;
          })
        );

        this.subscription.add(
          this.userService.userProfiles$.subscribe(profiles => {
            this.userProfiles = profiles;
          })
        );
      }
    });

    // Load location data always
    this.loadLocationData();
  }

  loadLocationData() {
    this.subscription.add(
      this.locationService.departamentos$.subscribe(departamentos => {
        this.departamentos = departamentos;
        // If we have user data and location data, populate the form
        if (this.currentUser && departamentos.length > 0) {
          this.populateLocationFields();
        }
      })
    );

    this.subscription.add(
      this.locationService.ciudades$.subscribe(ciudades => {
        this.ciudades = ciudades;
        // If we have user data and location data, populate the form
        if (this.currentUser && ciudades.length > 0 && this.departamentos.length > 0) {
          this.populateLocationFields();
        }
      })
    );
  }

  populateLocationFields() {
    if (this.currentUser?.ciudad?.id && this.ciudades.length > 0) {
      const departamento = this.locationService.getDepartamentoByCiudadId(this.currentUser.ciudad.id);
      console.log('Found department for city:', departamento);
      console.log('Current user city ID:', this.currentUser.ciudad.id);
      
      if (departamento) {
        // First set the department
        this.userForm.patchValue({
          departamento: departamento.id
        });
        
        // Load cities for this department
        this.subscription.add(
          this.locationService.getCiudadesByDepartamento(departamento.id).subscribe({
            next: (ciudades) => {
              console.log('Cities loaded for department:', ciudades);
              this.ciudadesFiltradas = ciudades;
              
              // Verify the city exists in the loaded cities
              const cityExists = ciudades.find(c => c.id === this.currentUser?.ciudad?.id);
              console.log('City exists in loaded cities:', cityExists);
              console.log('All city IDs:', ciudades.map(c => c.id));
              console.log('Looking for city ID:', this.currentUser?.ciudad?.id);
              console.log('City ID type:', typeof this.currentUser?.ciudad?.id);
              
              // Now set the city after cities are loaded
              console.log('Setting city value to:', this.currentUser?.ciudad?.id);
              this.userForm.patchValue({
                ciudad: this.currentUser?.ciudad?.id
              });
              
              // Force change detection
              this.userForm.get('ciudad')?.updateValueAndValidity();
              
              // Log final form values
              console.log('Final form values:', this.userForm.value);
            },
            error: (error) => {
              console.error('Error loading cities for department:', error);
              this.ciudadesFiltradas = this.locationService.getCiudadesByDepartamentoLocal(departamento.id);
              
              // Set city even with fallback data
              console.log('Setting city value (fallback) to:', this.currentUser?.ciudad?.id);
              this.userForm.patchValue({
                ciudad: this.currentUser?.ciudad?.id
              });
              
              // Force change detection
              this.userForm.get('ciudad')?.updateValueAndValidity();
            }
          })
        );
      }
    }
  }

  onDepartamentoChange() {
    const departamentoId = this.userForm.get('departamento')?.value;
    console.log('Departamento seleccionado (edit):', departamentoId);
    
    if (departamentoId) {
      // Convert to number if it's a string
      const deptId = typeof departamentoId === 'string' ? parseInt(departamentoId) : departamentoId;
      
      // Load cities from API based on selected department
      this.subscription.add(
        this.locationService.getCiudadesByDepartamento(deptId).subscribe({
          next: (ciudades) => {
            console.log('Ciudades cargadas para departamento', deptId, ':', ciudades);
            this.ciudadesFiltradas = ciudades;
          },
          error: (error) => {
            console.error('Error loading cities for department:', error);
            // Fallback to local filter
            this.ciudadesFiltradas = this.locationService.getCiudadesByDepartamentoLocal(deptId);
          }
        })
      );
      
      this.userForm.get('ciudad')?.setValue('');
    } else {
      this.ciudadesFiltradas = [];
      this.userForm.get('ciudad')?.setValue('');
    }
  }

  getSelectedCiudad(): Ciudad {
    const ciudadId = this.userForm.get('ciudad')?.value;
    console.log('getSelectedCiudad - Form ciudad value:', ciudadId);
    console.log('getSelectedCiudad - Type of ciudad value:', typeof ciudadId);
    
    if (ciudadId) {
      // Convert to number if it's a string
      const cityId = typeof ciudadId === 'string' ? parseInt(ciudadId) : ciudadId;
      console.log('getSelectedCiudad - Converted cityId:', cityId);
      
      // Try to find in filtered cities first (more accurate)
      let ciudad = this.ciudadesFiltradas.find(c => c.id === cityId);
      console.log('getSelectedCiudad - Found in filtered cities:', ciudad);
      
      // If not found in filtered, try all cities
      if (!ciudad) {
        ciudad = this.locationService.getCiudadById(cityId);
        console.log('getSelectedCiudad - Found in all cities:', ciudad);
      }
      
      if (ciudad) {
        return ciudad;
      }
    }
    
    // Fallback: Return current user's city only if no form value
    console.log('getSelectedCiudad - Using fallback to current user city');
    if (this.currentUser?.ciudad) {
      return this.currentUser.ciudad;
    }
    
    // Final fallback to default city
    console.log('getSelectedCiudad - Using final fallback');
    return { id: 1, nombre: 'Bogotá', departamento: { id: 1, nombre: 'Cundinamarca' } };
  }

  loadUser() {
    this.subscription.add(
      this.route.params.subscribe(params => {
        this.userId = +params['id'];
        if (this.userId) {
          this.userService.getUserById(this.userId).subscribe({
          next: (user) => {
            this.currentUser = user;
            this.populateForm();
            // If location data is already loaded, populate location fields
            if (this.departamentos.length > 0 && this.ciudades.length > 0) {
              this.populateLocationFields();
            }
            this.isLoading = false;
          },
          error: (error) => {
            this.alertService.showError('Usuario no encontrado', 'Error');
            this.isLoading = false;
            console.error('Error:', error);
          }
        });
        }
      })
    );
  }

  populateForm() {
    if (this.currentUser) {
      console.log('Current user data:', this.currentUser);
      console.log('Current user ciudad:', this.currentUser.ciudad);
      
      // Populate basic fields (location fields handled separately)
      this.userForm.patchValue({
        documento: this.currentUser.documento,
        nombre: this.currentUser.nombre,
        primerApellido: this.currentUser.primerApellido,
        segundoApellido: this.currentUser.segundoApellido,
        direccion: this.currentUser.direccion,
        telefono: this.currentUser.telefono,
        correo: this.currentUser.correo,
        usuario: this.currentUser.nombreUsuario,
        tipoUsuario: this.currentUser.tipoUsuario.nombre,
        perfil: this.currentUser.perfil.nombrePerfil
      });
      
      // Location fields will be populated by populateLocationFields when data is ready
      if (this.departamentos.length > 0 && this.ciudades.length > 0) {
        this.populateLocationFields();
      }
    }
  }

  onSubmit() {
    // Validación más flexible - permitir editar incluso con algunos errores menores
    const hasRequiredFields = this.userForm.get('documento')?.valid && 
                             this.userForm.get('nombre')?.valid && 
                             this.userForm.get('correo')?.valid &&
                             this.userForm.get('tipoUsuario')?.valid &&
                             this.userForm.get('perfil')?.valid;
    
    if (hasRequiredFields && !this.isSubmitting && this.currentUser) {
      this.isSubmitting = true;
      
      try {
        const formValue = this.userForm.value;
        
        // Buscar el tipo de usuario y perfil seleccionados
        const selectedTipoUsuario = this.userTypes.find(tipo => tipo.nombre === formValue.tipoUsuario);
        const selectedPerfil = this.userProfiles.find(perfil => perfil.nombrePerfil === formValue.perfil);
        
        if (!selectedTipoUsuario) {
          throw new Error('Tipo de usuario no válido');
        }
        
        if (!selectedPerfil) {
          throw new Error('Perfil no válido');
        }

        // Validate department and city selection
        const departamentoId = formValue.departamento;
        const ciudadId = formValue.ciudad;
        
        if (!departamentoId) {
          throw new Error('Debe seleccionar un departamento');
        }
        
        if (!ciudadId) {
          throw new Error('Debe seleccionar una ciudad');
        }
        
        const selectedCiudad = this.getSelectedCiudad();
        console.log('Selected ciudad for update:', selectedCiudad);
        console.log('Form departamento value:', formValue.departamento);
        console.log('Form ciudad value:', formValue.ciudad);
        
        const userData: Partial<User> = {
          documento: formValue.documento,
          nombre: formValue.nombre,
          primerApellido: formValue.primerApellido,
          segundoApellido: formValue.segundoApellido || '',
          direccion: formValue.direccion,
          telefono: formValue.telefono,
          correo: formValue.correo,
          nombreUsuario: formValue.usuario,
          tipoUsuario: selectedTipoUsuario,
          perfil: selectedPerfil,
          ciudad: selectedCiudad
        };

        // Only include password if it was provided
        if (formValue.password && formValue.password.trim()) {
          (userData as any).contrasena = formValue.password;
        }

        this.userService.updateUser(this.userId, userData).subscribe({
          next: (response) => {
            console.log('Response from backend:', response);
            // Verificar si la respuesta indica un error
            if (this.userService.isErrorResponse(response)) {
              this.alertService.showError(response, 'Error');
            } else {
              this.alertService.showSuccess(response || 'Usuario actualizado exitosamente', 'Éxito');
              
              setTimeout(() => {
                this.router.navigate(['/usuarios-admin']);
              }, 2000);
            }
          },
          error: (error) => {
            this.alertService.showError(this.userService.extractErrorMessage(error), 'Error');
            console.error('Error completo:', error);
          }
        });

      } catch (error: any) {
        this.alertService.showError(error.message || 'Error al actualizar el usuario', 'Error');
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched();
      this.alertService.showError('Por favor, complete todos los campos requeridos correctamente', 'Error de validación');
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          documento: 'Documento',
          nombre: 'Nombre',
          direccion: 'Dirección',
          telefono: 'Teléfono',
          correo: 'Correo',
          usuario: 'Usuario',
          password: 'Contraseña',
          tipoUsuario: 'Tipo de usuario',
          perfil: 'Perfil',
          departamento: 'Departamento',
          ciudad: 'Ciudad'
        };
        return `${fieldLabels[fieldName] || fieldName} es requerido`;
      }
      if (control.errors['email']) return 'Correo inválido';
      if (control.errors['minlength']) return `${fieldName} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      if (control.errors['maxlength']) return `${fieldName} no puede tener más de ${control.errors['maxlength'].requiredLength} caracteres`;
      if (control.errors['pattern']) {
        if (fieldName === 'documento') return 'El documento debe contener solo números';
        if (fieldName === 'telefono') return 'Formato de teléfono inválido';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.userForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  cancelar() {
    this.router.navigate(['/usuarios-admin']);
  }

  getFullName(): string {
    if (this.currentUser) {
      return `${this.currentUser.nombre} ${this.currentUser.primerApellido} ${this.currentUser.segundoApellido}`.trim();
    }
    return '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}