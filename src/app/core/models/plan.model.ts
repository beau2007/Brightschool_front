export interface Plan {
  id: number;
  nom: string;
  prixMensuel: number;
  nbEleveMax: number | null;
  nbEnseignantMax: number | null;
}
