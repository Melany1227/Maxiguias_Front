import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalLogin } from '../modal-login/modal-login';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ModalLogin],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  showLoginModal = false;

  openLoginModal() {
    this.showLoginModal = true;
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }
}
