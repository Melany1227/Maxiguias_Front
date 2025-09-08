import { Component, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements AfterViewInit {
  isCollapsed = true;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.style.setProperty('--sidebar-w', '56px');
    }
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
