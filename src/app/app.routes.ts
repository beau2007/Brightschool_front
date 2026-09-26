import { Routes } from '@angular/router';
// Garde temporairement désactivée pendant le développement :
// import { authGuard } from './core/guards/auth.guard';
// import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/Home').then((m) => m.Home)
  },
  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent)
  },
  {
    path: 'inscription',
    loadComponent: () => import('./features/auth/inscription/inscription').then((m) => m.Inscription)
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () =>
      import('./features/auth/mot-de-passe-oublie/mot-de-passe-oublie').then((m) => m.MotDePasseOublie)
  },
  {
    path: 'reinitialiser-mot-de-passe',
    loadComponent: () =>
      import('./features/auth/reinitialiser-mot-de-passe/reinitialiser-mot-de-passe').then(
        (m) => m.ReinitialiserMotDePasse
      )
  },

  {
    path: 'dashboard',
    // canActivate: [authGuard, roleGuard(['Directeur', 'Enseignant'])],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard)
  },
  {
    path: 'classes',
    // canActivate: [authGuard, roleGuard(['Directeur', 'Enseignant'])],
    loadComponent: () => import('./features/classes/classes').then((m) => m.Classes)
  },
  {
    path: 'eleves',
    // canActivate: [authGuard, roleGuard(['Directeur', 'Enseignant'])],
    loadComponent: () => import('./features/eleves/eleves').then((m) => m.Eleves)
  },
  {
    path: 'mes-enfants',
    // canActivate: [authGuard, roleGuard(['Parent'])],
    loadComponent: () => import('./features/mes-enfants/mes-enfants').then((m) => m.MesEnfants)
  },
  {
    path: 'admin/abonnements',
    // canActivate: [authGuard, roleGuard(['AdminPlateforme'])],
    loadComponent: () =>
      import('./features/admin/abonnements/admin-abonnements').then((m) => m.AdminAbonnements)
  },

  // TODO : 'presences', 'rapports', 'enseignants' — prochaine passe
  { path: 'acces-refuse', loadComponent: () => import('./features/home/Home').then((m) => m.Home) }, // TODO : vraie page 403

  { path: '**', redirectTo: '' }
];
