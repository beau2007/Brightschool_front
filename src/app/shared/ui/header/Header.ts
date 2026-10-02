import { Component, computed, signal } from '@angular/core';
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
  readonly menuCompteOuvert = signal(false);
  readonly menuMobileOuvert = signal(false);

  constructor(public authService: AuthService) {}

  readonly nomEtablissement = computed(() => {
    const profil = this.authService.profil();
    const etablissements = [...new Set(profil?.roles.map((role) => role.ecoleNom?.trim()).filter((nom): nom is string => !!nom) ?? [])];

    if (etablissements.length === 1) return etablissements[0];
    if (etablissements.length > 1) return 'Plusieurs établissements';
    if (this.authService.aLeRole('AdminPlateforme')) return 'Administration plateforme';
    return 'Établissement scolaire';
  });

  readonly roleUtilisateur = computed(() => {
    const roles = this.authService.profil()?.roles.map((scope) => scope.roleNom) ?? [];
    const libelles: Record<string, string> = {
      AdminPlateforme: 'Administrateur plateforme',
      Directeur: 'Direction',
      Enseignant: 'Enseignant',
      Parent: 'Parent'
    };
    return [...new Set(roles.map((role) => libelles[role] ?? role))].join(' · ') || 'Utilisateur';
  });

  readonly initialesUtilisateur = computed(() => {
    const profil = this.authService.profil();
    return `${profil?.prenom?.[0] ?? ''}${profil?.nom?.[0] ?? ''}`.toLocaleUpperCase() || 'BS';
  });

  basculerMenuCompte(): void {
    this.menuCompteOuvert.update((ouvert) => !ouvert);
  }

  basculerMenuMobile(): void {
    this.menuMobileOuvert.update((ouvert) => !ouvert);
  }

  fermerMenuMobile(): void {
    this.menuMobileOuvert.set(false);
  }

  deconnecterDepuisMenuMobile(): void {
    this.fermerMenuMobile();
    this.seDeconnecter();
  }

  // Un seul point à faire évoluer si les rôles ou leurs routes changent.
  readonly liensNav = computed<LienNav[]>(() => {
    if (!this.authService.estConnecte()) return [];

    const liens: LienNav[] = [];

    if (this.authService.aLeRole('AdminPlateforme')) {
      liens.push({ label: 'Abonnements', route: '/admin/abonnements' });
    }
    if (this.authService.aLeRole('Directeur')) {
      liens.push(
        { label: 'Tableau de bord', route: '/dashboard' },
        { label: 'Élèves', route: '/eleves' },
        { label: 'Classes', route: '/classes' },
        { label: 'Notes', route: '/notes' },
        { label: 'Rapports', route: '/rapport' }
      );
    }
    if (this.authService.aLeRole('Enseignant')) {
      liens.push(
        { label: 'Tableau de bord', route: '/dashboard' },
        { label: 'Élèves', route: '/eleves' },
        { label: 'Classes', route: '/classes' },
        { label: 'Notes', route: '/notes' }
      );
    }
    if (this.authService.aLeRole('Parent')) {
      liens.push({ label: 'Mes enfants', route: '/mes-enfants' });
    }

    return [...new Map(liens.map((lien) => [lien.route, lien])).values()];
  });

  seDeconnecter(): void {
    this.menuCompteOuvert.set(false);
    this.menuMobileOuvert.set(false);
    this.authService.logout();
  }
}
