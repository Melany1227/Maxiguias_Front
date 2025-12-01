import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService, Orden } from '../../services/orders.service';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

@Component({
  selector: 'app-order-details',
  imports: [CommonModule],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css'
})
export class OrderDetails implements OnInit, OnDestroy {
  order: Orden | null = null;
  loading: boolean = true;
  error: string | null = null;

  statusOptions = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_PROCESO', label: 'En Proceso' },
    { value: 'FINALIZADA', label: 'Finalizada' },
    { value: 'CANCELADA', label: 'Cancelada' },
    { value: 'FACTURADA', label: 'Facturada' }
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService
  ) {}

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(+orderId);
    } else {
      this.error = 'ID de orden no válido';
      this.loading = false;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadOrder(id: number) {
    this.loading = true;
    this.subscription.add(
      this.ordersService.getOrdenById(id).subscribe({
        next: (order) => {
          this.order = order;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading order:', error);
          this.error = 'Error al cargar la orden';
          this.loading = false;
        }
      })
    );
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  updateStatus(newStatus: string) {
    if (this.order) {
      // TODO: Implement status update API call
      console.log('Update status:', this.order.id, newStatus);
      this.order.estado = newStatus;
    }
  }

  getStatusLabel(estado: string): string {
    const statusOption = this.statusOptions.find(option => option.value === estado);
    return statusOption ? statusOption.label : estado;
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'status-pending';
      case 'EN_PROCESO': return 'status-progress';
      case 'FINALIZADA': return 'status-completed';
      case 'CANCELADA': return 'status-cancelled';
      case 'FACTURADA': return 'status-confirmed';
      default: return 'status-default';
    }
  }


  formatDate(date: Date | string): string {
    if (!date) return 'No disponible';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return dateObj.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getTotalItems(): number {
    return this.order?.detalles.reduce((total, detalle) => total + detalle.cantidad, 0) || 0;
  }

  printOrder() {
    this.generateInvoicePDF();
  }

  generateInvoicePDF() {
    if (!this.order) {
      console.error('No hay orden para generar PDF');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Configurar colores
    const primaryColor = [243, 198, 35]; // Color primario
    const darkColor = [31, 41, 55];
    const grayColor = [107, 114, 128];

    // Header de la empresa
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MaxiGestión', 15, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Pedidos', pageWidth - 15, 15, { align: 'right' });
    doc.text('Factura de Venta', pageWidth - 15, 25, { align: 'right' });

    // Información de la orden
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`ORDEN #${this.order.id}`, 15, 50);
    
    // Información del cliente
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 15, 70);
    
    doc.setFont('helvetica', 'normal');
    const customerY = 80;
    doc.text(`Nombre: ${this.order.usuario.nombre} ${this.order.usuario.primerApellido}`, 15, customerY);
    doc.text(`Documento: ${this.order.usuario.documento}`, 15, customerY + 10);
    doc.text(`Teléfono: ${this.order.usuario.telefono}`, 15, customerY + 20);
    if (this.order.usuario.direccion) {
      doc.text(`Dirección: ${this.order.usuario.direccion}`, 15, customerY + 30);
    }
    
    // Información de fechas
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DE LA ORDEN', pageWidth - 15, 70, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    const orderInfoY = 80;
    doc.text(`Fecha de Pedido: ${this.formatDate(this.order.fechaPedido)}`, pageWidth - 15, orderInfoY, { align: 'right' });
    if (this.order.fechaEntrega) {
      doc.text(`Fecha de Entrega: ${this.formatDate(this.order.fechaEntrega)}`, pageWidth - 15, orderInfoY + 10, { align: 'right' });
    }
    doc.text(`Estado: ${this.getStatusLabel(this.order.estado)}`, pageWidth - 15, orderInfoY + 20, { align: 'right' });

    // Tabla de productos
    const tableData = this.order.detalles.map(detalle => [
      detalle.terminado?.producto?.nombre || 'Producto',
      `${detalle.terminado?.medidaTerminadoProducto || 0}m`,
      detalle.cantidad.toString(),
      this.formatCurrency(detalle.valor),
      this.formatCurrency(detalle.valor * detalle.cantidad)
    ]);

    doc.autoTable({
      head: [['Producto', 'Medida', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      startY: 130,
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkColor
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 180;
    
    doc.setFillColor(248, 249, 250);
    doc.rect(pageWidth - 80, finalY + 10, 65, 25, 'F');
    
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', pageWidth - 75, finalY + 25);
    doc.setFontSize(14);
    doc.text(this.formatCurrency(this.order.total || 0), pageWidth - 20, finalY + 25, { align: 'right' });

    // Notas si existen
    if (this.order.notas) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notas:', 15, finalY + 50);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(this.order.notas, pageWidth - 30);
      doc.text(splitNotes, 15, finalY + 60);
    }

    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Generado por MaxiGestión - Sistema de Gestión de Pedidos', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CO')}`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Guardar el PDF
    doc.save(`Factura-Orden-${this.order.id}.pdf`);
  }
}