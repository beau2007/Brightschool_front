import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableauNotesData } from '../../../core/models/note.model';

@Component({
  selector: 'app-tableau-notes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tableau-notes.html',
  styleUrl: './tableau-notes.scss'
})
export class TableauNotes {
  private _data = signal<TableauNotesData | null>(null);
  readonly chargement = signal(false);
  @Input() singleStudent = false;

  @Input({ required: true })
  set data(value: TableauNotesData | null) {
    this._data.set(value);
  }
  get data() {
    return this._data();
  }

  @Input() set loading(value: boolean) {
    this.chargement.set(value);
  }

  readonly matieres = computed(() => this._data()?.matieres ?? []);
  readonly eleves = computed(() => this._data()?.eleves ?? []);

  readonly nombreMatieres = computed(() => this.matieres().length);
  readonly nombreEleves = computed(() => this.eleves().length);

  /** Récupère une cellule (ou null si vide) */
  cellule(eleveId: string, matiereId: string) {
    return this._data()?.notes?.[eleveId]?.[matiereId] ?? null;
  }

  /** Moyenne d'un élève (pondérée par coefficient) */
  moyenneEleve(eleveId: string): number | null {
    const data = this._data();
    if (!data) return null;

    let totalCoef = 0;
    let totalPondere = 0;

    for (const m of data.matieres) {
      const cell = data.notes?.[eleveId]?.[m.id];
      if (cell?.valeur != null) {
        totalPondere += (cell.valeur / (cell.noteMax || 20)) * 20 * m.coefficient;
        totalCoef += m.coefficient;
      }
    }

    return totalCoef > 0 ? +(totalPondere / totalCoef).toFixed(2) : null;
  }

  /** Moyenne de la classe pour une matière */
  moyenneMatiere(matiereId: string, coefficient: number): number | null {
    const data = this._data();
    if (!data) return null;

    let total = 0;
    let count = 0;

    for (const e of data.eleves) {
      const cell = data.notes?.[e.eleveId]?.[matiereId];
      if (cell?.valeur != null) {
        total += (cell.valeur / (cell.noteMax || 20)) * 20;
        count++;
      }
    }

    return count > 0 ? +(total / count).toFixed(2) : null;
  }

  /** Moyenne générale de la classe */
  moyenneClasse(): number | null {
    const moyennes = this.eleves()
      .map(e => this.moyenneEleve(e.eleveId))
      .filter((m): m is number => m !== null);

    if (moyennes.length === 0) return null;
    return +(moyennes.reduce((s, m) => s + m, 0) / moyennes.length).toFixed(2);
  }

  /** Couleur d'une note */
  couleurNote(valeur: number | null, max: number): string {
    if (valeur == null) return 'transparent';
    const pct = (valeur / max) * 100;
    if (pct >= 75) return '#10B981';
    if (pct >= 50) return '#F59E0B';
    if (pct >= 25) return '#F97316';
    return '#EF4444';
  }

  initiales(eleve: { prenom: string; nom: string }): string {
    return ((eleve.prenom?.[0] ?? '') + (eleve.nom?.[0] ?? '')).toUpperCase() || '?';
  }

  couleurAvatar(id: string): string {
    const palette = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];
    const index = [...id].reduce((total, caractere) => total + caractere.charCodeAt(0), 0);
    return palette[index % palette.length];
  }

  trackEleve = (_: number, e: { eleveId: string }) => e.eleveId;
  trackMatiere = (_: number, m: { id: string }) => m.id;
}