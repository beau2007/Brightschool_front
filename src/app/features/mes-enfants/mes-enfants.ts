import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Header } from '../../shared/ui/header/header';
import { environment } from '../../../environments/environment';
import { EnfantDuParent } from '../../core/models/eleve.model';

@Component({
  selector: 'app-mes-enfants',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './mes-enfants.html',
  styleUrl: './mes-enfants.scss'
})
export class MesEnfants implements OnInit {
  readonly enfants = signal<EnfantDuParent[]>([]);
  readonly chargement = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<EnfantDuParent[]>(`${environment.apiUrl}/eleves/mes-enfants`).subscribe({
      next: (enfants) => {
        this.enfants.set(enfants);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
  }
}
