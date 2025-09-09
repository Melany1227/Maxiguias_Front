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
  },
  {
    path: 'usuarios',
    loadChildren: () => import('./components/users-list/users-list.routes').then(m => m.usersListRoutes)
  },
  {
    path: 'user-create',
    loadChildren: () => import('./components/user-create/user-create.routes').then(m => m.userCreateRoutes)
  },
  {
    path: 'catalog',
    loadChildren: () => import('./components/catalog/catalog.routes').then(m => m.catalogRoutes)
  }
];
