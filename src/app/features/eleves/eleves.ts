import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  imports: [CommonModule, ReactiveFormsModule, Header, Button],
  templateUrl: './eleves.html',
  styleUrl: './eleves.scss'
})
export class Eleves implements OnInit {
  readonly classes = signal<Classe[]>([]);
  readonly classeSelectionneeId = signal<number | null>(null);
  readonly eleves = signal<EleveListe[]>([]);
  readonly chargementEleves = signal(false);
  readonly formulaireOuvert = signal(false);
  readonly enregistrement = signal(false);
  readonly erreur = signal<string | null>(null);

  readonly form = inject(FormBuilder).group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    dateNaissance: ['', Validators.required],
    sexe: [''],
    informationsMedicales: ['']
  });

  constructor(private http: HttpClient, public authService: AuthService) {}

  ngOnInit(): void {
    this.http.get<Classe[]>(`${environment.apiUrl}/classes`).subscribe((classes) => {
      this.classes.set(classes);
      // Sélectionne la classe de l'enseignant si son rôle en a une, sinon la première.
      const premiere = classes[0]?.id ?? null;
      this.selectionnerClasse(premiere);
    });
  }

  selectionnerClasse(classeId: number | null): void {
    this.classeSelectionneeId.set(classeId);
    if (!classeId) {
      this.eleves.set([]);
      return;
    }

    this.chargementEleves.set(true);
    this.http.get<EleveListe[]>(`${environment.apiUrl}/eleves/classe/${classeId}`).subscribe({
      next: (eleves) => {
        this.eleves.set(eleves);
        this.chargementEleves.set(false);
      },
      error: () => this.chargementEleves.set(false)
    });
  }

  onChangerClasse(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
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
