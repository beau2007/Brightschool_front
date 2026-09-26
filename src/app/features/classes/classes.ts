import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Header } from '../../shared/ui/header/header';
import { Button } from '../../shared/ui/button/button';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { Classe, CreerClasseRequest } from '../../core/models/classe.model';
import { Niveau } from '../../core/models/niveau.model';
import { ApiErreur } from '../../core/models/auth.models';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header, Button],
  templateUrl: './classes.html',
  styleUrl: './classes.scss'
})
export class Classes implements OnInit {
  readonly classes = signal<Classe[]>([]);
  readonly niveaux = signal<Niveau[]>([]);
  readonly chargement = signal(true);
  readonly formulaireOuvert = signal(false);
  readonly enregistrement = signal(false);
  readonly erreur = signal<string | null>(null);

  readonly form = inject(FormBuilder).group({
    nom: ['', Validators.required],
    niveauId: [null as number | null, Validators.required],
    enseignantPrincipalId: [null as number | null],
    effectifMax: [null as number | null]
  });

  constructor(private http: HttpClient, public authService: AuthService) {}

  ngOnInit(): void {
    this.chargerClasses();
    this.http.get<Niveau[]>(`${environment.apiUrl}/niveaux`).subscribe((niveaux) => this.niveaux.set(niveaux));
  }

  private chargerClasses(): void {
    this.chargement.set(true);
    this.http.get<Classe[]>(`${environment.apiUrl}/classes`).subscribe({
      next: (classes) => {
        this.classes.set(classes);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enregistrement.set(true);
    this.erreur.set(null);

    const payload = this.form.getRawValue() as CreerClasseRequest;

    this.http.post(`${environment.apiUrl}/classes`, payload).subscribe({
      next: () => {
        this.enregistrement.set(false);
        this.annuler();
        this.chargerClasses();
      },
      error: (err) => {
        this.enregistrement.set(false);
        const apiErreur = err.error as ApiErreur | undefined;
        this.erreur.set(apiErreur?.message ?? 'Impossible de créer la classe.');
      }
    });
  }
}
