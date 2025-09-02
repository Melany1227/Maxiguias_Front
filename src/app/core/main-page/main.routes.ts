import { Routes } from "@angular/router";
import { MainPage } from "./main-page";

export const mainRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./main-page').then(m => m.MainPage)
  }
]