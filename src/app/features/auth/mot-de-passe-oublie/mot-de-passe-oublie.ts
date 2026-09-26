import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiErreur } from '../../../core/models/auth.models';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-mot-de-passe-oublie',
  styleUrl: './mot-de-passe-oublie.scss',
  templateUrl: './mot-de-passe-oublie.html',
})
export class MotDePasseOublie {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly succes = signal<string | null>(null);

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);
    this.succes.set(null);

    this.http.post(`${environment.apiUrl}/auth/mot-de-passe-oublie`, this.form.getRawValue()).subscribe({
      next: () => {
        this.chargement.set(false);
        this.succes.set('Si cette adresse existe, un lien de réinitialisation vient d’être envoyé.');
        this.form.reset();
      },
      error: (err) => {
        this.chargement.set(false);
        const apiErreur = err.error as ApiErreur | undefined;
        this.erreur.set(apiErreur?.message ?? 'Impossible d’envoyer la demande. Réessaie plus tard.');
      }
    });
  }
}
