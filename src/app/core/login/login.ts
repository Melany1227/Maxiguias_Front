import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  credentials: LoginRequest = {
    nombreUsuario: '',
    contrasena: ''
  };

  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.credentials.nombreUsuario || !this.credentials.contrasena) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.token) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage = response.mensaje || 'Error en el inicio de sesión';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.authService.extractErrorMessage(error);
        console.error('Error en login:', error);
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
