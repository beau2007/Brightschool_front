import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Header } from '../../shared/ui/header/Header';
import { Button } from '../../shared/ui/button/Button';
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

  constructor(private http: HttpClient) {}

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
