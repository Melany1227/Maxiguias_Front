import { Routes } from '@angular/router';
import { Login } from './core/login/login';


export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./core/login/login.routes').then(m => m.loginRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./core/main-page/main.routes').then(m => m.mainRoutes)
  }
];
