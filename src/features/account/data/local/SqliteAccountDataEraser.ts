import type { DatabaseProvider } from '@/core/database/openDatabase';

import type { AccountDataEraser, PublicContentChoice } from '../../domain/ports/AccountDataEraser';

/** Auteur des contenus gardés après la suppression d'un compte (affiché « Pêcheur »). */
export const DELETED_USER_ID = 'deleted-user';

/**
 * Efface les données d'une personne dans la base SQLite du téléphone, en une seule transaction (tout ou rien).
 * Les mes-prises n'ont pas de table : elles viennent des photos des spots et des messages, effacées ici.
 */
export class SqliteAccountDataEraser implements AccountDataEraser {
  constructor(private readonly getDatabase: DatabaseProvider) {}

  async erase(userId: string, publicContent: PublicContentChoice): Promise<void> {
    const db = await this.getDatabase();
    await db.withTransactionAsync(async () => {
      // Les spots à supprimer : tous les miens, ou seulement les privés si le contenu public est gardé.
      const spotFilter =
        publicContent === 'delete' ? 'owner_id = ?' : "owner_id = ? AND visibility = 'private'";
      const spotIds = `SELECT id FROM spots WHERE ${spotFilter}`;

      // Ce qui dépend de ces spots (discussion, réactions, avis), puis les spots eux-mêmes.
      await db.runAsync(
        `DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM spot_messages WHERE spot_id IN (${spotIds}))`,
        userId,
      );
      await db.runAsync(`DELETE FROM message_reactions WHERE message_id IN (SELECT id || '#post' FROM spots WHERE ${spotFilter})`, userId);
      await db.runAsync(`DELETE FROM spot_messages WHERE spot_id IN (${spotIds})`, userId);
      await db.runAsync(`DELETE FROM spot_activity_votes WHERE spot_id IN (${spotIds})`, userId);
      await db.runAsync(`DELETE FROM forecast_reliability WHERE spot_id IN (${spotIds})`, userId);
      await db.runAsync(`DELETE FROM spots WHERE ${spotFilter}`, userId);

      if (publicContent === 'delete') {
        // Mes messages sur les spots des autres.
        await db.runAsync('DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM spot_messages WHERE author_id = ?)', userId);
        await db.runAsync('DELETE FROM spot_messages WHERE author_id = ?', userId);
      } else {
        // Contenu public gardé, sans nom ni photo de profil.
        await db.runAsync(
          "UPDATE spots SET owner_id = ?, owner_name = '', owner_photo = NULL WHERE owner_id = ?",
          DELETED_USER_ID,
          userId,
        );
        await db.runAsync(
          "UPDATE spot_messages SET author_id = ?, author_name = '', author_photo = NULL WHERE author_id = ?",
          DELETED_USER_ID,
          userId,
        );
        await db.runAsync("UPDATE spot_messages SET reply_author = '' WHERE reply_to_id IN (SELECT id FROM spot_messages WHERE author_id = ?)", DELETED_USER_ID);
      }

      // Mes traces partout ailleurs.
      await db.runAsync('DELETE FROM message_reactions WHERE user_id = ?', userId);
      await db.runAsync('DELETE FROM spot_activity_votes WHERE user_id = ?', userId);
      await db.runAsync('DELETE FROM forecast_reliability WHERE user_id = ?', userId);
      await db.runAsync('DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?', userId, userId);
      await db.runAsync('DELETE FROM reports WHERE reporter_id = ?', userId);
    });
  }
}
