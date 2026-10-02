import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../../shared/ui/header/header';
import { TableauNotes } from '../../shared/ui/tableau-notes/tableau-notes';
import { AuthService } from '../../core/services/auth.service';
import { Classe, TableauNotesData } from '../../core/models/note.model';
import { NotesService } from '../../core/services/notes.service';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, TableauNotes],
  templateUrl: './notes.html',
  styleUrl: './notes.scss'
})
export class Notes implements OnInit {
  private service = inject(NotesService);
  private auth = inject(AuthService);

  // ---------- Rôle ----------
  readonly role = computed(() => this.auth.userRole?.() ?? 'Enseignant');
  readonly estDirectrice = computed(() =>
    this.role() === 'Directeur' || this.role() === 'AdminPlateforme'
  );

  // ---------- État ----------
  readonly classes = signal<Classe[]>([]);
  readonly classeSelectionnee = signal<string | null>(null);
  readonly trimestre = signal<1 | 2 | 3>(1);

  readonly tableau = signal<TableauNotesData | null>(null);
  readonly chargement = signal(false);
  readonly chargementClasses = signal(false);
  readonly erreur = signal<string | null>(null);

  readonly classeCourante = computed(() =>
    this.classes().find(c => c.id === this.classeSelectionnee()) ?? null
  );

  // ---------- Init ----------
  ngOnInit(): void {
    if (this.estDirectrice()) {
      this.chargerClasses();
    } else {
      this.chargerMaClasse();
    }
  }

  // ---------- Chargement classes (Directrice) ----------
  private chargerClasses(): void {
    this.chargementClasses.set(true);
    this.erreur.set(null);

    this.service.classes().subscribe({
      next: (classes) => {
        this.classes.set(classes ?? []);
        this.chargementClasses.set(false);

        if (classes?.length > 0) {
          this.classeSelectionnee.set(classes[0].id);
          this.chargerTableau();
        } else {
          this.tableau.set(this.tableauVide());
        }
      },
      error: () => {
        this.chargementClasses.set(false);
        this.erreur.set('Impossible de charger la liste des classes.');
        this.tableau.set(this.tableauVide());
      }
    });
  }

  // ---------- Chargement classe (Enseignant) ----------
  private chargerMaClasse(): void {
    this.chargementClasses.set(true);
    this.erreur.set(null);

    this.service.maClasse().subscribe({
      next: (classe) => {
        this.classes.set(classe ? [classe] : []);
        this.classeSelectionnee.set(classe?.id ?? null);
        this.chargementClasses.set(false);

        if (classe) {
          this.chargerTableau();
        } else {
          this.tableau.set(this.tableauVide());
        }
      },
      error: () => {
        this.chargementClasses.set(false);
        this.erreur.set("Aucune classe n'est assignée à ton compte.");
        this.tableau.set(this.tableauVide());
      }
    });
  }

  // ---------- Chargement du tableau ----------
  chargerTableau(): void {
    const id = this.classeSelectionnee();
    if (!id) {
      this.tableau.set(this.tableauVide());
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);
    this.tableau.set(null);

      const classe = this.classeCourante();
      if (!classe) {
        this.chargement.set(false);
        this.tableau.set(this.tableauVide());
        return;
      }

      this.service.tableauClasse(classe, this.trimestre()).subscribe({
      next: (data) => {
        this.tableau.set(data ?? this.tableauVide());
        this.chargement.set(false);
      },
      error: () => {
        this.tableau.set(this.tableauVide());
        this.erreur.set('Impossible de charger les notes de cette classe.');
        this.chargement.set(false);
      }
    });
  }

  // ---------- Actions UI ----------
  onClasseChange(id: string): void {
    this.classeSelectionnee.set(id || null);
    this.chargerTableau();
  }

  onTrimestreChange(t: 1 | 2 | 3): void {
    if (this.trimestre() === t) return;
    this.trimestre.set(t);
    this.chargerTableau();
  }

  reessayer(): void {
    if (this.classeSelectionnee()) {
      this.chargerTableau();
    } else if (this.estDirectrice()) {
      this.chargerClasses();
    } else {
      this.chargerMaClasse();
    }
  }

  // ---------- Fallback : tableau vide ----------
  private tableauVide(): TableauNotesData {
    return {
      classeId: this.classeSelectionnee() ?? '',
      classeNom: this.classeCourante()?.nom ?? '—',
      trimestre: this.trimestre(),
      matieres: [],
      eleves: [],
      notes: {}
    };
  }
}