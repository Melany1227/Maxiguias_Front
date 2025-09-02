import { Routes } from '@angular/router';
import { Login } from './login';

export const loginRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login').then(m => m.Login)
  }
]