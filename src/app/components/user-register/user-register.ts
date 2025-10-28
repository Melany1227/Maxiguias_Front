import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, User, TipoUsuario, Perfil, Departamento, Ciudad } from '../../services/user.service';
import { LocationService } from '../../services/location.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-register',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-register.html',
  styleUrl: './user-register.css'
})
export class UserRegister implements OnInit, OnDestroy {
  
  registerForm!: FormGroup;
  userTypes: TipoUsuario[] = [];
  userProfiles: Perfil[] = [];
  departamentos: Departamento[] = [];
  ciudades: Ciudad[] = [];
  ciudadesFiltradas: Ciudad[] = [];
  mensajeModal: string = '';
  tipoMensaje: 'success' | 'error' = 'success';
  isSubmitting: boolean = false;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private locationService: LocationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  initForm() {
    this.registerForm = this.fb.group({
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
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      tipoUsuario: ['Cliente', Validators.required], // Default to Cliente for registration
      perfil: ['Básico', Validators.required], // Default to Básico for registration
      acceptTerms: [false, Validators.requiredTrue],
      departamento: ['', Validators.required],
      ciudad: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  loadData() {
    this.subscription.add(
      this.userService.userTypes$.subscribe(types => {
        // Filter to only show Cliente for public registration
        this.userTypes = types.filter(type => type.nombre === 'Cliente');
      })
    );

    this.subscription.add(
      this.userService.userProfiles$.subscribe(profiles => {
        // Filter to only show basic profiles for public registration
        this.userProfiles = profiles.filter(profile => 
          profile.nombrePerfil === 'Básico' || profile.nombrePerfil === 'Cliente'
        );
      })
    );

    // Load location data
    this.loadLocationData();
  }

  loadLocationData() {
    this.subscription.add(
      this.locationService.departamentos$.subscribe(departamentos => {
        this.departamentos = departamentos;
      })
    );

    this.subscription.add(
      this.locationService.ciudades$.subscribe(ciudades => {
        this.ciudades = ciudades;
        this.ciudadesFiltradas = [];
      })
    );
  }

  onDepartamentoChange() {
    const departamentoId = this.registerForm.get('departamento')?.value;
    console.log('Departamento seleccionado (register):', departamentoId);
    
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
      
      this.registerForm.get('ciudad')?.setValue('');
    } else {
      this.ciudadesFiltradas = [];
      this.registerForm.get('ciudad')?.setValue('');
    }
  }

  getSelectedCiudad(): Ciudad {
    const ciudadId = this.registerForm.get('ciudad')?.value;
    if (ciudadId) {
      const ciudad = this.locationService.getCiudadById(ciudadId);
      if (ciudad) {
        return ciudad;
      }
    }
    // Fallback to default city if nothing selected
    return { id: 1, nombre: 'Bogotá', departamento: { id: 1, nombre: 'Cundinamarca' } };
  }

  onSubmit() {
    if (this.registerForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      try {
        const formValue = this.registerForm.value;

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
        console.log('Selected ciudad for registration:', selectedCiudad);
        
        const userData = {
          documento: formValue.documento,
          nombre: formValue.nombre,
          primerApellido: formValue.primerApellido,
          segundoApellido: formValue.segundoApellido || '',
          direccion: formValue.direccion,
          telefono: formValue.telefono,
          correo: formValue.correo,
          nombreUsuario: formValue.usuario,
          contrasena: formValue.password,
          tipoUsuario: { id: 3, nombre: 'Cliente' },
          perfil: { id: 3, nombrePerfil: 'Básico', rol: { id: 3, nombre: 'Cliente' } },
          ciudad: selectedCiudad
        };

        this.userService.createUser(userData).subscribe({
          next: (response) => {
            console.log('Response from backend:', response);
            // Verificar si la respuesta indica un error
            if (this.userService.isErrorResponse(response)) {
              this.mensajeModal = response;
              this.tipoMensaje = 'error';
            } else {
              this.mensajeModal = response || '¡Registro exitoso! Ya puedes iniciar sesión.';
              this.tipoMensaje = 'success';
              
              // Clear form after successful registration
              this.registerForm.reset();
              
              setTimeout(() => {
                this.router.navigate(['/login']);
              }, 3000);
            }
          },
          error: (error) => {
            this.mensajeModal = this.userService.extractErrorMessage(error);
            this.tipoMensaje = 'error';
            console.error('Error completo:', error);
          }
        });

      } catch (error: any) {
        this.mensajeModal = error.message || 'Error al registrar el usuario';
        this.tipoMensaje = 'error';
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched();
      this.mensajeModal = 'Por favor, complete todos los campos requeridos correctamente';
      this.tipoMensaje = 'error';
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private logFormErrors() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control && control.errors) {
        console.log(`Campo ${key} tiene errores:`, control.errors);
      }
    });
    
    // Check for form-level errors (like password mismatch)
    if (this.registerForm.errors) {
      console.log('Form-level errors:', this.registerForm.errors);
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (control.errors['email']) return 'Correo inválido';
      if (control.errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      if (control.errors['maxlength']) return `${this.getFieldLabel(fieldName)} no puede tener más de ${control.errors['maxlength'].requiredLength} caracteres`;
      if (control.errors['pattern']) {
        if (fieldName === 'documento') return 'El documento debe contener solo números';
        if (fieldName === 'telefono') return 'Formato de teléfono inválido';
      }
      if (control.errors['requiredTrue']) return 'Debe aceptar los términos y condiciones';
    }
    
    // Check for password mismatch
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }
    
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      documento: 'Documento',
      nombre: 'Nombre',
      primerApellido: 'Primer apellido',
      segundoApellido: 'Segundo apellido',
      direccion: 'Dirección',
      telefono: 'Teléfono',
      correo: 'Correo',
      usuario: 'Usuario',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      acceptTerms: 'Términos y condiciones',
      departamento: 'Departamento',
      ciudad: 'Ciudad'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    const hasError = !!(control && control.errors && control.touched);
    
    // Special case for confirmPassword with password mismatch
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch']) {
      return true;
    }
    
    return hasError;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value;
    if (!password) return '';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch (strength) {
      case 0:
      case 1: return 'Muy débil';
      case 2: return 'Débil';
      case 3: return 'Regular';
      case 4: return 'Fuerte';
      case 5: return 'Muy fuerte';
      default: return '';
    }
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'Muy débil': return 'strength-very-weak';
      case 'Débil': return 'strength-weak';
      case 'Regular': return 'strength-fair';
      case 'Fuerte': return 'strength-strong';
      case 'Muy fuerte': return 'strength-very-strong';
      default: return '';
    }
  }
}