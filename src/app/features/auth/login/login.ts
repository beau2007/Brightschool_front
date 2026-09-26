import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiErreur } from '../../../core/models/auth.models';
import { Button } from '../../../shared/ui/button/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Button],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required]
  });

  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly afficherMotDePasse = signal(false);
  readonly anneeCourante = new Date().getFullYear();

  basculerVisibiliteMotDePasse(): void {
    this.afficherMotDePasse.update((visible) => !visible);
  }

  connexionGoogle(): void {
    this.erreur.set('La connexion avec Google sera bientôt disponible.');
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);

    this.authService.login(this.form.getRawValue() as { email: string; motDePasse: string }).subscribe({
      next: () => {
        const retour = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(retour ?? this.authService.routeApresConnexion());
      },
      error: (err) => {
        this.chargement.set(false);
        const apiErreur = err.error as ApiErreur | undefined;
        this.erreur.set(apiErreur?.message ?? 'Connexion impossible. Vérifie tes identifiants.');
      }
    });
  }
}