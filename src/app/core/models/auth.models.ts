export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface RoleScope {
  roleNom: string;
  ecoleId: string | null;
  ecoleNom: string | null;
  classeId: string | null;
}

export interface UtilisateurProfil {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  roles: RoleScope[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expirationAccessToken: string; // ISO date string
  profil: UtilisateurProfil;
}

export interface ApiErreur {
  code: string;
  message: string;
}
