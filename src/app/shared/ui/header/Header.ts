import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Button } from '../button/button';

interface LienNav {
  label: string;
  route: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, Button],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  constructor(public authService: AuthService) {}

  // Un seul point à faire évoluer si les rôles ou leurs routes changent.
  readonly liensNav = computed<LienNav[]>(() => {
    if (!this.authService.estConnecte()) {
      return [
        { label: 'Tableau de bord', route: '/dashboard' },
        { label: 'Élèves', route: '/eleves' },
        { label: 'Classes', route: '/classes' },
        { label: 'Mes enfants', route: '/mes-enfants' },
        { label: 'Abonnements', route: '/admin/abonnements' }
      ];
    }

    const liens: LienNav[] = [];

    if (this.authService.aLeRole('AdminPlateforme')) {
      liens.push({ label: 'Abonnements', route: '/admin/abonnements' });
    }
    if (this.authService.aLeRole('Directeur')) {
      liens.push(
        { label: 'Tableau de bord', route: '/dashboard' },
        { label: 'Élèves', route: '/eleves' },
        { label: 'Classes', route: '/classes' }
      );
    }
    if (this.authService.aLeRole('Enseignant')) {
      liens.push(
        { label: 'Tableau de bord', route: '/dashboard' },
        { label: 'Élèves', route: '/eleves' },
        { label: 'Classes', route: '/classes' }
      );
    }
    if (this.authService.aLeRole('Parent')) {
      liens.push({ label: 'Mes enfants', route: '/mes-enfants' });
    }

    return [...new Map(liens.map((lien) => [lien.route, lien])).values()];
  });

  seDeconnecter(): void {
    this.authService.logout();
  }
}
