import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, User, TipoUsuario, Perfil } from '../../services/user.service';
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
  mensajeModal: string = '';
  tipoMensaje: 'success' | 'error' = 'success';
  isSubmitting: boolean = false;
  isLoading: boolean = true;
  
  currentUser: User | null = null;
  userId: number = 0;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
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
            this.isLoading = false;
          },
          error: (error) => {
            this.mensajeModal = 'Usuario no encontrado';
            this.tipoMensaje = 'error';
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
    }
  }

  onSubmit() {
    if (this.userForm.valid && !this.isSubmitting && this.currentUser) {
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
          perfil: selectedPerfil
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
              this.mensajeModal = response;
              this.tipoMensaje = 'error';
            } else {
              this.mensajeModal = response || 'Usuario actualizado exitosamente';
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
        this.mensajeModal = error.message || 'Error al actualizar el usuario';
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