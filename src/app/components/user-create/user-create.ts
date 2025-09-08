import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-create',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css'
})
export class UserCreate implements OnInit {
  
  userForm!: FormGroup;
  tiposUsuario: any[] = [];
  perfiles: any[] = [];
  mensajeModal: string = '';
  tipoMensaje: 'success' | 'error' = 'success';

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  initForm() {
    this.userForm = this.fb.group({
      documento: ['', [Validators.required]],
      nombre: ['', Validators.required],
      primerApellido: [''],
      segundoApellido: [''],
      direccion: ['', Validators.required],
      telefono: ['', [Validators.required]],
      nombreUsuario: [''],
      contrasena: [''],
      tipoUsuario: ['', Validators.required],
      perfil: ['', Validators.required]
    });
  }

  loadData() {
    this.tiposUsuario = [
      { id: 1, nombre: 'Administrador' },
      { id: 2, nombre: 'Natural' },
      { id: 3, nombre: 'Juridico' }
    ];

    this.perfiles = [
      { id: 1, nombrePerfil: 'Administrador' },
      { id: 2, nombrePerfil: 'Usuario natural' },
      { id: 3, nombrePerfil: 'Almacén' }

    ];
  }

  onSubmit() {
    if (this.userForm.valid) {
      console.log('Usuario:', this.userForm.value);
    }
  }
}
