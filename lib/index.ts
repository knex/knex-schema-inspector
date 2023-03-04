import { Knex } from 'knex';
import { SchemaInspectorConstructor } from './types/schema-inspector';

export function SchemaInspector(knex: Knex) {
  let constructor: SchemaInspectorConstructor;
  
  switch (knex.client.config.client) {
    case 'mysql':
    case 'mysql2':
      constructor = require('./dialects/mysql').default;
      break;
    case 'postgres':
    case 'pgnative':
      constructor = require('./dialects/postgres').default;
      break;
    case 'cockroachdb':
      constructor = require('./dialects/cockroachdb').default;
      break;
    case 'sqlite3':
    case 'better-sqlite3':
      constructor = require('./dialects/sqlite').default;
      break;
    case 'oracledb':
    case 'oracle':
      constructor = require('./dialects/oracledb').default;
      break;
    case 'mssql':
      constructor = require('./dialects/mssql').default;
      break;

    default:
      throw Error('Unsupported driver used: ' + knex.client.config.client);
  }

  return new constructor(knex);
}

export default SchemaInspector;