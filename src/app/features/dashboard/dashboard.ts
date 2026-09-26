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
  demo?: boolean;
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
  classeId: number;
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
  readonly apercuDonneesFictives = !environment.production;
  readonly donneesEvolutionDemo = [
    { annee: '2022', effectif: 248 },
    { annee: '2023', effectif: 276 },
    { annee: '2024', effectif: 309 },
    { annee: '2025', effectif: 337 },
    { annee: '2026', effectif: 368 }
  ];
  readonly tauxReussiteDemo = 87;
  readonly evolutionEffectifsDemo = '120 élèves de plus sur 4 ans';
  readonly variationReussiteDemo = '+4,2 pts sur la dernière année';
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
      if (this.apercuDonneesFictives) {
        return [
          { label: 'Élèves inscrits', valeur: '368', detail: 'Effectif de l’établissement', icone: 'eleves', tendance: '+ 9,2% cette année', points: [24, 32, 28, 42, 39, 58, 55, 72, 68, 90], demo: true },
          { label: 'Classes', valeur: '18', detail: 'Réparties par niveau', icone: 'classes', tendance: '+ 2 cette année', points: [30, 30, 42, 42, 55, 55, 70, 70, 84, 84], demo: true },
          { label: 'Présence moyenne', valeur: '94,2%', detail: 'Sur la période sélectionnée', icone: 'presence', tendance: '+ 2,4 pts', points: [42, 48, 46, 58, 55, 62, 68, 65, 80, 88], demo: true },
          { label: 'Absences période', valeur: String(this.totalAbsences()), detail: 'Toutes classes confondues', icone: 'absence', tendance: '− 8,1%', points: [76, 62, 68, 55, 59, 42, 48, 34, 38, 24], demo: true },
          { label: 'Taux de réussite', valeur: `${this.tauxReussiteDemo}%`, detail: 'Résultats annuels', icone: 'suivi', tendance: this.variationReussiteDemo, points: [38, 48, 45, 56, 62, 58, 70, 75, 78, 87], demo: true },
          { label: 'Retards période', valeur: String(this.totalRetards()), detail: 'Toutes classes confondues', icone: 'retard', tendance: '− 3,2%', points: [70, 58, 66, 50, 55, 42, 47, 35, 38, 30], demo: true }
        ];
      }
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
        {
          label: 'À traiter',
          valeur: String(this.abonnementsEnAttente().length),
          detail: 'Demandes de paiement en attente',
          icone: 'suivi', tendance: 'Action requise', points: [38, 42, 35, 52, 49, 61, 57, 68, 74, 82]
        },
        {
          label: 'Établissements',
          valeur: String(this.etablissementsAbonnes()),
          detail: 'Établissements concernés',
          icone: 'ecoles', tendance: 'Actifs', points: [24, 32, 28, 42, 39, 58, 55, 72, 68, 90]
        },
        {
          label: 'Offres concernées',
          valeur: String(this.plansEnAttente()),
          detail: 'Plans représentés dans les demandes',
          icone: 'plans', tendance: 'Catalogue', points: [32, 34, 38, 42, 50, 48, 62, 70, 74, 82]
        },
        { label: 'Demandes validées', valeur: '—', detail: 'Période actuelle', icone: 'presence', tendance: 'Statistique API requise', points: [24, 28, 35, 42, 44, 56, 63, 66, 78, 84] },
        { label: 'Revenus mensuels', valeur: '—', detail: 'Tous établissements', icone: 'suivi', tendance: 'Statistique API requise', points: [30, 35, 33, 48, 54, 50, 68, 72, 82, 90] },
        { label: 'Abonnements actifs', valeur: '—', detail: 'Tous plans confondus', icone: 'retard', tendance: 'Statistique API requise', points: [38, 42, 48, 46, 58, 65, 62, 74, 80, 88] }
      ];
    }
    if (this.estParent()) {
      return [
        { label: 'Mes enfants', valeur: String(this.enfants().length), detail: 'Enfants rattachés au compte', icone: 'eleves', tendance: 'Suivi actif', points: [32, 32, 44, 44, 58, 58, 74, 74, 88, 88] },
        { label: 'Classes', valeur: String(this.classesEnfants()), detail: 'Classes actuellement suivies', icone: 'classes', tendance: 'Cette année', points: [28, 34, 34, 42, 46, 54, 60, 68, 74, 82] },
        {
          label: 'Établissements',
          valeur: String(this.etablissementsDistincts()),
          detail: 'Établissements concernés',
          icone: 'ecoles', tendance: 'Suivi actif', points: [25, 35, 30, 46, 42, 58, 63, 70, 76, 88]
        },
        { label: 'Présences', valeur: this.apercuDonneesFictives ? '94,2%' : '—', detail: 'Présence moyenne des enfants', icone: 'presence', tendance: this.apercuDonneesFictives ? '+ 2,4 pts' : 'Statistique API requise', points: [42, 48, 46, 58, 55, 62, 68, 65, 80, 88], demo: this.apercuDonneesFictives },
        { label: 'Absences', valeur: this.apercuDonneesFictives ? '3' : '—', detail: 'Pour la période sélectionnée', icone: 'absence', tendance: this.apercuDonneesFictives ? 'À consulter' : 'Statistique API requise', points: [80, 68, 72, 58, 52, 46, 40, 36, 30, 24], demo: this.apercuDonneesFictives },
        { label: 'Réussite scolaire', valeur: this.apercuDonneesFictives ? `${this.tauxReussiteDemo}%` : '—', detail: 'Moyenne des enfants', icone: 'suivi', tendance: this.apercuDonneesFictives ? this.variationReussiteDemo : 'Statistique API requise', points: [38, 48, 45, 56, 62, 58, 70, 75, 78, 87], demo: this.apercuDonneesFictives }
      ];
    }

    return [
      { label: 'Élèves inscrits', valeur: String(this.totalEleves() || (this.apercuDonneesFictives ? 368 : 0)), detail: 'Effectif des classes accessibles', icone: 'eleves', tendance: this.apercuDonneesFictives ? '+ 9,2% cette année' : 'Effectif actuel', points: this.apercuDonneesFictives ? [24, 32, 28, 42, 39, 58, 55, 72, 68, 90] : [], demo: this.apercuDonneesFictives },
      { label: 'Classes', valeur: String(this.classes().length || (this.apercuDonneesFictives ? 18 : 0)), detail: 'Classes accessibles', icone: 'classes', tendance: this.apercuDonneesFictives ? '+ 2 cette année' : 'Effectif actuel', points: [30, 30, 42, 42, 55, 55, 70, 70, 84, 84], demo: this.apercuDonneesFictives && !this.classes().length },
      {
        label: 'Occupation',
        valeur: this.tauxOccupation() === null ? this.apercuDonneesFictives ? '85%' : '—' : `${this.tauxOccupation()}%`,
        detail:
          this.tauxOccupation() === null
            ? this.apercuDonneesFictives ? 'Taux de remplissage des classes' : 'Capacité non renseignée'
            : `${this.totalEleves()} élèves sur ${this.capaciteTotale()} places`,
        icone: 'suivi', tendance: this.apercuDonneesFictives ? '+ 5,8%' : 'Capacité utilisée', points: this.apercuDonneesFictives ? [42, 48, 46, 58, 55, 62, 68, 65, 80, 85] : [], demo: this.apercuDonneesFictives
      },
      { label: 'Absences période', valeur: String(this.totalAbsences()), detail: 'Toutes classes confondues', icone: 'absence', tendance: this.apercuDonneesFictives ? '− 8,1%' : 'Sur la période', points: [76, 62, 68, 55, 59, 42, 48, 34, 38, 24], demo: this.absencesEnDemo() },
      { label: 'Taux de réussite', valeur: this.apercuDonneesFictives ? `${this.tauxReussiteDemo}%` : '—', detail: 'Résultats annuels', icone: 'suivi', tendance: this.apercuDonneesFictives ? this.variationReussiteDemo : 'Statistique API requise', points: [38, 48, 45, 56, 62, 58, 70, 75, 78, 87], demo: this.apercuDonneesFictives },
      { label: 'Retards période', valeur: String(this.totalRetards()), detail: 'Toutes classes confondues', icone: 'retard', tendance: this.apercuDonneesFictives ? '− 3,2%' : 'Sur la période', points: [70, 58, 66, 50, 55, 42, 47, 35, 38, 30], demo: this.absencesEnDemo() }
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
      if (reels.some((point) => point.value !== null) || !this.apercuDonneesFictives) return reels;
      return [
        { label: 'Maternelle 1', value: 2 },
        { label: 'CP', value: 4 },
        { label: 'CE1', value: 3 },
        { label: 'CE2', value: 1 },
        { label: 'CM1', value: 5 },
        { label: 'CM2', value: 2 }
      ];
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
    if (reels.some((point) => point.value !== null) || !this.apercuDonneesFictives) return reels;

    const exemples = [2, 1, 0, 3, 2, 4, 1, 0, 2, 5, 3, 2, 1, 0, 4, 2, 3, 1, 2, 0, 3, 4, 1, 2, 0, 3, 2, 1, 4, 2, 3];
    return reels.map((point, index) => ({ ...point, value: exemples[index % exemples.length] }));
  });
  readonly aDesDonneesAbsences = computed(() => this.pointsAbsences().some((point) => point.value !== null));
  readonly absencesEnDemo = computed(() =>
    this.apercuDonneesFictives && !this.presencesParClasseEtJour().some((jour) => jour.presences.length > 0)
  );

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
    this.absencesEnDemo()
      ? this.pointsAbsences().reduce((total, point) => total + (point.value ?? 0), 0)
      : this.presencesParClasseEtJour()
      .flatMap((jour) => jour.presences)
      .filter((presence) => this.estAbsence(presence.statut)).length
  );
  readonly totalRetards = computed(() =>
    this.absencesEnDemo()
      ? 8
      : this.presencesParClasseEtJour()
      .flatMap((jour) => jour.presences)
      .filter((presence) => this.estRetard(presence.statut)).length
  );
  readonly totalEnregistrees = computed(() =>
    this.presencesParClasseEtJour().reduce((total, jour) => total + jour.presences.length, 0)
  );
  readonly journeesRenseignees = computed(() =>
    this.absencesEnDemo()
      ? this.periodeAbsences() === 'mois' ? this.pointsAbsences().length : 1
      : new Set(this.presencesParClasseEtJour().filter((jour) => !jour.erreur && jour.presences.length > 0).map((jour) => jour.date)).size
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
