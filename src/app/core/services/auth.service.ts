import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, UtilisateurProfil } from '../models/auth.models';

const CLE_ACCESS_TOKEN = 'bs_access_token';
const CLE_REFRESH_TOKEN = 'bs_refresh_token';
const CLE_PROFIL = 'bs_profil';

// ⚠️ Compromis MVP : localStorage est accessible en JS, donc vulnérable en cas de
// faille XSS ailleurs dans l'appli (un script injecté pourrait lire ces clés).
// Migration recommandée avant la mise en prod réelle : access token en mémoire
// (variable, perdu au refresh — géré par le refresh silencieux au démarrage) et
// refresh token dans un cookie httpOnly posé par le backend (donc invisible en JS).
// Nécessite alors que le backend renvoie le refresh token via Set-Cookie plutôt
// que dans le corps JSON — changement à faire aussi côté AuthController.

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signal privé, exposé en lecture seule — le reste de l'appli ne peut pas
  // muter l'état d'auth directement, seulement via login()/logout().
  private readonly _profil = signal<UtilisateurProfil | null>(this.chargerProfilStocke());

  readonly profil = this._profil.asReadonly();
  readonly estConnecte = computed(() => this._profil() !== null);

  constructor(private http: HttpClient, private router: Router) {}

  login(dto: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, dto).pipe(
      tap((reponse) => this.stockerSession(reponse))
    );
  }

  logout(): void {
    // Best-effort : on prévient le backend mais on ne bloque pas la déconnexion
    // locale si la requête échoue (token déjà expiré, pas de réseau, etc.).
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    this.effacerSession();
    this.router.navigate(['/connexion']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(CLE_ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(CLE_REFRESH_TOKEN);
  }

  rafraichirToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(tap((reponse) => this.stockerSession(reponse)));
  }

  aLeRole(role: string): boolean {
    return this._profil()?.roles.some((r) => r.roleNom === role) ?? false;
  }

  /// Détermine où rediriger après connexion, selon le premier rôle du profil.
  /// À affiner si un utilisateur cumule plusieurs rôles distincts (rare en pratique).
  routeApresConnexion(): string {
    if (this.aLeRole('AdminPlateforme')) return '/admin/abonnements';
    if (this.aLeRole('Directeur') || this.aLeRole('Enseignant')) return '/dashboard';
    if (this.aLeRole('Parent')) return '/mes-enfants';
    return '/connexion';
  }

  private stockerSession(reponse: LoginResponse): void {
    localStorage.setItem(CLE_ACCESS_TOKEN, reponse.accessToken);
    localStorage.setItem(CLE_REFRESH_TOKEN, reponse.refreshToken);
    localStorage.setItem(CLE_PROFIL, JSON.stringify(reponse.profil));
    this._profil.set(reponse.profil);
  }

  private effacerSession(): void {
    localStorage.removeItem(CLE_ACCESS_TOKEN);
    localStorage.removeItem(CLE_REFRESH_TOKEN);
    localStorage.removeItem(CLE_PROFIL);
    this._profil.set(null);
  }

  private chargerProfilStocke(): UtilisateurProfil | null {
    const brut = localStorage.getItem(CLE_PROFIL);
    return brut ? (JSON.parse(brut) as UtilisateurProfil) : null;
  }
}
