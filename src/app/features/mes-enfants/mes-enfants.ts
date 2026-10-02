import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Header } from '../../shared/ui/header/header';
import { environment } from '../../../environments/environment';
import { EnfantDuParent } from '../../core/models/eleve.model';

@Component({
  selector: 'app-mes-enfants',
  standalone: true,
  imports: [CommonModule, RouterModule, Header],
  templateUrl: './mes-enfants.html',
  styleUrl: './mes-enfants.scss'
})
export class MesEnfants implements OnInit {
  readonly enfants = signal<EnfantDuParent[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);

  readonly nombreEnfants = computed(() => this.enfants().length);

  // Skeleton pour l'effet de chargement
  readonly skeletons = [1, 2, 3];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerEnfants();
  }

  chargerEnfants(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.http.get<EnfantDuParent[]>(`${environment.apiUrl}/eleves/mes-enfants`).subscribe({
      next: (enfants) => {
        this.enfants.set(enfants ?? []);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger la liste de tes enfants.');
        this.chargement.set(false);
      }
    });
  }

  // Helpers pour l'affichage sécurisé
  afficher(valeur: string | null | undefined): string {
    return valeur && valeur.trim() !== '' ? valeur : 'Non renseigné';
  }

  initiales(enfant: EnfantDuParent): string {
    const p = enfant.prenom?.charAt(0) ?? '';
    const n = enfant.nom?.charAt(0) ?? '';
    return (p + n).toUpperCase() || '?';
  }

  // Couleur d'avatar déterministe basée sur l'id
  couleurAvatar(id: string): string {
    const palette = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];
    const index = [...id].reduce((total, caractere) => total + caractere.charCodeAt(0), 0);
    return palette[index % palette.length];
  }
}