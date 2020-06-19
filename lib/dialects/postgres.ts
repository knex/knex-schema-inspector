import Knex from 'knex';
import { SchemaInspector } from '../types/schema-inspector';

export default class Postgres implements SchemaInspector {
  knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async tables() {
    return [];
  }

  async columns(table: string) {
    return [];
  }
}
