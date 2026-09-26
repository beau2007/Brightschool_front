import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Button } from '../button/Button';

interface LienNav {
  label: string;
  route: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, Button],
  templateUrl: './Header.html',
  styleUrl: './Header.scss'
})
export class Header {
  constructor(public authService: AuthService) {}

  // Un seul point à faire évoluer si les rôles ou leurs routes changent.
  readonly liensNav = computed<LienNav[]>(() => {
    if (this.authService.aLeRole('AdminPlateforme')) {
      return [{ label: 'Abonnements', route: '/admin/abonnements' }];
    }
    if (this.authService.aLeRole('Directeur') || this.authService.aLeRole('Enseignant')) {
      return [
        { label: 'Tableau de bord', route: '/dashboard' },
        { label: 'Élèves', route: '/eleves' },
        { label: 'Classes', route: '/classes' },
        { label: 'Présences', route: '/presences' },
        { label: 'Rapports', route: '/rapports' }
      ];
    }
    if (this.authService.aLeRole('Parent')) {
      return [{ label: 'Mes enfants', route: '/mes-enfants' }];
    }
    return [];
  });

  seDeconnecter(): void {
    this.authService.logout();
  }
}
