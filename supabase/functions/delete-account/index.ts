// Fonction serveur « delete-account » : suppression définitive du compte de l'utilisateur connecté.
//
//   1. efface ses données dans la base (fonction SQL delete_my_data, avec les règles de sécurité) ;
//   2. supprime ses photos du stockage ;
//   3. supprime son compte de connexion (Supabase Auth).
//
// Appel depuis l'app : supabase.functions.invoke('delete-account', { body: { publicContent: 'delete' | 'anonymize' } })
// Déploiement : supabase functions deploy delete-account
import { withSupabase } from 'npm:@supabase/server@1';

const BUCKET = 'spot-photos';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });

    const userId = ctx.userClaims?.id;
    if (!userId) return Response.json({ error: 'not_authenticated' }, { status: 401 });

    let publicContent: unknown;
    try {
      publicContent = (await req.json())?.publicContent;
    } catch {
      return Response.json({ error: 'invalid_body' }, { status: 400 });
    }
    if (publicContent !== 'delete' && publicContent !== 'anonymize') {
      return Response.json({ error: 'invalid_public_content' }, { status: 400 });
    }

    // 1. Données : appelée EN TANT QUE l'utilisateur (auth.uid() = lui), jamais pour quelqu'un d'autre.
    const { data: photoPaths, error: eraseError } = await ctx.supabase.rpc('delete_my_data', {
      p_public_content: publicContent,
    });
    if (eraseError) {
      console.error('delete_my_data', eraseError);
      return Response.json({ error: 'erase_failed' }, { status: 500 });
    }

    // 2. Photos : le client administrateur contourne les règles, on ne touche donc qu'aux chemins renvoyés
    //    par delete_my_data (photos de ses spots et messages supprimés).
    const paths = Array.isArray(photoPaths) ? (photoPaths as string[]) : [];
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await ctx.supabaseAdmin.storage.from(BUCKET).remove(paths.slice(i, i + 100));
      if (error) console.error('storage.remove', error);
    }
    // Les autres fichiers de son dossier qui ne sont plus utilisés nulle part (envois abandonnés).
    const { data: leftovers } = await ctx.supabaseAdmin.storage.from(BUCKET).list(userId, { limit: 1000 });
    if (publicContent === 'delete' && leftovers?.length) {
      await ctx.supabaseAdmin.storage.from(BUCKET).remove(leftovers.map((f: { name: string }) => `${userId}/${f.name}`));
    }

    // 3. Compte de connexion : son profil part avec lui ; le contenu gardé anonyme est détaché (owner_id = null).
    const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('auth.admin.deleteUser', deleteError);
      return Response.json({ error: 'delete_user_failed' }, { status: 500 });
    }

    return Response.json({ deleted: true });
  }),
};
