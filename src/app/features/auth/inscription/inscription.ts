import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ModePaiement } from '../../../core/models/inscription.models';
import { Plan } from '../../../core/models/plan.model';
import { Button } from '../../../shared/ui/button/button';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Button],
  styleUrl: './inscription.scss',
  templateUrl: './inscription.html',
})
export class Inscription implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly plans = signal<Plan[]>([]);
  readonly chargementPlans = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly soumissionOK = signal<string | null>(null);
  readonly afficherMotDePasse = signal(false);
  readonly afficherConfirmation = signal(false);
  readonly anneeCourante = new Date().getFullYear();

  readonly optionsPaiement = [
    { value: ModePaiement.Stripe, label: 'Carte bancaire' },
    { value: ModePaiement.Especes, label: 'Espèces' },
    { value: ModePaiement.Virement, label: 'Virement' }
  ];

  private readonly validateurConfirmationMotDePasse = (control: AbstractControl): ValidationErrors | null => {
    const motDePasse = control.get('motDePasse')?.value;
    const confirmation = control.get('confirmationMotDePasse')?.value;

    return motDePasse && confirmation && motDePasse !== confirmation ? { motDePasseDifferent: true } : null;
  };

  readonly form = this.fb.group(
    {
      nomEcole: ['', [Validators.required]],
      emailDirecteur: ['', [Validators.required, Validators.email]],
      nomDirecteur: ['', [Validators.required]],
      prenomDirecteur: ['', [Validators.required]],
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      confirmationMotDePasse: ['', [Validators.required]],
      planId: [1, [Validators.required, Validators.min(1)]],
      modePaiement: [ModePaiement.Stripe, [Validators.required]]
    },
    { validators: this.validateurConfirmationMotDePasse }
  );

  readonly planSelectionne = computed(() =>
    this.plans().find((plan) => plan.id === Number(this.form.get('planId')?.value)) ?? null
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const planParam = Number(params.get('plan'));
      if (Number.isFinite(planParam) && planParam > 0) {
        this.form.patchValue({ planId: planParam }, { emitEvent: false });
      }
    });

    this.http.get<Plan[]>(`${environment.apiUrl}/plans`).subscribe({
      next: (plans) => {
        this.plans.set(plans.length > 0 ? plans : this.plansParDefaut());
        this.chargementPlans.set(false);

        if (this.form.get('planId')?.value === 1 && plans.length > 0) {
          const planInitial = Number(plans[0]?.id ?? 1);
          this.form.patchValue({ planId: planInitial }, { emitEvent: false });
        }
      },
      error: () => {
        this.plans.set(this.plansParDefaut());
        this.chargementPlans.set(false);
      }
    });
  }

  basculerVisibiliteMotDePasse(): void {
    this.afficherMotDePasse.update((visible) => !visible);
  }

  basculerVisibiliteConfirmation(): void {
    this.afficherConfirmation.update((visible) => !visible);
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erreur.set('Merci de corriger les champs du formulaire avant de continuer.');
      return;
    }

    const value = this.form.getRawValue();
    const nomEcole = (value.nomEcole ?? '').trim();
    const emailDirecteur = (value.emailDirecteur ?? '').trim();
    const nomDirecteur = (value.nomDirecteur ?? '').trim();
    const prenomDirecteur = (value.prenomDirecteur ?? '').trim();
    const motDePasse = value.motDePasse ?? '';
    const confirmationMotDePasse = value.confirmationMotDePasse ?? '';

    if (motDePasse !== confirmationMotDePasse) {
      this.erreur.set('La confirmation du mot de passe ne correspond pas au mot de passe choisi.');
      return;
    }

    this.erreur.set(null);
    this.soumissionOK.set(null);

    const payload = {
      nomEcole,
      emailDirecteur,
      nomDirecteur,
      prenomDirecteur,
      motDePasse,
      planId: Number(value.planId),
      modePaiement: Number(value.modePaiement)
    };

    this.http.post(`${environment.apiUrl}/auth/inscrire-ecole`, payload).subscribe({
      next: () => {
        this.soumissionOK.set('Compte créé avec succès. Vous pouvez maintenant vous connecter.');
        this.form.reset({
          nomEcole: '',
          emailDirecteur: '',
          nomDirecteur: '',
          prenomDirecteur: '',
          motDePasse: '',
          confirmationMotDePasse: '',
          planId: Number(this.plans()[0]?.id ?? 1),
          modePaiement: ModePaiement.Stripe
        });

        setTimeout(() => this.router.navigate(['/connexion']), 1200);
      },
      error: (err) => {
        const message = err?.error?.message ?? 'Impossible de créer votre compte pour le moment. Réessayez plus tard.';
        this.erreur.set(message);
      }
    });
  }

  private plansParDefaut(): Plan[] {
    return [
      { id: 1, nom: 'Essentiel', prixMensuel: 19, nbEleveMax: 120, nbEnseignantMax: 12 },
      { id: 2, nom: 'Pro', prixMensuel: 39, nbEleveMax: 300, nbEnseignantMax: 40 },
      { id: 3, nom: 'Premium', prixMensuel: 69, nbEleveMax: null, nbEnseignantMax: null }
    ];
  }
}
