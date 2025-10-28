import { Routes } from '@angular/router';
import { Login } from './core/login/login';


export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./core/login/login.routes').then(m => m.loginRoutes)
  },
  {
    path: 'register',
    loadChildren: () => import('./components/user-register/user-register.routes').then(m => m.userRegisterRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./core/main-page/main.routes').then(m => m.mainRoutes)
  },
  {
    path: 'usuarios',
    redirectTo: '/usuarios-admin',
    pathMatch: 'full'
  },
  {
    path: 'usuarios-admin',
    loadChildren: () => import('./components/users-admin/users-admin.routes').then(m => m.usersAdminRoutes)
  },
  {
    path: 'usuarios-admin/crear',
    loadChildren: () => import('./components/user-create/user-create.routes').then(m => m.userCreateRoutes)
  },
  {
    path: 'usuarios-admin/editar/:id',
    loadChildren: () => import('./components/user-edit/user-edit.routes').then(m => m.userEditRoutes)
  },
  {
    path: 'usuarios-admin/ver/:id',
    loadChildren: () => import('./components/user-edit/user-edit.routes').then(m => m.userEditRoutes)
  },
  {
    path: 'catalog',
    loadChildren: () => import('./components/catalog/catalog.routes').then(m => m.catalogRoutes)
  },
  {
    path: 'cart',
    loadChildren: () => import('./components/shopping-cart/shopping-cart.routes').then(m => m.shoppingCartRoutes)
  },
  {
    path: 'order-create',
    loadChildren: () => import('./components/order-create/order-create.routes').then(m => m.orderCreateRoutes)
  },
  {
    path: 'orders',
    loadChildren: () => import('./components/orders-list/orders-list.routes').then(m => m.ordersListRoutes)
  },
  {
    path: 'order-details/:id',
    loadChildren: () => import('./components/order-details/order-details.routes').then(m => m.orderDetailsRoutes)
  },
  {
    path: 'products',
    loadChildren: () => import('./components/products-admin/products-admin.routes').then(m => m.productsAdminRoutes)
  },
  {
    path: 'products/create',
    loadChildren: () => import('./components/product-form/product-form.routes').then(m => m.productFormRoutes)
  },
  {
    path: 'products/edit/:id',
    loadChildren: () => import('./components/product-form/product-form.routes').then(m => m.productFormRoutes)
  }
];
