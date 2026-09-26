export interface AbonnementEnAttente {
  abonnementId: number;
  paiementId: number;
  ecoleNom: string;
  planNom: string;
  montant: number;
  dateSoumission: string;
  commentaire: string | null;
}
