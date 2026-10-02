export interface EleveListe {
  id: string;
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
  classeId: string;
  informationsMedicales: string | null;
}

export interface EnfantDuParent {
  eleveId: string;
  prenom: string;
  nom: string;
  ecoleNom?: string | null;
  classeNom?: string | null;
  photoUrl?: string | null;
  dateNaissance?: string | null;
  matricule?: string | null;
  sexe?: 'M' | 'F' | null;
}

export interface EleveDetail extends EnfantDuParent {
  informationsMedicales?: string | null;
  lieuNaissance?: string | null;
  adresse?: string | null;
  nomParent?: string | null;
  telephoneParent?: string | null;
  emailParent?: string | null;
  dateInscription?: string | null;
  statut?: 'actif' | 'inactif' | 'transfere' | null;
}

export interface NoteEleve {
  id: string;
  matiereId: string;
  matiere: string;
  note: number;
  noteMax: number;
  coefficient: number;
  date: string;
  trimestre: 1 | 2 | 3;
  appreciation?: string | null;
}

export interface AbsenceEleve {
  id: string;
  date: string;
  motif?: string | null;
  justifiee: boolean;
  type: 'absence' | 'retard';
}