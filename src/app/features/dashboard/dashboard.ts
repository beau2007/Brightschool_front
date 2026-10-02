import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, from, map, of, toArray } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Header } from '../../shared/ui/header/header';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { Classe } from '../../core/models/classe.model';
import { EnfantDuParent } from '../../core/models/eleve.model';
import { AbonnementEnAttente } from '../../core/models/abonnement.model';

interface AccesRapide {
  label: string;
  description: string;
  route: string;
  icone: string;
}

interface Indicateur {
  label: string;
  valeur: string;
  detail: string;
  icone: string;
  tendance: string;
  points: number[];
}

interface PresenceDashboard {
  eleveId: number;
  eleveNomComplet: string;
  date: string;
  statut: number;
  justifiee: boolean;
  motif: string | null;
}

interface PresenceClasseJour {
  classeId: string;
  classeNom: string;
  date: string;
  presences: PresenceDashboard[];
  erreur: boolean;
}

interface PointGraphique {
  label: string;
  value: number | null;
}

interface CoordonneeGraphique extends PointGraphique {
  x: number;
  y: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Header],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  readonly classes = signal<Classe[]>([]);
  readonly enfants = signal<EnfantDuParent[]>([]);
  readonly abonnementsEnAttente = signal<AbonnementEnAttente[]>([]);
  readonly chargement = signal(false);
  readonly erreurChargement = signal(false);
  readonly periodeAbsences = signal<'jour' | 'mois'>('mois');
  readonly dateAbsences = signal(this.formaterDate(new Date()));
  readonly moisAbsences = signal(this.formaterMois(new Date()));
  readonly chargementAbsences = signal(false);
  readonly erreurAbsences = signal(false);
  readonly presencesParClasseEtJour = signal<PresenceClasseJour[]>([]);
  private revisionAbsences = 0;
  readonly dateDuJour = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  constructor(public authService: AuthService, private http: HttpClient) {}

  readonly estDirecteur = computed(() => this.authService.aLeRole('Directeur'));
  readonly estEnseignant = computed(() => this.authService.aLeRole('Enseignant'));
  readonly estParent = computed(() => this.authService.aLeRole('Parent'));
  readonly estAdmin = computed(() => this.authService.aLeRole('AdminPlateforme'));
  readonly roleTitre = computed(() => {
    if (this.estAdmin()) return 'Administration plateforme';
    if (this.estDirecteur()) return 'Espace direction';
    if (this.estEnseignant()) return 'Espace enseignant';
    if (this.estParent()) return 'Espace parent';
    return 'Vue d’ensemble';
  });

  readonly totalEleves = computed(() => this.classes().reduce((total, classe) => total + classe.effectifActuel, 0));
  readonly capaciteTotale = computed(() =>
    this.classes().reduce((total, classe) => total + (classe.effectifMax ?? 0), 0)
  );
  readonly tauxOccupation = computed(() => {
    const capacite = this.capaciteTotale();
    const capaciteComplete = this.classes().length > 0 && this.classes().every((classe) => classe.effectifMax !== null);
    return capacite && capaciteComplete ? Math.round((this.totalEleves() / capacite) * 100) : null;
  });
  readonly etablissementsDistincts = computed(() => new Set(this.enfants().map((enfant) => enfant.ecoleNom)).size);
  readonly classesEnfants = computed(() => new Set(this.enfants().map((enfant) => enfant.classeNom)).size);
  readonly etablissementsAbonnes = computed(
    () => new Set(this.abonnementsEnAttente().map((abonnement) => abonnement.ecoleNom)).size
  );
  readonly plansEnAttente = computed(
    () => new Set(this.abonnementsEnAttente().map((abonnement) => abonnement.planNom)).size
  );

  readonly indicateurs = computed<Indicateur[]>(() => {
    if (!this.authService.estConnecte()) {
      return [
        { label: 'Élèves inscrits', valeur: '—', detail: 'Connectez-vous pour afficher vos données', icone: 'eleves', tendance: '—', points: [] },
        { label: 'Classes', valeur: '—', detail: 'Indicateur selon votre profil', icone: 'classes', tendance: '—', points: [] },
        { label: 'Présence moyenne', valeur: '—', detail: 'Données non disponibles', icone: 'presence', tendance: '—', points: [] },
        { label: 'Absences période', valeur: '—', detail: 'Données non disponibles', icone: 'absence', tendance: '—', points: [] },
        { label: 'Taux de réussite', valeur: '—', detail: 'Données non disponibles', icone: 'suivi', tendance: '—', points: [] },
        { label: 'Retards période', valeur: '—', detail: 'Données non disponibles', icone: 'retard', tendance: '—', points: [] }
      ];
    }
    if (this.estAdmin()) {
      return [
        { label: 'À traiter', valeur: String(this.abonnementsEnAttente().length), detail: 'Demandes de paiement en attente', icone: 'suivi', tendance: 'Demandes en attente', points: [] },
        { label: 'Établissements', valeur: String(this.etablissementsAbonnes()), detail: 'Établissements concernés', icone: 'ecoles', tendance: 'Données disponibles', points: [] },
        { label: 'Offres concernées', valeur: String(this.plansEnAttente()), detail: 'Plans dans les demandes en attente', icone: 'plans', tendance: 'Données disponibles', points: [] },
        { label: 'Demandes validées', valeur: '—', detail: 'Statistique non disponible', icone: 'presence', tendance: 'Non disponible', points: [] },
        { label: 'Revenus mensuels', valeur: '—', detail: 'Statistique non disponible', icone: 'suivi', tendance: 'Non disponible', points: [] },
        { label: 'Abonnements actifs', valeur: '—', detail: 'Statistique non disponible', icone: 'retard', tendance: 'Non disponible', points: [] }
      ];
    }
    if (this.estParent()) {
      return [
        { label: 'Mes enfants', valeur: String(this.enfants().length), detail: 'Enfants rattachés au compte', icone: 'eleves', tendance: 'Données disponibles', points: [] },
        { label: 'Classes', valeur: String(this.classesEnfants()), detail: 'Classes actuellement suivies', icone: 'classes', tendance: 'Données disponibles', points: [] },
        {
          label: 'Établissements',
          valeur: String(this.etablissementsDistincts()),
          detail: 'Établissements concernés',
          icone: 'ecoles', tendance: 'Données disponibles', points: []
        },
        { label: 'Présences', valeur: '—', detail: 'Statistique non disponible', icone: 'presence', tendance: 'Non disponible', points: [] },
        { label: 'Absences', valeur: '—', detail: 'Statistique non disponible', icone: 'absence', tendance: 'Non disponible', points: [] },
        { label: 'Réussite scolaire', valeur: '—', detail: 'Statistique non disponible', icone: 'suivi', tendance: 'Non disponible', points: [] }
      ];
    }

    return [
      { label: 'Élèves inscrits', valeur: String(this.totalEleves()), detail: 'Effectif des classes accessibles', icone: 'eleves', tendance: 'Effectif actuel', points: [] },
      { label: 'Classes', valeur: String(this.classes().length), detail: 'Classes accessibles', icone: 'classes', tendance: 'Effectif actuel', points: [] },
      {
        label: 'Occupation',
        valeur: this.tauxOccupation() === null ? '—' : `${this.tauxOccupation()}%`,
        detail:
          this.tauxOccupation() === null
            ? 'Capacité non renseignée'
            : `${this.totalEleves()} élèves sur ${this.capaciteTotale()} places`,
        icone: 'suivi', tendance: 'Capacité utilisée', points: []
      },
      { label: 'Absences période', valeur: this.aDesDonneesAbsences() ? String(this.totalAbsences()) : '—', detail: 'Toutes classes confondues', icone: 'absence', tendance: 'Sur la période', points: [] },
      { label: 'Taux de réussite', valeur: '—', detail: 'Statistique non disponible', icone: 'suivi', tendance: 'Non disponible', points: [] },
      { label: 'Retards période', valeur: this.aDesDonneesAbsences() ? String(this.totalRetards()) : '—', detail: 'Toutes classes confondues', icone: 'retard', tendance: 'Sur la période', points: [] }
    ];
  });

  readonly acces = computed<AccesRapide[]>(() => {
    if (this.estAdmin()) {
      return [{ label: 'Abonnements', description: 'Examiner les demandes en attente', route: '/admin/abonnements', icone: 'plans' }];
    }
    if (this.estParent()) {
      return [{ label: 'Mes enfants', description: 'Retrouver les informations de vos enfants', route: '/mes-enfants', icone: 'eleves' }];
    }
    return [
      { label: 'Classes', description: 'Consulter les classes et les effectifs', route: '/classes', icone: 'classes' },
      { label: 'Élèves', description: 'Accéder à la liste des élèves', route: '/eleves', icone: 'eleves' }
    ];
  });

  readonly elementsRepartition = computed(() => {
    if (this.estParent()) {
      return this.enfants().map((enfant) => ({
        nom: `${enfant.prenom} ${enfant.nom}`,
        detail: `${enfant.classeNom} · ${enfant.ecoleNom}`,
        valeur: 100,
        effectif: 0
      }));
    }
    return this.classes().map((classe) => ({
      nom: classe.nom,
      detail: `${classe.niveau} · ${classe.effectifActuel} élève${classe.effectifActuel > 1 ? 's' : ''}`,
      valeur: this.totalEleves() ? Math.round((classe.effectifActuel / this.totalEleves()) * 100) : 0,
      effectif: classe.effectifActuel
    }));
  });

  readonly maximumListe = computed(() => (this.estAdmin() ? 4 : 5));

  readonly pointsAbsences = computed<PointGraphique[]>(() => {
    if (this.periodeAbsences() === 'jour') {
      const reels = this.classes().map((classe) => {
        const jour = this.presencesParClasseEtJour().find((item) => item.classeId === classe.id);
        return {
          label: classe.nom,
          value: !jour || jour.erreur || jour.presences.length === 0
            ? null
            : jour.presences.filter((presence) => this.estAbsence(presence.statut)).length
        };
      });
      return reels;
    }

    const jours = this.joursDuMois(this.moisAbsences());
    const reels = jours.map((date) => {
      const enregistrements = this.presencesParClasseEtJour()
        .filter((item) => item.date === date && !item.erreur)
        .flatMap((item) => item.presences);
      const erreur = this.presencesParClasseEtJour().some((item) => item.date === date && item.erreur);
      return {
        label: new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(new Date(`${date}T12:00:00`)),
        value: erreur || enregistrements.length === 0
          ? null
          : enregistrements.filter((presence) => this.estAbsence(presence.statut)).length
      };
    });
    return reels;
  });
  readonly aDesDonneesAbsences = computed(() => this.pointsAbsences().some((point) => point.value !== null));

  readonly coordonneesAbsences = computed<CoordonneeGraphique[]>(() => {
    const points = this.pointsAbsences();
    const valeurs = points.map((point) => point.value).filter((value): value is number => value !== null);
    const maximum = Math.max(1, ...valeurs);
    const largeur = 760;
    const hauteur = 250;
    const margeGauche = 38;
    const margeDroite = 14;
    const margeHaut = 16;
    const margeBas = 30;
    const largeurInterne = largeur - margeGauche - margeDroite;
    const hauteurInterne = hauteur - margeHaut - margeBas;

    return points.map((point, index) => ({
      ...point,
      x: margeGauche + (points.length <= 1 ? largeurInterne / 2 : (index / (points.length - 1)) * largeurInterne),
      y: point.value === null ? hauteur - margeBas : margeHaut + (1 - point.value / maximum) * hauteurInterne
    }));
  });

  readonly cheminAbsences = computed(() => this.creerChemin(this.segmentsCoordonnesAbsences()));
  readonly zoneAbsences = computed(() => this.creerZone(this.segmentsCoordonnesAbsences()));
  readonly repereAbsences = computed(() => {
    const points = this.coordonneesAbsences();
    const indices = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);
    return points.filter((point, index) => indices.has(index));
  });
  readonly maximumAbsences = computed(() =>
    Math.max(0, ...this.pointsAbsences().map((point) => point.value ?? 0))
  );
  readonly totalAbsences = computed(() =>
    this.presencesParClasseEtJour()
      .flatMap((jour) => jour.presences)
      .filter((presence) => this.estAbsence(presence.statut)).length
  );
  readonly totalRetards = computed(() =>
    this.presencesParClasseEtJour()
      .flatMap((jour) => jour.presences)
      .filter((presence) => this.estRetard(presence.statut)).length
  );
  readonly totalEnregistrees = computed(() =>
    this.presencesParClasseEtJour().reduce((total, jour) => total + jour.presences.length, 0)
  );
  readonly journeesRenseignees = computed(() =>
    new Set(this.presencesParClasseEtJour().filter((jour) => !jour.erreur && jour.presences.length > 0).map((jour) => jour.date)).size
  );

  ngOnInit(): void {
    if (!this.authService.estConnecte()) return;

    this.chargement.set(true);
    if (this.estAdmin()) {
      this.http.get<AbonnementEnAttente[]>(`${environment.apiUrl}/admin/abonnements/en-attente`).subscribe({
        next: (abonnements) => {
          this.abonnementsEnAttente.set(abonnements);
          this.chargement.set(false);
        },
        error: () => {
          this.erreurChargement.set(true);
          this.chargement.set(false);
        }
      });
      return;
    }
    if (this.estParent()) {
      this.http.get<EnfantDuParent[]>(`${environment.apiUrl}/eleves/mes-enfants`).subscribe({
        next: (enfants) => {
          this.enfants.set(enfants);
          this.chargement.set(false);
        },
        error: () => {
          this.erreurChargement.set(true);
          this.chargement.set(false);
        }
      });
      return;
    }

    this.http.get<Classe[]>(`${environment.apiUrl}/classes`).subscribe({
      next: (classes) => {
        this.classes.set(classes);
        this.chargement.set(false);
        if (this.estDirecteur() || this.estEnseignant()) this.chargerAbsences();
      },
      error: () => {
        this.erreurChargement.set(true);
        this.chargement.set(false);
      }
    });
  }

  changerPeriodeAbsences(event: Event): void {
    const periode = (event.target as HTMLSelectElement).value;
    if (periode !== 'jour' && periode !== 'mois') return;
    this.periodeAbsences.set(periode);
    this.chargerAbsences();
  }

  changerDateAbsences(event: Event): void {
    const date = (event.target as HTMLInputElement).value;
    if (!date) return;
    this.dateAbsences.set(date);
    this.chargerAbsences();
  }

  changerMoisAbsences(event: Event): void {
    const mois = (event.target as HTMLInputElement).value;
    if (!mois) return;
    this.moisAbsences.set(mois);
    this.chargerAbsences();
  }

  private chargerAbsences(): void {
    const revision = ++this.revisionAbsences;
    const dates = this.periodeAbsences() === 'jour' ? [this.dateAbsences()] : this.joursDuMois(this.moisAbsences());
    const requetes = dates.flatMap((date) =>
      this.classes().map((classe) => ({ classe, date }))
    );

    if (!requetes.length) {
      this.presencesParClasseEtJour.set([]);
      return;
    }

    this.chargementAbsences.set(true);
    this.erreurAbsences.set(false);
    from(requetes)
      .pipe(
        mergeMap(
          ({ classe, date }) =>
            this.http
              .get<PresenceDashboard[]>(`${environment.apiUrl}/presences/classe/${classe.id}`, { params: { date } })
              .pipe(
                map((presences) => ({ classeId: classe.id, classeNom: classe.nom, date, presences, erreur: false })),
                catchError(() => of({ classeId: classe.id, classeNom: classe.nom, date, presences: [], erreur: true }))
              ),
          4
        ),
        toArray()
      )
      .subscribe((resultats) => {
        if (revision !== this.revisionAbsences) return;
        this.presencesParClasseEtJour.set(resultats);
        this.erreurAbsences.set(resultats.some((resultat) => resultat.erreur));
        this.chargementAbsences.set(false);
      });
  }

  private estAbsence(statut: number): boolean {
    return statut === 1;
  }

  private estRetard(statut: number): boolean {
    return statut === 2;
  }

  private formaterDate(date: Date): string {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    return `${annee}-${mois}-${jour}`;
  }

  private formaterMois(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private joursDuMois(mois: string): string[] {
    const [annee, numeroMois] = mois.split('-').map(Number);
    if (!annee || !numeroMois) return [];
    const nombreJours = new Date(annee, numeroMois, 0).getDate();
    const aujourdHui = new Date();
    const dernierJour = annee === aujourdHui.getFullYear() && numeroMois === aujourdHui.getMonth() + 1
      ? Math.min(nombreJours, aujourdHui.getDate())
      : nombreJours;
    return Array.from({ length: dernierJour }, (_, index) =>
      this.formaterDate(new Date(annee, numeroMois - 1, index + 1))
    );
  }

  private segmentsCoordonnesAbsences(): CoordonneeGraphique[][] {
    const segments: CoordonneeGraphique[][] = [];
    let segment: CoordonneeGraphique[] = [];
    for (const point of this.coordonneesAbsences()) {
      if (point.value === null) {
        if (segment.length) segments.push(segment);
        segment = [];
      } else {
        segment.push(point);
      }
    }
    if (segment.length) segments.push(segment);
    return segments;
  }

  private creerChemin(segments: CoordonneeGraphique[][]): string {
    return segments.map((segment) => segment.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' ')).join(' ');
  }

  private creerZone(segments: CoordonneeGraphique[][]): string {
    const baseline = 220;
    return segments
      .filter((segment) => segment.length > 1)
      .map((segment) => {
        const lignes = segment.map((point) => `L${point.x},${point.y}`).join(' ');
        return `M${segment[0].x},${baseline} ${lignes} L${segment[segment.length - 1].x},${baseline} Z`;
      })
      .join(' ');
  }
}
