/** Contrat : « fabrique-moi un identifiant unique ». Injecté pour pouvoir le figer dans les tests. */
export interface IdGenerator {
  next(): string;
}

/** Identifiant aléatoire suffisant pour des données locales (horodatage + hasard). */
export class RandomIdGenerator implements IdGenerator {
  next(): string {
    return `spot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
