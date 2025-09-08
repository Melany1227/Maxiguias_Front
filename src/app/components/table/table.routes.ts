import { Routes } from '@angular/router';

export const tableRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./table').then(m => m.Table)
  }
]