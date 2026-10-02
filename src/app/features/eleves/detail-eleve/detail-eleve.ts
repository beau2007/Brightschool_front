import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Header } from '../../../shared/ui/header/header';
import { EleveDetail, NoteEleve } from '../../../core/models/eleve.model';
import { ElevesService } from '../../../core/services/eleves.service';
import { AuthService } from '../../../core/services/auth.service';
import { Classe } from '../../../core/models/classe.model';
import { TableauNotesData } from '../../../core/models/note.model';
import { TableauNotes } from '../../../shared/ui/tableau-notes/tableau-notes';

@Component({
  selector: 'app-detail-eleve',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, TableauNotes],
  templateUrl: './detail-eleve.html',
  styleUrl: './detail-eleve.scss'
})
export class DetailEleve implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(ElevesService);
  private authService = inject(AuthService);

  readonly eleve = signal<EleveDetail | null>(null);
  readonly classes = signal<Classe[]>([]);
  readonly notesEleve = signal<NoteEleve[]>([]);
  readonly trimestre = signal<1 | 2 | 3>(1);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly routeRetour = computed(() => this.authService.aLeRole('Parent') ? '/mes-enfants' : '/eleves');
  readonly ecoleNom = computed(() => this.authService.profil()?.roles.find((role) => role.ecoleNom)?.ecoleNom ?? null);
  readonly classeCourante = computed(() => {
    const nom = this.eleve()?.classeNom?.trim().toLocaleLowerCase();
    if (!nom) return null;
    return this.classes().find((classe) => classe.nom.trim().toLocaleLowerCase() === nom) ?? null;
  });
  readonly notesTrimestre = computed(() => this.notesEleve().filter((note) => note.trimestre === this.trimestre()));
  readonly nombreEvaluations = computed(() => this.notesEleve().length);
  readonly moyenneEvaluations = computed(() => {
    const notes = this.notesEleve();
    const totalCoef = notes.reduce((total, note) => total + note.coefficient, 0);
    const totalPondere = notes.reduce((total, note) => total + (note.note / note.noteMax) * 20 * note.coefficient, 0);
    return totalCoef ? +(totalPondere / totalCoef).toFixed(2) : null;
  });
  readonly tableauNotes = computed<TableauNotesData | null>(() => {
    const eleve = this.eleve();
    if (!eleve) return null;

    const notes = this.notesTrimestre();
    const matieres = [...new Map(notes.map((note) => [note.matiereId, {
      id: note.matiereId,
      nom: note.matiere,
      coefficient: note.coefficient
    }])).values()];
    const notesParEleve: TableauNotesData['notes'] = { [eleve.eleveId]: {} };

    for (const note of notes) {
      notesParEleve[eleve.eleveId][note.matiereId] = {
        valeur: note.note,
        noteMax: note.noteMax,
        coefficient: note.coefficient,
        appreciation: note.appreciation
      };
    }

    return {
      classeId: this.classeCourante()?.id ?? '',
      classeNom: this.classeCourante()?.nom ?? eleve.classeNom ?? 'Classe',
      trimestre: this.trimestre(),
      matieres,
      eleves: [{
        eleveId: eleve.eleveId,
        nom: eleve.nom,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        photoUrl: eleve.photoUrl
      }],
      notes: notesParEleve
    };
  });
  readonly age = computed(() => {
    const dateNaissance = this.eleve()?.dateNaissance;
    if (!dateNaissance) return null;
    const naissance = new Date(dateNaissance);
    if (Number.isNaN(naissance.getTime())) return null;
    const aujourdHui = new Date();
    let age = aujourdHui.getFullYear() - naissance.getFullYear();
    if (aujourdHui < new Date(aujourdHui.getFullYear(), naissance.getMonth(), naissance.getDate())) age--;
    return age;
  });

  readonly initiales = computed(() => {
    const e = this.eleve();
    if (!e) return '?';
    return ((e.prenom?.[0] ?? '') + (e.nom?.[0] ?? '')).toUpperCase() || '?';
  });

  readonly moyenneGenerale = computed(() => {
    return this.moyenneEvaluations();
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.erreur.set('Identifiant élève invalide.');
      this.chargement.set(false);
      return;
    }

    forkJoin({
      eleve: this.service.detail(id),
      classes: this.service.classes().pipe(catchError(() => of([] as Classe[]))),
      notes: this.service.notes(id).pipe(catchError(() => of([] as NoteEleve[])))
    }).subscribe({
      next: ({ eleve, classes, notes }) => {
        this.eleve.set(eleve);
        this.classes.set(classes);
        this.notesEleve.set(notes);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger le dossier de cet élève. Vérifiez votre session puis réessayez.');
        this.chargement.set(false);
      }
    });
  }

  afficher(valeur: string | null | undefined): string {
    return valeur && valeur.trim() !== '' ? valeur : 'Non renseigné';
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
  }

  changerTrimestre(trimestre: 1 | 2 | 3): void {
    this.trimestre.set(trimestre);
  }
}