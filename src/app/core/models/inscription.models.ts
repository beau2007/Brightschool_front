export enum ModePaiement {
  Stripe = 0,
  Especes = 1,
  Virement = 2
}

// ⚠️ Ces valeurs numériques suivent l'ordre de l'enum C# ModePaiement (Stripe=0,
// Especes=1, Virement=2). Si tu configures un jour JsonStringEnumConverter côté
// .NET (recommandé — contrat API plus lisible que des nombres magiques), il faudra
// changer ces valeurs pour les chaînes correspondantes ('Stripe', 'Especes', 'Virement').

export interface InscrireEcoleRequest {
  nomEcole: string;
  emailDirecteur: string;
  nomDirecteur: string;
  prenomDirecteur: string;
  motDePasse: string;
  planId: number;
  modePaiement: ModePaiement;
}

export interface AbonnementReponse {
  id: number;
  ecoleNom: string;
  planNom: string;
  statut: string;
  modePaiement: string;
  dateDebut: string;
  dateFin: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}
