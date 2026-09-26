import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AbonnementEnAttente } from '../../../core/models/abonnement.model';
import { Button } from '../../../shared/ui/button/button';
import { Header } from '../../../shared/ui/header/header';

@Component({
  selector: 'app-admin-abonnements',
  standalone: true,
  imports: [CommonModule, Header, Button],
  templateUrl: './admin-abonnements.html',
  styleUrl: './admin-abonnements.scss'
})
export class AdminAbonnements implements OnInit {
  readonly abonnements = signal<AbonnementEnAttente[]>([]);
  readonly chargement = signal(true);
  readonly enTraitementId = signal<number | null>(null);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.http.get<AbonnementEnAttente[]>(`${environment.apiUrl}/admin/abonnements/en-attente`).subscribe({
      next: (liste) => {
        this.abonnements.set(liste);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
  }

  valider(paiementId: number): void {
    this.enTraitementId.set(paiementId);
    this.http.post(`${environment.apiUrl}/admin/abonnements/valider-especes`, { paiementId }).subscribe({
      next: () => {
        this.enTraitementId.set(null);
        this.charger();
      },
      error: () => this.enTraitementId.set(null)
    });
  }

  rejeter(paiementId: number): void {
    const motif = prompt('Motif du rejet ?');
    if (!motif) return;

    this.enTraitementId.set(paiementId);
    this.http.post(`${environment.apiUrl}/admin/abonnements/rejeter-especes`, { paiementId, motif }).subscribe({
      next: () => {
        this.enTraitementId.set(null);
        this.charger();
      },
      error: () => this.enTraitementId.set(null)
    });
  }
}
