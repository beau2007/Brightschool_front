import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/Home').then((m) => m.Home)
  },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent)
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./features/auth/inscription/inscription').then((m) => m.Inscription)
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () =>
      import('./features/auth/mot-de-passe-oublie/mot-de-passe-oublie').then((m) => m.MotDePasseOublie)
  },
  {
    path: 'reinitialiser-mot-de-passe',
    loadComponent: () =>
      import('./features/auth/reinitialiser-mot-de-passe/reinitialiser-mot-de-passe').then((m) => m.ReinitialiserMotDePasse)
  },

  { path: '**', redirectTo: '' }
];
