import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/api/productos/catalogo',
    '/api/productos/catalogo/buscar'
  ];

  // Verificar si la URL es pública
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Solo agregar el token a las peticiones del backend que no sean públicas
  if (req.url.includes('localhost:8080/api') && !isPublicRoute) {
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(authReq);
    }
  }

  return next(req);
};