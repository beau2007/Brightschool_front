export interface Classe {
  id: string;
  nom: string;
  niveau: string;
  enseignantPrincipalNomComplet: string | null;
  effectifActuel: number;
  effectifMax: number | null;
}

export interface CreerClasseRequest {
  nom: string;
  niveauId: string;
  enseignantPrincipalId: string | null;
  effectifMax: number | null;
}
