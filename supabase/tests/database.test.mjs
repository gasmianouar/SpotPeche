// Tests des règles de sécurité de la base Spot, sur un vrai PostgreSQL (PGlite, sans Docker).
// Lancer : npm run test:db
//
// Chaque test joue le rôle d'un utilisateur connecté (rôle « authenticated » + son identifiant),
// exactement comme une requête de l'app avec la clé publique et le jeton de session.

import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'migrations');

const KARIM = '00000000-0000-4000-8000-000000000001';
const LEA = '00000000-0000-4000-8000-000000000002';
const TROLL = '00000000-0000-4000-8000-000000000003';

let db;

/** Exécute `fn` en tant qu'utilisateur connecté (ou visiteur anonyme si userId est null). */
async function as(userId, fn) {
  await db.exec(userId ? 'set role authenticated' : 'set role anon');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? '']);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

const rows = async (sql, params) => (await db.query(sql, params)).rows;

async function spot(id, visibility, extra = {}) {
  await db.query(
    `insert into public.spots (id, name, latitude, longitude, visibility, description, photos)
     values ($1, $1, 48.78, 2.44, $2, $3, $4)`,
    [id, visibility, extra.description ?? '', extra.photos ?? []],
  );
}

before(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(here, 'supabaseShim.sql'), 'utf8'));
  for (const file of readdirSync(migrationsDir).sort()) {
    await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  }
  // Trois comptes : le trigger crée leur profil avec le nom donné par le fournisseur.
  for (const [id, name] of [
    [KARIM, 'Karim B.'],
    [LEA, 'Léa M.'],
    [TROLL, 'Troll'],
  ]) {
    await db.query('insert into auth.users (id, raw_user_meta_data) values ($1, $2)', [id, { full_name: name }]);
  }
});

after(async () => {
  await db?.close();
});

beforeEach(async () => {
  await db.exec(`
    truncate public.spots, public.spot_messages, public.message_reactions, public.spot_activity_votes,
      public.user_blocks, public.reports cascade;
    delete from storage.objects;
  `);
});

describe('Profils', () => {
  it('sont créés à l’inscription avec le nom du fournisseur', async () => {
    const [p] = await rows('select display_name from public.profiles where id = $1', [KARIM]);
    assert.equal(p.display_name, 'Karim B.');
  });
});

describe('Visiteur non connecté (clé publique seule)', () => {
  it('ne lit rien du tout', async () => {
    await as(KARIM, () => spot('s1', 'public'));
    await as(null, async () => {
      await assert.rejects(rows('select * from public.spots'), /permission denied/);
      await assert.rejects(rows('select * from public.profiles'), /permission denied/);
    });
  });
});

