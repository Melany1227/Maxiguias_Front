import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-modal-login',
  standalone: true,
  templateUrl: './modal-login.html',
  styleUrl: './modal-login.css'
})
export class ModalLogin {
  @Output() closeModal = new EventEmitter<void>();

  onClose() {
    this.closeModal.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}