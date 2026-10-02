import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Classe, TableauNotesData } from '../../core/models/note.model';

interface EleveNoteDto {
  id: string;
  nom: string;
  prenom: string;
  matricule?: string | null;
  photoUrl?: string | null;
}

interface NoteDto {
  id: string;
  eleveId: string;
  matiereId: string;
  matiere?: { id?: string; nom?: string | null; coefficient?: number } | null;
  trimestre: number;
  valeur: number;
  noteMax: number;
  coefficient: number;
  appreciation?: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  /** Toutes les classes de l'école (Directrice). */
  classes(): Observable<Classe[]> {
    return this.http.get<Classe[]>(`${this.api}/classes`);
  }

  /** La classe assignée à l'enseignant connecté. */
  maClasse(): Observable<Classe | null> {
    return this.classes().pipe(map((classes) => classes[0] ?? null));
  }

  /** Tableau de notes d'une classe pour un trimestre donné. */
  tableauClasse(
    classe: Classe,
    trimestre: 1 | 2 | 3
  ): Observable<TableauNotesData> {
    return forkJoin({
      eleves: this.http.get<EleveNoteDto[]>(`${this.api}/eleves/classe/${encodeURIComponent(classe.id)}`),
      notes: this.http.get<NoteDto[]>(`${this.api}/Notes`)
    }).pipe(map(({ eleves, notes }) => this.assemblerTableau(classe, eleves, notes, trimestre)));
  }

  private assemblerTableau(
    classe: Classe,
    eleves: EleveNoteDto[],
    toutesLesNotes: NoteDto[],
    trimestre: 1 | 2 | 3
  ): TableauNotesData {
    const idsEleves = new Set(eleves.map((eleve) => eleve.id));
    const notesClasse = toutesLesNotes.filter(
      (note) => idsEleves.has(note.eleveId) && note.trimestre === trimestre
    );
    const matieresParId = new Map<string, { id: string; nom: string; coefficient: number }>();

    for (const note of notesClasse) {
      if (!matieresParId.has(note.matiereId)) {
        matieresParId.set(note.matiereId, {
          id: note.matiereId,
          nom: note.matiere?.nom?.trim() || `Matière ${matieresParId.size + 1}`,
          coefficient: note.matiere?.coefficient ?? note.coefficient ?? 1
        });
      }
    }

    const notesParEleve: TableauNotesData['notes'] = {};
    for (const note of notesClasse) {
      notesParEleve[note.eleveId] ??= {};
      notesParEleve[note.eleveId][note.matiereId] = {
        valeur: note.valeur,
        noteMax: note.noteMax || 20,
        coefficient: note.coefficient || 1,
        appreciation: note.appreciation ?? null
      };
    }

    return {
      classeId: classe.id,
      classeNom: classe.nom,
      trimestre,
      matieres: [...matieresParId.values()],
      eleves: eleves.map((eleve) => ({
        eleveId: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        photoUrl: eleve.photoUrl
      })),
      notes: notesParEleve
    };
  }
}