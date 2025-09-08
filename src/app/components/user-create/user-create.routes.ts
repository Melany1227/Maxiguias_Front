import { Routes } from '@angular/router';

export const userCreateRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-create').then(m => m.UserCreate)
  }
]