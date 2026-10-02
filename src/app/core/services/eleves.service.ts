import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EleveDetail, EnfantDuParent, NoteEleve } from '../../core/models/eleve.model';
import { Classe } from '../models/classe.model';

@Injectable({ providedIn: 'root' })
export class ElevesService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/eleves`;

  mesEnfants(): Observable<EnfantDuParent[]> {
    return this.http.get<EnfantDuParent[]>(`${this.api}/mes-enfants`);
  }

  detail(id: string): Observable<EleveDetail> {
    return this.http.get<{
      id: string;
      matricule: string | null;
      nom: string | null;
      prenom: string | null;
      dateNaissance: string;
      sexe: string | null;
      photoUrl: string | null;
      informationsMedicales: string | null;
      classeActuelle: string | null;
    }>(`${this.api}/${encodeURIComponent(id)}`).pipe(
      map((eleve) => ({
        eleveId: eleve.id,
        matricule: eleve.matricule,
        nom: eleve.nom ?? '',
        prenom: eleve.prenom ?? '',
        dateNaissance: eleve.dateNaissance,
        sexe: eleve.sexe === 'M' || eleve.sexe === 'F' ? eleve.sexe : null,
        photoUrl: eleve.photoUrl,
        informationsMedicales: eleve.informationsMedicales,
        classeNom: eleve.classeActuelle
      }))
    );
  }

  classes(): Observable<Classe[]> {
    return this.http.get<Classe[]>(`${environment.apiUrl}/classes`);
  }

  notes(id: string): Observable<NoteEleve[]> {
    interface NoteDto {
      id: string;
      eleveId: string;
      matiereId: string;
      matiere?: { nom?: string | null } | null;
      trimestre: number;
      valeur: number;
      noteMax: number;
      coefficient: number;
      dateEvaluation: string;
      appreciation?: string | null;
    }

    return this.http.get<NoteDto[]>(`${environment.apiUrl}/Notes`).pipe(
      map((notes) => (notes ?? [])
        .filter((note) => note.eleveId.toLocaleLowerCase() === id.toLocaleLowerCase())
        .filter((note) => note.trimestre === 1 || note.trimestre === 2 || note.trimestre === 3)
        .map((note) => ({
          id: note.id,
          matiereId: note.matiereId,
          matiere: note.matiere?.nom?.trim() || 'Matière',
          note: note.valeur,
          noteMax: note.noteMax || 20,
          coefficient: note.coefficient || 1,
          date: note.dateEvaluation,
          trimestre: note.trimestre as 1 | 2 | 3,
          appreciation: note.appreciation ?? null
        })))
    );
  }
}