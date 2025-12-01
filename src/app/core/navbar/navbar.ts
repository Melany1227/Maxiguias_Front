import { Component, AfterViewInit, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
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
  currentUser: any = null;
  isLoggedIn = false;
  private subscription: Subscription = new Subscription();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.cartService.cartItems$.subscribe(items => {
        this.cartItemCount = this.cartService.getCartItemCount();
      })
    );

    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        console.log('Navbar - Current user updated:', user);
        console.log('Navbar - User role:', this.getUserRole());
        console.log('Navbar - User type:', this.getUserType());
        console.log('Navbar - Is admin:', this.isAdmin());
        console.log('Navbar - Is juridico:', this.isJuridico());
      })
    );

    this.subscription.add(
      this.authService.isLoggedIn$.subscribe(isLoggedIn => {
        this.isLoggedIn = isLoggedIn;
        console.log('Navbar - Is logged in:', isLoggedIn);
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

  getUserRole(): string {
    return this.authService.getUserRole();
  }

  getUserType(): string {
    return this.authService.getUserType();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isJuridico(): boolean {
    return this.authService.isJuridico();
  }

  canSeeUserAdmin(): boolean {
    return this.isAdmin();
  }

  canSeeProducts(): boolean {
    return this.isAdmin();
  }

  canSeeCart(): boolean {
    return this.isLoggedIn && (this.isAdmin() || this.isJuridico());
  }

  canSeeOrders(): boolean {
    return this.isAdmin();
  }

  logout() {
    this.authService.logout();
  }
}
