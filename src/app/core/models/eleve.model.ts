export interface EleveListe {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  photoUrl: string | null;
}

export interface CreerEleveRequest {
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string | null;
  classeId: number;
  informationsMedicales: string | null;
}

export interface EnfantDuParent {
  eleveId: number;
  nom: string;
  prenom: string;
  ecoleNom: string;
  classeNom: string;
  typeLien: string;
}
