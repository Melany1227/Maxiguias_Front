import { Routes } from '@angular/router';

export const usersListRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users-list').then(m => m.UsersList)
  }
]
