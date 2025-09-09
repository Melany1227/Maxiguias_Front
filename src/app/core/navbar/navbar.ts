import { Component, AfterViewInit, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements AfterViewInit, OnInit, OnDestroy {
  isCollapsed = true;
  cartItemCount = 0;
  private subscription: Subscription = new Subscription();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.cartService.cartItems$.subscribe(items => {
        this.cartItemCount = this.cartService.getCartItemCount();
      })
    );
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.style.setProperty('--sidebar-w', '56px');
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggle() {
    this.isCollapsed = !this.isCollapsed;
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.style.setProperty(
        '--sidebar-w',
        this.isCollapsed ? '56px' : '220px'
      );
    }
  }
}
