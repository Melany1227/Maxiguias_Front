import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, User, TipoUsuario, Perfil } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-create',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css'
})
export class UserCreate implements OnInit, OnDestroy {
  
  userForm!: FormGroup;
  userTypes: TipoUsuario[] = [];
  userProfiles: Perfil[] = [];
  mensajeModal: string = '';
  tipoMensaje: 'success' | 'error' = 'success';
  isSubmitting: boolean = false;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
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
      password: ['', [Validators.required, Validators.minLength(6)]],
      tipoUsuario: ['', Validators.required],
      perfil: ['', Validators.required]
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
            console.log('User types loaded from service:', types);
            this.userTypes = types;
          })
        );

        this.subscription.add(
          this.userService.userProfiles$.subscribe(profiles => {
            console.log('User profiles loaded from service:', profiles);
            this.userProfiles = profiles;
          })
        );
      }
    });
  }

  onSubmit() {
    console.log('onSubmit llamado');
    console.log('Form valid:', this.userForm.valid);
    console.log('Form value:', this.userForm.value);
    console.log('Form errors:', this.userForm.errors);
    
    if (this.userForm.valid && !this.isSubmitting) {
      console.log('Procesando formulario...');
      this.isSubmitting = true;
      
      try {
        const formValue = this.userForm.value;
        
        // Buscar el tipo de usuario seleccionado
        const selectedTipoUsuario = this.userTypes.find(tipo => tipo.nombre === formValue.tipoUsuario);
        const selectedPerfil = this.userProfiles.find(perfil => perfil.nombrePerfil === formValue.perfil);
        
        if (!selectedTipoUsuario) {
          throw new Error('Tipo de usuario no válido');
        }
        
        if (!selectedPerfil) {
          throw new Error('Perfil no válido');
        }
        
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
          tipoUsuario: selectedTipoUsuario,
          perfil: selectedPerfil,
          ciudad: { id: 1, nombre: 'Bogotá', departamento: { id: 1, nombre: 'Cundinamarca' } }
        };

        this.userService.createUser(userData).subscribe({
          next: (response) => {
            console.log('Response from backend:', response);
            // Verificar si la respuesta indica un error
            if (this.userService.isErrorResponse(response)) {
              this.mensajeModal = response;
              this.tipoMensaje = 'error';
            } else {
              this.mensajeModal = response || 'Usuario creado exitosamente';
              this.tipoMensaje = 'success';
              
              setTimeout(() => {
                this.router.navigate(['/usuarios-admin']);
              }, 2000);
            }
          },
          error: (error) => {
            this.mensajeModal = this.userService.extractErrorMessage(error);
            this.tipoMensaje = 'error';
            console.error('Error completo:', error);
          }
        });

      } catch (error: any) {
        this.mensajeModal = error.message || 'Error al crear el usuario';
        this.tipoMensaje = 'error';
      } finally {
        this.isSubmitting = false;
      }
    } else {
      console.log('Form no válido');
      this.logFormErrors();
      this.markFormGroupTouched();
      this.mensajeModal = 'Por favor, complete todos los campos requeridos correctamente';
      this.tipoMensaje = 'error';
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

  private logFormErrors() {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control && control.errors) {
        console.log(`Campo ${key} tiene errores:`, control.errors);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} es requerido`;
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
}
