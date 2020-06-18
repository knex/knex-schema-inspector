import Knex from 'knex';
import { SchemaInspector, Table, Column } from '../types';

export default class MySQL implements SchemaInspector {
    knex: Knex;

    constructor(knex: Knex) {
        this.knex = knex;
    }

    async tables() {
        return [] as Table[];
    }

    async columns() {
        return [] as Column[];
    }
}