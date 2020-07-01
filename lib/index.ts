import Knex from 'knex';
import { SchemaInspectorConstructor } from './types/schema-inspector';

export default function SchemaInspector(knex: Knex) {
  let constructor: SchemaInspectorConstructor;

  switch (knex.client.constructor.name) {
    case 'Client_MySQL':
      constructor = require('./dialects/mysql').default;
      break;
    case 'Client_PG':
      constructor = require('./dialects/postgres').default;
      break;
    default:
      throw Error('Unsupported driver used: ' + knex.client.constructor.name);
  }

  return new constructor(knex);
}
