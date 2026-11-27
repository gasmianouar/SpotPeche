# Serveur Spot — Supabase

L'app a deux modes, choisis par le fichier `.env.local` :

| Mode | Quand | Ce qui se passe |
|---|---|---|
| **Local** | `EXPO_PUBLIC_SUPABASE_URL` vide | Tout reste sur le téléphone (SQLite), connexion simulée. Idéal pour développer et faire des démos. |
| **Serveur** | URL + clé publiable remplies | Vraie connexion Google / Apple / Facebook, spots publics partagés, discussions, réactions, votes d'activité, blocages et signalements sur le serveur, suppression complète du compte. |

Le choix se fait à un seul endroit : `src/core/di/container.ts`.

## Ce qui est dans le dossier `supabase/`

- `migrations/20261127180000_spot_backend.sql` : toute la base. Tables `profiles`, `spots`, `spot_messages`, `message_reactions`, `spot_activity_votes`, `user_blocks`, `reports`, le stockage privé des photos `spot-photos`, et la sécurité :
  - **RLS sur toutes les tables** : on ne lit que ses spots et les spots publics (sauf ceux des personnes qu'on a bloquées). Un visiteur non connecté ne lit rien.
  - **Créateur et auteur remplis par le serveur** : impossible d'écrire au nom de quelqu'un d'autre, ni de modifier le spot d'un autre (on peut seulement y ajouter des espèces/appâts, via la fonction `add_spot_items`).
  - **Anti-spam** : 30 spots, 60 messages, 20 signalements par heure et par personne.
  - **Blocage** : une personne bloquée ne peut plus écrire sous vos spots ni répondre à vos messages.
  - **Photos privées** : chaque personne écrit seulement dans son dossier ; l'app lit avec des liens signés valables 1 h. Les photos sont réencodées sur le téléphone avant l'envoi, ce qui **retire la position GPS cachée (EXIF)**.
- `functions/delete-account/` : fonction serveur qui supprime le compte (RGPD) — données, photos, puis le compte lui-même. Les contenus publics sont supprimés ou anonymisés selon le choix de la personne.
- `tests/` : 25 tests de sécurité sur un **vrai Postgres** (PGlite, sans Docker) : `npm run test:db`.

## Mise en route (≈ 20 minutes, gratuit)

1. **Créer le projet** sur <https://supabase.com/dashboard> → *New project*, région **Europe (Frankfurt ou Paris)**, plan *Free*. Notez le mot de passe de la base.
2. **Envoyer la base** (depuis `D:\Workspaces\spot`) :
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-du-projet>
   npx supabase db push
   ```
3. **Déployer la fonction de suppression de compte** :
   ```bash
   npx supabase functions deploy delete-account
   ```
4. **Connexion** : *Authentication → URL Configuration* → ajoutez `spotpeche://**` dans *Redirect URLs*. Puis *Authentication → Providers* : activez Google (et plus tard Apple, Facebook) avec les identifiants créés chez chaque fournisseur. L'adresse de retour à donner aux fournisseurs est `https://<ref-du-projet>.supabase.co/auth/v1/callback`.
5. **Brancher l'app** : *Project Settings → API Keys* → copiez l'URL du projet et la **clé publiable** (`sb_publishable_…`) dans `.env.local` :
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<ref-du-projet>.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   ⚠️ **Jamais** la clé secrète / `service_role` dans l'app ou dans Git : elle contourne toute la sécurité.
6. **Reconstruire l'app de développement** (nouveaux modules natifs) : `npx expo run:android`.

## Modération

Les signalements arrivent dans la table `reports` (statut `open`). Pour l'instant on les traite depuis le tableau de bord Supabase (*Table Editor → reports*) : supprimer le message ou le spot visé, puis passer le statut à `resolved`. Un écran de modération pourra venir plus tard.

## Limites connues

- **Hors connexion** : en mode serveur, les spots et discussions demandent du réseau (la météo et la reconnaissance des espèces restent sur le téléphone). Prochaine étape : une file de synchronisation (ou PowerSync) pour retrouver le hors connexion.
- **Temps réel** : les tables sont publiées pour Supabase Realtime, mais l'app recharge encore les discussions à l'ouverture ; l'abonnement en direct est une amélioration suivante.
- **Coût** : 0 € sur le plan gratuit pendant le développement (le projet se met en pause après 7 jours sans activité) ; prévoir le plan Pro (~25 $/mois) au lancement public.
