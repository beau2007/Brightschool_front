import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Header } from '../../shared/ui/header/header';
import { Button } from '../../shared/ui/button/button';
import { Plan } from '../../core/models/plan.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Header, Button],
  templateUrl: './Home.html',
  styleUrl: './Home.scss'
})
export class Home implements OnInit {
  readonly plans = signal<Plan[]>([]);
  readonly chargementPlans = signal(true);
  readonly anneeCourante = new Date().getFullYear();
  readonly faqOuverte = signal<number | null>(null);
  readonly listeFaq = [
    {
      question: 'À qui s’adresse BrightSchool ?',
      reponse: 'BrightSchool accompagne les établissements scolaires dans la gestion quotidienne de leurs activités.'
    },
    {
      question: 'Puis-je choisir une offre adaptée à mon établissement ?',
      reponse: 'Oui, plusieurs offres sont proposées afin de répondre aux besoins des établissements de différentes tailles.'
    },
    {
      question: 'Les parents peuvent-ils suivre la scolarité de leurs enfants ?',
      reponse: 'Oui, le portail Parent permet de consulter les informations liées à la scolarité des enfants.'
    }
  ];

  constructor(private http: HttpClient) {}

  basculerFaq(index: number): void {
    this.faqOuverte.update((ouverte) => (ouverte === index ? null : index));
  }

  ngOnInit(): void {
    this.http.get<Plan[]>(`${environment.apiUrl}/plans`).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.chargementPlans.set(false);
      },
      error: () => this.chargementPlans.set(false)
    });
  }
}
