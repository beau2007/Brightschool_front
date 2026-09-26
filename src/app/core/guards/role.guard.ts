import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/// Usage dans les routes : canActivate: [roleGuard(['Directeur', 'Enseignant'])]
export function roleGuard(rolesAutorises: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.estConnecte()) {
      return router.createUrlTree(['/connexion']);
    }

    const autorise = rolesAutorises.some((role) => authService.aLeRole(role));
    return autorise ? true : router.createUrlTree(['/acces-refuse']);
  };
}
