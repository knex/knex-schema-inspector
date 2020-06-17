import Knex from 'knex';

export default class SchemaInspector {
    knex: Knex;

    constructor(knexInstance: Knex) {
        this.knex = knexInstance;
    }
}