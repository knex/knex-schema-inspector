import knex, { Knex } from 'knex';
import { expect } from 'chai';
import schemaInspector from '../lib';
import { SchemaInspector } from '../lib/types/schema-inspector';

describe('sqlite', () => {
  let database: Knex;
  let inspector: SchemaInspector;

  before(() => {
    database = knex({
      client: 'sqlite3',
      connection: {
        filename: './test/db/sqlite.db',
      },
    });
    inspector = schemaInspector(database);
  });

  after(async () => {
    await database.destroy();
  });

  describe('.tables', () => {
    it('returns tables', async () => {
      expect(await inspector.tables()).to.deep.equal([
        'page_visits',
        'users',
        'teams',
      ]);
    });
  });

  describe('.tableInfo', () => {
    it('returns information for all tables', async () => {
      expect(await inspector.tableInfo()).to.deep.equal([
        {
          name: 'page_visits',
          sql:
            'CREATE TABLE page_visits (\n' +
            '  request_path varchar(100)\n' +
            ',  user_agent varchar(200)\n' +
            ',  created_at datetime\n' +
            ')',
        },
        {
          name: 'users',
          sql:
            'CREATE TABLE "users" (\n' +
            '\t"id"\tINTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n' +
            '\t"team_id"\tinteger NOT NULL,\n' +
            '\t"email"\tvarchar(100),\n' +
            '\t"password"\tvarchar(60),\n' +
            `\t"status"\tvarchar(60) DEFAULT 'active',\n` +
            '\tFOREIGN KEY("team_id") REFERENCES "teams"("id") ' +
            'ON UPDATE CASCADE ' +
            'ON DELETE CASCADE\n' +
            ')',
        },
        {
          name: 'teams',
          sql:
            'CREATE TABLE "teams" (\n' +
            '\t"id"\tINTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n' +
            '\t"uuid"\tvarchar(36) NOT NULL UNIQUE,\n' +
            '\t"name"\tvarchar(100) DEFAULT NULL,\n' +
            '\t"description"\ttext,\n' +
            '\t"credits"\tinteger,\n' +
            '\t"created_at"\tdatetime,\n' +
            '\t"activated_at"\tdate\n' +
            ')',
        },
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.tableInfo('teams')).to.deep.equal({
        name: 'teams',
        sql:
          'CREATE TABLE "teams" (\n' +
          '\t"id"\tINTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n' +
          '\t"uuid"\tvarchar(36) NOT NULL UNIQUE,\n' +
          '\t"name"\tvarchar(100) DEFAULT NULL,\n' +
          '\t"description"\ttext,\n' +
          '\t"credits"\tinteger,\n' +
          '\t"created_at"\tdatetime,\n' +
          '\t"activated_at"\tdate\n' +
          ')',
      });
    });
  });

  describe('.hasTable', () => {
    it('returns if table exists or not', async () => {
      expect(await inspector.hasTable('teams')).to.equal(true);
      expect(await inspector.hasTable('foobar')).to.equal(false);
    });
  });

  describe('.columns', () => {
    it('returns information for all tables', async () => {
      expect(await inspector.columns()).to.have.deep.members([
        { table: 'page_visits', column: 'request_path' },
        { table: 'page_visits', column: 'user_agent' },
        { table: 'page_visits', column: 'created_at' },
        { table: 'teams', column: 'id' },
        { table: 'teams', column: 'uuid' },
        { table: 'teams', column: 'name' },
        { table: 'teams', column: 'description' },
        { table: 'teams', column: 'credits' },
        { table: 'teams', column: 'created_at' },
        { table: 'teams', column: 'activated_at' },
        { table: 'users', column: 'id' },
        { table: 'users', column: 'team_id' },
        { table: 'users', column: 'email' },
        { table: 'users', column: 'password' },
        { table: 'users', column: 'status' },
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.columns('teams')).to.have.deep.members([
        { column: 'id', table: 'teams' },
        { column: 'uuid', table: 'teams' },
        { column: 'name', table: 'teams' },
        { column: 'description', table: 'teams' },
        { column: 'credits', table: 'teams' },
        { column: 'created_at', table: 'teams' },
        { column: 'activated_at', table: 'teams' },
      ]);
    });
  });

  describe('.columnInfo', () => {
    it('returns information for all columns in all tables', async () => {
      expect(await inspector.columnInfo()).to.have.deep.members([
        {
          name: 'request_path',
          table: 'page_visits',
          data_type: 'varchar',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'user_agent',
          table: 'page_visits',
          data_type: 'varchar',
          default_value: null,
          max_length: 200,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'created_at',
          table: 'page_visits',
          data_type: 'datetime',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'id',
          table: 'teams',
          data_type: 'integer',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'uuid',
          table: 'teams',
          data_type: 'varchar',
          default_value: null,
          max_length: 36,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'name',
          table: 'teams',
          data_type: 'varchar',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'description',
          table: 'teams',
          data_type: 'text',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'credits',
          table: 'teams',
          data_type: 'integer',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'created_at',
          table: 'teams',
          data_type: 'datetime',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'activated_at',
          table: 'teams',
          data_type: 'date',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'id',
          table: 'users',
          data_type: 'integer',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'team_id',
          table: 'users',
          data_type: 'integer',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: 'id',
          foreign_key_table: 'teams',
        },
        {
          name: 'email',
          table: 'users',
          data_type: 'varchar',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'password',
          table: 'users',
          data_type: 'varchar',
          default_value: null,
          max_length: 60,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'status',
          table: 'users',
          data_type: 'varchar',
          default_value: 'active',
          max_length: 60,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
      ]);
    });

    it('returns information for all columns in specific table', async () => {
      expect(await inspector.columnInfo('teams')).to.have.deep.members([
        {
          name: 'id',
          table: 'teams',
          data_type: 'integer',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'uuid',
          table: 'teams',
          data_type: 'varchar',
          default_value: null,
          max_length: 36,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'name',
          table: 'teams',
          data_type: 'varchar',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'description',
          table: 'teams',
          data_type: 'text',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'credits',
          table: 'teams',
          data_type: 'integer',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'created_at',
          table: 'teams',
          data_type: 'datetime',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
        {
          name: 'activated_at',
          table: 'teams',
          data_type: 'date',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
        },
      ]);
    });

    it('returns information for a specific column in a specific table', async () => {
      expect(await inspector.columnInfo('teams', 'uuid')).to.deep.equal({
        name: 'uuid',
        table: 'teams',
        data_type: 'varchar',
        default_value: null,
        max_length: 36,
        numeric_precision: null,
        numeric_scale: null,
        is_generated: false,
        generation_expression: null,
        is_nullable: false,
        is_unique: true,
        is_primary_key: false,
        has_auto_increment: false,
        foreign_key_column: null,
        foreign_key_table: null,
      });
    });
  });

  describe('.primary', () => {
    it('returns primary key for a table', async () => {
      expect(await inspector.primary('teams')).to.equal('id');
      expect(await inspector.primary('page_visits')).to.equal(null);
    });
  });

  describe('.foreignKeys', () => {
    it('returns foreign keys for all tables', async () => {
      expect(await inspector.foreignKeys()).to.deep.equal([
        {
          table: 'users',
          column: 'team_id',
          foreign_key_table: 'teams',
          foreign_key_column: 'id',
          constraint_name: null,
          on_delete: 'CASCADE',
          on_update: 'CASCADE',
        },
      ]);
    });

    it('filters based on table param', async () => {
      expect(await inspector.foreignKeys('teams')).to.deep.equal([]);
    });
  });
});
