import { runMigrations, type MigratableDatabase, type Migration } from '../migrations';

/** Fausse base : garde la version et la liste des requêtes exécutées. */
function fakeDatabase(initialVersion: number) {
  const executed: string[] = [];
  let version = initialVersion;
  const db: MigratableDatabase = {
    getFirstAsync: (async () => ({ user_version: version })) as MigratableDatabase['getFirstAsync'],
    execAsync: async (sql: string) => {
      executed.push(sql);
      const match = sql.match(/PRAGMA user_version = (\d+)/);
      if (match) version = Number(match[1]);
    },
    withTransactionAsync: async (task: () => Promise<void>) => task(),
  };
  return { db, executed, version: () => version };
}

const migration = (version: number, log: number[]): Migration => ({
  version,
  description: `v${version}`,
  up: async () => {
    log.push(version);
  },
});

describe('runMigrations', () => {
  it('joue toutes les migrations dans l’ordre sur une base neuve', async () => {
    const { db, version } = fakeDatabase(0);
    const played: number[] = [];

    await runMigrations(db, [migration(2, played), migration(1, played)]);

    expect(played).toEqual([1, 2]);
    expect(version()).toBe(2);
  });

  it('ne rejoue pas les migrations déjà appliquées', async () => {
    const { db } = fakeDatabase(1);
    const played: number[] = [];

    await runMigrations(db, [migration(1, played), migration(2, played)]);

    expect(played).toEqual([2]);
  });
});
