import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AlertMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
}

export interface ConfirmationData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmAction: () => void;
  cancelAction?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<AlertMessage[]>([]);
  private confirmationSubject = new BehaviorSubject<ConfirmationData | null>(null);

  public alerts$ = this.alertsSubject.asObservable();
  public confirmation$ = this.confirmationSubject.asObservable();

  constructor() {}

  showSuccess(message: string, title?: string, duration: number = 5000) {
    this.addAlert({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration,
      closable: true
    });
  }

  showError(message: string, title?: string, duration: number = 0) { // 0 means no auto-dismiss
    this.addAlert({
      id: this.generateId(),
      type: 'error',
      title,
      message,
      duration,
      closable: true
    });
  }

  showWarning(message: string, title?: string, duration: number = 7000) {
    this.addAlert({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration,
      closable: true
    });
  }

  showInfo(message: string, title?: string, duration: number = 5000) {
    this.addAlert({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration,
      closable: true
    });
  }

  confirm(data: Omit<ConfirmationData, 'confirmAction'> & { confirmAction?: () => void }): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmationData: ConfirmationData = {
        title: data.title,
        message: data.message,
        confirmText: data.confirmText || 'Confirmar',
        cancelText: data.cancelText || 'Cancelar',
        confirmAction: () => {
          if (data.confirmAction) data.confirmAction();
          resolve(true);
          this.hideConfirmation();
        },
        cancelAction: () => {
          if (data.cancelAction) data.cancelAction();
          resolve(false);
          this.hideConfirmation();
        }
      };

      this.confirmationSubject.next(confirmationData);
    });
  }

  hideConfirmation() {
    this.confirmationSubject.next(null);
  }

  removeAlert(id: string) {
    const currentAlerts = this.alertsSubject.value;
    const updatedAlerts = currentAlerts.filter(alert => alert.id !== id);
    this.alertsSubject.next(updatedAlerts);
  }

  clearAllAlerts() {
    this.alertsSubject.next([]);
  }

  private addAlert(alert: AlertMessage) {
    const currentAlerts = this.alertsSubject.value;
    const newAlerts = [...currentAlerts, alert];
    
    // Limitar a máximo 5 alertas
    if (newAlerts.length > 5) {
      newAlerts.shift(); // Remover la primera (más antigua)
    }
    
    this.alertsSubject.next(newAlerts);

    // Auto-dismiss si tiene duración
    if (alert.duration && alert.duration > 0) {
      setTimeout(() => {
        this.removeAlert(alert.id);
      }, alert.duration);
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}