import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, User, UserType, UserProfile } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-edit',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.css'
})
export class UserEdit implements OnInit, OnDestroy {
  
  userForm!: FormGroup;
  userTypes: UserType[] = [];
  userProfiles: UserProfile[] = [];
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
      primerApellido: ['', [Validators.required, Validators.minLength(2)]],
      segundoApellido: [''],
      direccion: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9\-\+\s\(\)]{10,}$/)]],
      email: ['', [Validators.required, Validators.email]],
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: [''], // No required for editing
      tipoUsuario: ['', Validators.required],
      perfil: ['', Validators.required],
      estado: ['', Validators.required]
    });
  }

  loadData() {
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

  loadUser() {
    this.subscription.add(
      this.route.params.subscribe(params => {
        this.userId = +params['id'];
        if (this.userId) {
          const foundUser = this.userService.getUserById(this.userId);
          this.currentUser = foundUser || null;
          if (this.currentUser) {
            this.populateForm();
            this.isLoading = false;
          } else {
            this.mensajeModal = 'Usuario no encontrado';
            this.tipoMensaje = 'error';
            this.isLoading = false;
          }
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
        email: this.currentUser.email,
        usuario: this.currentUser.usuario,
        tipoUsuario: this.currentUser.tipoUsuario,
        perfil: this.currentUser.perfil,
        estado: this.currentUser.estado
      });
    }
  }

  onSubmit() {
    if (this.userForm.valid && !this.isSubmitting && this.currentUser) {
      this.isSubmitting = true;
      
      try {
        const formValue = this.userForm.value;
        const userData: Partial<User> = {
          documento: formValue.documento,
          nombre: formValue.nombre,
          primerApellido: formValue.primerApellido,
          segundoApellido: formValue.segundoApellido || '',
          direccion: formValue.direccion,
          telefono: formValue.telefono,
          email: formValue.email,
          usuario: formValue.usuario,
          tipoUsuario: formValue.tipoUsuario as 'Administrador' | 'Empleado' | 'Cliente',
          perfil: formValue.perfil,
          estado: formValue.estado as 'Activo' | 'Inactivo' | 'Suspendido'
        };

        // Only include password if it was provided
        if (formValue.password && formValue.password.trim()) {
          userData.password = formValue.password;
        }

        const updatedUser = this.userService.updateUser(this.userId, userData);
        
        if (updatedUser) {
          this.mensajeModal = `Usuario ${updatedUser.nombre} ${updatedUser.primerApellido} actualizado exitosamente`;
          this.tipoMensaje = 'success';
          
          setTimeout(() => {
            this.router.navigate(['/usuarios']);
          }, 2000);
        } else {
          this.mensajeModal = 'Error al actualizar el usuario';
          this.tipoMensaje = 'error';
        }

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
      if (control.errors['email']) return 'Email inválido';
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
    this.router.navigate(['/usuarios']);
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