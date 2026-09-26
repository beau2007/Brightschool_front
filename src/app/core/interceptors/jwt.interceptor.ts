import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Endpoints publics : ne jamais y attacher un token (inutile, et éviterait
// d'envoyer un token expiré/absent qui n'a aucun sens sur ces routes).
const ROUTES_PUBLIQUES = [
  '/auth/login',
  '/auth/refresh',
  '/auth/inscrire-ecole',
  '/auth/mot-de-passe-oublie',
  '/auth/reinitialiser-mot-de-passe',
  '/plans'
];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const estPublique = ROUTES_PUBLIQUES.some((route) => req.url.includes(route));

  const token = authService.getAccessToken();
  const requeteAvecToken = !estPublique && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requeteAvecToken).pipe(
    catchError((erreur) => {
      // 401 sur une route protégée : le token a probablement expiré. On tente
      // UNE fois un refresh silencieux, puis on rejoue la requête d'origine.
      // Si le refresh échoue aussi, la session est vraiment terminée.
      if (erreur.status === 401 && !estPublique) {
        return authService.rafraichirToken().pipe(
          switchMap(() => {
            const nouveauToken = authService.getAccessToken();
            const requeteRejouee = req.clone({
              setHeaders: { Authorization: `Bearer ${nouveauToken}` }
            });
            return next(requeteRejouee);
          }),
          catchError((erreurRefresh) => {
            authService.logout();
            return throwError(() => erreurRefresh);
          })
        );
      }
      return throwError(() => erreur);
    })
  );
};
