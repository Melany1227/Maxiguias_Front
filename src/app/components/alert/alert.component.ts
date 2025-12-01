import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, AlertMessage, ConfirmationData } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Alertas de notificación -->
    <div class="alerts-container" *ngIf="alerts.length > 0">
      <div 
        *ngFor="let alert of alerts" 
        class="alert-item"
        [ngClass]="'alert-' + alert.type"
        [attr.data-alert-id]="alert.id"
      >
        <div class="alert-content">
          <div class="alert-icon">
            <span [innerHTML]="getAlertIcon(alert.type)"></span>
          </div>
          <div class="alert-text">
            <div class="alert-title" *ngIf="alert.title">{{ alert.title }}</div>
            <div class="alert-message">{{ alert.message }}</div>
          </div>
          <button 
            *ngIf="alert.closable" 
            class="alert-close"
            (click)="closeAlert(alert.id)"
            aria-label="Cerrar alerta"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación -->
    <div *ngIf="confirmation" class="confirmation-overlay" (click)="cancelConfirmation($event)">
      <div class="confirmation-modal" (click)="$event.stopPropagation()">
        <div class="confirmation-header">
          <h3 class="confirmation-title">{{ confirmation.title }}</h3>
        </div>
        <div class="confirmation-body">
          <p class="confirmation-message">{{ confirmation.message }}</p>
        </div>
        <div class="confirmation-actions">
          <button 
            type="button" 
            class="btn btn-secondary"
            (click)="cancelConfirmation()"
          >
            {{ confirmation.cancelText }}
          </button>
          <button 
            type="button" 
            class="btn btn-danger"
            (click)="confirmAction()"
          >
            {{ confirmation.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit, OnDestroy {
  alerts: AlertMessage[] = [];
  confirmation: ConfirmationData | null = null;
  private subscription = new Subscription();

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    this.subscription.add(
      this.alertService.alerts$.subscribe(alerts => {
        this.alerts = alerts;
      })
    );

    this.subscription.add(
      this.alertService.confirmation$.subscribe(confirmation => {
        this.confirmation = confirmation;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  closeAlert(id: string) {
    this.alertService.removeAlert(id);
  }

  confirmAction() {
    if (this.confirmation) {
      this.confirmation.confirmAction();
    }
  }

  cancelConfirmation(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.confirmation && this.confirmation.cancelAction) {
      this.confirmation.cancelAction();
    } else {
      this.alertService.hideConfirmation();
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  }
}