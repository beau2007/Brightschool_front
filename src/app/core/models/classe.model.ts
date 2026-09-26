export interface Classe {
  id: number;
  nom: string;
  niveau: string;
  enseignantPrincipalNomComplet: string | null;
  effectifActuel: number;
  effectifMax: number | null;
}

export interface CreerClasseRequest {
  nom: string;
  niveauId: number;
  enseignantPrincipalId: number | null;
  effectifMax: number | null;
}
