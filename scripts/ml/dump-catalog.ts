/**
 * Imprime le catalogue des espèces de l'app en JSON [{id, latinName, members?}], pour les scripts Python.
 *   npx tsx scripts/ml/dump-catalog.ts > .tmp/ml/catalog.json
 */
import { SPECIES_CATALOG } from '../../src/features/spots/domain/entities/Catalog';

process.stdout.write(JSON.stringify(SPECIES_CATALOG.map(({ id, latinName, members }) => ({ id, latinName, members }))));
