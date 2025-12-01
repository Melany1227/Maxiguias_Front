import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './core/navbar/navbar';
import { Footer } from './core/footer/footer';
import { AlertComponent } from './components/alert/alert.component';
  
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, AlertComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('maxigestionFront');
}