describe('Spots privés et publics', () => {
  it('un spot privé n’est visible que par son créateur', async () => {
    await as(KARIM, async () => {
      await spot('prive', 'private');
      await spot('public', 'public');
    });
    const ids = async (user) => (await as(user, () => rows('select id from public.spots order by id'))).map((r) => r.id);
    assert.deepEqual(await ids(KARIM), ['prive', 'public']);
    assert.deepEqual(await ids(LEA), ['public']);
  });

  it('le créateur et son nom sont remplis par le serveur (impossible d’usurper)', async () => {
    await as(LEA, () =>
      db.query(
        `insert into public.spots (id, name, latitude, longitude, owner_id, owner_name)
         values ('faux', 'x', 1, 1, $1, 'Karim B.')`,
        [KARIM],
      ),
    );
    const [s] = await rows("select owner_id, owner_name from public.spots where id = 'faux'");
    assert.equal(s.owner_id, LEA);
    assert.equal(s.owner_name, 'Léa M.');
  });

  it('on ne peut ni modifier ni supprimer le spot d’un autre', async () => {
    await as(KARIM, () => spot('s1', 'public', { description: 'original' }));
    await as(LEA, async () => {
      await db.query("update public.spots set description = 'piraté' where id = 's1'");
      await db.query("delete from public.spots where id = 's1'");
    });
    const [s] = await rows("select description from public.spots where id = 's1'");
    assert.equal(s.description, 'original');
  });

  it('le créateur peut passer son spot en public, sans pouvoir changer de propriétaire', async () => {
    await as(KARIM, async () => {
      await spot('s1', 'private');
      await db.query("update public.spots set visibility = 'public', owner_id = $1 where id = 's1'", [LEA]);
    });
    const [s] = await rows("select visibility, owner_id from public.spots where id = 's1'");
    assert.equal(s.visibility, 'public');
    assert.equal(s.owner_id, KARIM);
  });

  it('refuse une date de création dans le futur', async () => {
    await as(KARIM, () =>
      db.query(
        "insert into public.spots (id, latitude, longitude, created_at) values ('futur', 1, 1, now() + interval '10 days')",
      ),
    );
    const [s] = await rows("select created_at <= now() as ok from public.spots where id = 'futur'");
    assert.equal(s.ok, true);
  });

  it('limite le nombre de spots créés par heure (anti-spam)', async () => {
    await as(TROLL, async () => {
      for (let i = 0; i < 30; i++) await spot(`spam-${i}`, 'public');
      await assert.rejects(spot('spam-30', 'public'), /Trop d'actions/);
    });
  });
});

describe('Compléter un spot (espèces, appâts)', () => {
  it('un autre pêcheur peut ajouter sur un spot public, sans rien effacer', async () => {
    await as(KARIM, () =>
      db.query("insert into public.spots (id, latitude, longitude, visibility, species_ids) values ('s1', 1, 1, 'public', '{brochet}')"),
    );
    const [s] = await as(LEA, () => rows("select species_ids from public.add_spot_items('s1', '{perche,brochet}', '{}')"));
    assert.deepEqual([...s.species_ids].sort(), ['brochet', 'perche']);
  });

  it('mais pas sur un spot privé, ni avec des valeurs inventées', async () => {
    await as(KARIM, async () => {
      await spot('prive', 'private');
      await spot('public', 'public');
    });
    await as(LEA, async () => {
      await assert.rejects(rows("select public.add_spot_items('prive', '{perche}', '{}')"), /Spot introuvable/);
      await assert.rejects(rows(`select public.add_spot_items('public', '{"<script>"}', '{}')`), /Élément inconnu/);
    });
  });
});

describe('Discussion', () => {
  beforeEach(async () => {
    await as(KARIM, async () => {
      await spot('s1', 'public', { description: 'Ponton en bois accessible à pied' });
      await spot('prive', 'private');
    });
  });

  it('l’auteur et la citation sont remplis par le serveur', async () => {
    await as(LEA, () =>
      db.query(
        `insert into public.spot_messages (id, spot_id, text, author_name, reply_to_id, reply_author, reply_excerpt)
         values ('m1', 's1', 'Merci !', 'Faux nom', 's1#post', 'X', 'texte inventé')`,
      ),
    );
    const [m] = await rows("select author_id, author_name, reply_author, reply_excerpt from public.spot_messages where id = 'm1'");
    assert.equal(m.author_id, LEA);
    assert.equal(m.author_name, 'Léa M.');
    assert.equal(m.reply_author, 'Karim B.');
    assert.equal(m.reply_excerpt, 'Ponton en bois accessible à pied');
  });

  it('impossible d’écrire ou de lire sur le spot privé d’un autre', async () => {
    await as(KARIM, () => db.query("insert into public.spot_messages (id, spot_id, text) values ('mp', 'prive', 'note')"));
    await as(LEA, async () => {
      await assert.rejects(
        db.query("insert into public.spot_messages (id, spot_id, text) values ('m2', 'prive', 'coucou')"),
        /row-level security/,
      );
      assert.deepEqual(await rows("select id from public.spot_messages where spot_id = 'prive'"), []);
    });
  });

  it('réactions et avis seulement sur un spot visible, un seul par personne', async () => {
    await as(LEA, async () => {
      await db.query("insert into public.message_reactions (message_id, emoji) values ('s1#post', '❤️')");
      await db.query("insert into public.spot_activity_votes (spot_id, activity) values ('s1', 'good')");
      await assert.rejects(
        db.query("insert into public.spot_activity_votes (spot_id, activity) values ('prive', 'good')"),
        /row-level security/,
      );
      await assert.rejects(
        db.query("insert into public.message_reactions (message_id, emoji) values ('s1#post', '🎣')"),
        /duplicate key/,
      );
    });
  });
});

describe('Blocage', () => {
  beforeEach(async () => {
    await as(TROLL, () => spot('spot-troll', 'public'));
    await as(KARIM, () => spot('s1', 'public'));
    await as(TROLL, () => db.query("insert into public.spot_messages (id, spot_id, text) values ('mt', 's1', 'spam')"));
    await as(KARIM, () => db.query('insert into public.user_blocks (blocked_id, blocked_name) values ($1, $2)', [TROLL, 'Troll']));
  });

  it('les spots et messages de la personne bloquée me sont masqués', async () => {
    await as(KARIM, async () => {
      assert.deepEqual((await rows('select id from public.spots order by id')).map((r) => r.id), ['s1']);
      assert.deepEqual(await rows("select id from public.spot_messages where spot_id = 's1'"), []);
    });
    // … mais pas aux autres.
    await as(LEA, async () => {
      assert.equal((await rows("select id from public.spot_messages where spot_id = 's1'")).length, 1);
    });
  });

  it('la personne bloquée ne peut plus écrire sur mes spots, ni les compléter', async () => {
    await as(TROLL, async () => {
      await assert.rejects(
        db.query("insert into public.spot_messages (id, spot_id, text) values ('mt2', 's1', 'encore')"),
        /row-level security/,
      );
      await assert.rejects(rows("select public.add_spot_items('s1', '{perche}', '{}')"), /Action impossible/);
    });
  });

  it('la personne bloquée ne peut plus répondre à mes messages, même sur le spot d’un autre', async () => {
    await as(LEA, () => spot('spot-lea', 'public'));
    await as(KARIM, () => db.query("insert into public.spot_messages (id, spot_id, text) values ('mk', 'spot-lea', 'Salut')"));
    await as(TROLL, async () => {
      await assert.rejects(
        db.query("insert into public.spot_messages (id, spot_id, text, reply_to_id) values ('mt3', 'spot-lea', 'hé', 'mk')"),
        /row-level security/,
      );
      // Sans citer Karim, il peut toujours écrire sur le spot de Léa.
      await db.query("insert into public.spot_messages (id, spot_id, text) values ('mt4', 'spot-lea', 'bonjour')");
    });
  });

  it('personne ne voit les blocages des autres', async () => {
    await as(TROLL, async () => {
      assert.deepEqual(await rows('select * from public.user_blocks'), []);
    });
  });

  it('on ne peut pas se bloquer soi-même', async () => {
    await as(LEA, async () => {
      await assert.rejects(db.query('insert into public.user_blocks (blocked_id) values ($1)', [LEA]), /check constraint/);
    });
  });
});

describe('Signalements', () => {
  it('on peut signaler, relire les siens, jamais ceux des autres ni les modifier', async () => {
    await as(KARIM, () => spot('s1', 'public'));
    await as(LEA, () =>
      db.query(
        "insert into public.reports (id, target_kind, spot_id, reason, status) values ('r1', 'spot', 's1', 'forbidden', 'dismissed')",
      ),
    );
    const [r] = await rows("select reporter_id, status from public.reports where id = 'r1'");
    assert.equal(r.reporter_id, LEA);
    assert.equal(r.status, 'open');
    await as(KARIM, async () => {
      assert.deepEqual(await rows('select * from public.reports'), []);
    });
    await as(LEA, async () => {
      await assert.rejects(db.query("update public.reports set status = 'dismissed'"), /permission denied/);
    });
  });

  it('« Autre raison » exige une précision', async () => {
    await as(LEA, async () => {
      await assert.rejects(
        db.query("insert into public.reports (id, target_kind, spot_id, reason) values ('r2', 'spot', 's1', 'other')"),
        /check constraint/,
      );
    });
  });
});

describe('Photos (stockage)', () => {
  it('on n’envoie que dans son dossier, et on ne lit que les photos des spots visibles', async () => {
    await as(KARIM, async () => {
      await db.query("insert into storage.objects (bucket_id, name) values ('spot-photos', $1)", [`${KARIM}/a.jpg`]);
      await db.query("insert into storage.objects (bucket_id, name) values ('spot-photos', $1)", [`${KARIM}/b.jpg`]);
      await spot('public', 'public', { photos: [`${KARIM}/a.jpg`] });
      await spot('prive', 'private', { photos: [`${KARIM}/b.jpg`] });
    });
    await as(LEA, async () => {
      await assert.rejects(
        db.query("insert into storage.objects (bucket_id, name) values ('spot-photos', $1)", [`${KARIM}/c.jpg`]),
        /row-level security/,
      );
      assert.deepEqual((await rows('select name from storage.objects')).map((r) => r.name), [`${KARIM}/a.jpg`]);
    });
  });
});

describe('Suppression du compte (delete_my_data)', () => {
  beforeEach(async () => {
    await as(KARIM, async () => {
      await spot('k-public', 'public', { photos: [`${KARIM}/pub.jpg`] });
      await spot('k-prive', 'private', { photos: [`${KARIM}/priv.jpg`] });
      await db.query("insert into public.spot_activity_votes (spot_id, activity) values ('k-public', 'good')");
    });
    await as(LEA, async () => {
      await spot('l1', 'public');
      await db.query("insert into public.spot_messages (id, spot_id, text) values ('lm', 'k-public', 'Merci')");
    });
    await as(KARIM, async () => {
      await db.query("insert into public.spot_messages (id, spot_id, text) values ('km', 'l1', 'Top spot')");
      await db.query('insert into public.user_blocks (blocked_id) values ($1)', [TROLL]);
    });
  });

  it('« tout supprimer » efface mes spots, mes messages, mes traces, et renvoie les photos à effacer', async () => {
    const [{ photos }] = await as(KARIM, () => rows("select public.delete_my_data('delete') as photos"));
    assert.deepEqual([...photos].sort(), [`${KARIM}/priv.jpg`, `${KARIM}/pub.jpg`]);
    assert.deepEqual(await rows("select id from public.spots where id like 'k-%'"), []);
    assert.deepEqual(await rows("select id from public.spot_messages where id in ('km', 'lm')"), []);
    assert.deepEqual(await rows('select * from public.spot_activity_votes'), []);
    assert.deepEqual(await rows('select * from public.user_blocks'), []);
    // Le spot de Léa est intact.
    assert.equal((await rows("select id from public.spots where id = 'l1'")).length, 1);
  });

  it('« garder anonyme » garde mes spots publics et mes messages, sans mon nom', async () => {
    const [{ photos }] = await as(KARIM, () => rows("select public.delete_my_data('anonymize') as photos"));
    assert.deepEqual([...photos], [`${KARIM}/priv.jpg`]);
    const [s] = await rows("select owner_name from public.spots where id = 'k-public'");
    assert.equal(s.owner_name, '');
    assert.deepEqual(await rows("select id from public.spots where id = 'k-prive'"), []);
    const [m] = await rows("select author_name from public.spot_messages where id = 'km'");
    assert.equal(m.author_name, '');
  });

  it('supprimer ensuite le compte Auth détache le contenu gardé', async () => {
    await as(KARIM, () => rows("select public.delete_my_data('anonymize')"));
    await db.query('delete from auth.users where id = $1', [KARIM]);
    const [s] = await rows("select owner_id from public.spots where id = 'k-public'");
    assert.equal(s.owner_id, null);
    const [m] = await rows("select author_id from public.spot_messages where id = 'km'");
    assert.equal(m.author_id, null);
    // On remet Karim pour les autres tests.
    await db.query('insert into auth.users (id, raw_user_meta_data) values ($1, $2)', [KARIM, { full_name: 'Karim B.' }]);
  });

  it('refuse sans être connecté', async () => {
    await as(null, async () => {
      await assert.rejects(rows("select public.delete_my_data('delete')"), /permission denied/);
    });
  });
});
