import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EnfantDuParent } from '../../../core/models/eleve.model';

@Component({
  selector: 'app-card-eleve',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './card-eleve.html',
  styleUrl: './card-eleve.scss'
})
export class CardEleve {
  private _enfant = signal<EnfantDuParent | null>(null);

  @Input({ required: true })
  set enfant(value: EnfantDuParent) {
    this._enfant.set(value);
  }
  get enfant() {
    return this._enfant()!;
  }

  readonly initiales = computed(() => {
    const e = this._enfant();
    if (!e) return '?';
    const p = e.prenom?.charAt(0) ?? '';
    const n = e.nom?.charAt(0) ?? '';
    return (p + n).toUpperCase() || '?';
  });

  readonly couleurAvatar = computed(() => {
    const palette = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];
    const id = this._enfant()?.eleveId ?? '';
    const index = [...id].reduce((total, caractere) => total + caractere.charCodeAt(0), 0);
    return palette[index % palette.length];
  });

  afficher(valeur: string | null | undefined): string {
    return valeur && valeur.trim() !== '' ? valeur : 'Non renseigné';
  }
}