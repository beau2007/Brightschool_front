import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Header } from '../../shared/ui/header/header';
import { Button } from '../../shared/ui/button/button';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { Classe } from '../../core/models/classe.model';
import { EleveListe, CreerEleveRequest } from '../../core/models/eleve.model';
import { ApiErreur } from '../../core/models/auth.models';

@Component({
  selector: 'app-eleves',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Header, Button],
  templateUrl: './eleves.html',
  styleUrl: './eleves.scss'
})
export class Eleves implements OnInit {
  readonly classes = signal<Classe[]>([]);
  readonly classeSelectionneeId = signal<string | null>(null);
  readonly eleves = signal<EleveListe[]>([]);
  readonly chargementClasses = signal(true);
  readonly chargementEleves = signal(false);
  readonly formulaireOuvert = signal(false);
  readonly enregistrement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly erreurClasses = signal<string | null>(null);
  readonly erreurEleves = signal<string | null>(null);
  private revisionEleves = 0;
  readonly estEnseignant = computed(() => this.authService.aLeRole('Enseignant'));

  readonly form = inject(FormBuilder).group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    dateNaissance: ['', Validators.required],
    sexe: [''],
    informationsMedicales: ['']
  });

  constructor(private http: HttpClient, public authService: AuthService) {}

  ngOnInit(): void {
    if (this.estEnseignant()) {
      const classeId = this.authService.profil()?.roles.find((role) => role.roleNom === 'Enseignant')?.classeId;
      if (!classeId) {
        this.classes.set([]);
        this.chargementClasses.set(false);
        this.erreurClasses.set('Aucune classe n’est associée à ce compte enseignant. Contactez la direction.');
        return;
      }

      this.http.get<Classe>(`${environment.apiUrl}/classes/${encodeURIComponent(classeId)}`).subscribe({
        next: (classe) => {
          this.classes.set([classe]);
          this.chargementClasses.set(false);
          this.selectionnerClasse(classe.id);
        },
        error: () => {
          this.classes.set([]);
          this.chargementClasses.set(false);
          this.erreurClasses.set('Impossible de charger la classe associée à ce compte.');
        }
      });
      return;
    }

    this.http.get<Classe[]>(`${environment.apiUrl}/classes`).subscribe((classes) => {
      this.classes.set(classes);
      this.chargementClasses.set(false);
      this.erreurClasses.set(null);
      this.selectionnerClasse(this.classes()[0]?.id ?? null);
    }, () => {
      this.classes.set([]);
      this.chargementClasses.set(false);
      this.erreurClasses.set('Impossible de charger les classes. Vérifiez votre session puis réessayez.');
    });
  }

  selectionnerClasse(classeId: string | null): void {
    const revision = ++this.revisionEleves;
    this.classeSelectionneeId.set(classeId);
    this.erreur.set(null);
    this.erreurEleves.set(null);
    if (!classeId) {
      this.eleves.set([]);
      this.chargementEleves.set(false);
      return;
    }

    this.chargementEleves.set(true);
    this.http.get<EleveListe[]>(`${environment.apiUrl}/eleves/classe/${classeId}`).subscribe({
      next: (eleves) => {
        if (revision !== this.revisionEleves) return;
        this.eleves.set(eleves);
        this.chargementEleves.set(false);
      },
      error: () => {
        if (revision !== this.revisionEleves) return;
        this.eleves.set([]);
        this.erreurEleves.set('Impossible de charger les élèves de cette classe.');
        this.chargementEleves.set(false);
      }
    });
  }

  onChangerClasse(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.selectionnerClasse(id || null);
  }

  ouvrirFormulaire(): void {
    this.formulaireOuvert.set(true);
  }

  annuler(): void {
    this.formulaireOuvert.set(false);
    this.form.reset();
    this.erreur.set(null);
  }

  soumettre(): void {
    const classeId = this.classeSelectionneeId();
    if (this.form.invalid || !classeId) {
      this.form.markAllAsTouched();
      return;
    }

    this.enregistrement.set(true);
    this.erreur.set(null);

    const valeurs = this.form.getRawValue();
    const payload: CreerEleveRequest = {
      nom: valeurs.nom!,
      prenom: valeurs.prenom!,
      dateNaissance: valeurs.dateNaissance!,
      sexe: valeurs.sexe || null,
      classeId,
      informationsMedicales: valeurs.informationsMedicales || null
    };

    this.http.post(`${environment.apiUrl}/eleves`, payload).subscribe({
      next: () => {
        this.enregistrement.set(false);
        this.annuler();
        this.selectionnerClasse(classeId);
      },
      error: (err) => {
        this.enregistrement.set(false);
        const apiErreur = err.error as ApiErreur | undefined;
        this.erreur.set(apiErreur?.message ?? "Impossible de créer l'élève.");
      }
    });
  }
}
