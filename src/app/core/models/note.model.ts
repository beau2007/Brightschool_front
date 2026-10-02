export interface Matiere {
  id: string;
  nom: string;
  coefficient: number;
}

export interface Classe {
  id: string;
  nom: string;
  niveau: string;
  effectif?: number | null;
}

export interface EleveLigne {
  eleveId: string;
  nom: string;
  prenom: string;
  matricule?: string | null;
  photoUrl?: string | null;
}

export interface CelluleNote {
  valeur: number;
  noteMax: number;
  coefficient: number;
  appreciation?: string | null;
}

export interface TableauNotesData {
  classeId: string;
  classeNom: string;
  trimestre: 1 | 2 | 3;
  matieres: Matiere[];
  eleves: EleveLigne[];
  /** notes[eleveId][matiereId] = cellule */
  notes: Record<string, Record<string, CelluleNote>>;
}