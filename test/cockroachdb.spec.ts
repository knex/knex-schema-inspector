import knex, { Knex } from 'knex';
import { expect } from 'chai';
import schemaInspector from '../lib';
import { SchemaInspector } from '../lib/types/schema-inspector';

describe('cockroachdb-no-search-path', () => {
  let database: Knex;
  let inspector: SchemaInspector;

  before(() => {
    database = knex({
      client: 'cockroachdb',
      connection: {
        host: '127.0.0.1',
        port: 26257,
        user: 'root',
        password: 'root',
        database: 'defaultdb',
        charset: 'utf8',
      },
    });
    inspector = schemaInspector(database);
  });

  after(async () => {
    await database.destroy();
  });

  describe('.tables', () => {
    it('returns tables', async () => {
      expect(await inspector.tables()).to.have.deep.members([
        'teams',
        'users',
        'camelCase',
        'page_visits',
      ]);
    });
  });

  describe('.tableInfo', () => {
    it('returns information for all tables', async () => {
      expect(await inspector.tableInfo()).to.have.deep.members([
        { name: 'camelCase', schema: 'public', comment: null },
        { name: 'page_visits', schema: 'public', comment: null },
        { name: 'teams', schema: 'public', comment: null },
        { name: 'users', schema: 'public', comment: null },
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.tableInfo('teams')).to.deep.equal({
        comment: null,
        name: 'teams',
        schema: 'public',
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
      database.transaction(async (trx) => {
        expect(await schemaInspector(trx).columns()).to.have.deep.members([
          { table: 'teams', column: 'id' },
          { table: 'teams', column: 'uuid' },
          { table: 'teams', column: 'credits' },
          { table: 'teams', column: 'created_at' },
          { table: 'teams', column: 'description' },
          { table: 'teams', column: 'name' },
          { table: 'teams', column: 'name_upper' },
          { table: 'teams', column: 'activated_at' },
          { table: 'users', column: 'id' },
          { table: 'users', column: 'team_id' },
          { table: 'users', column: 'email' },
          { table: 'users', column: 'password' },
          { table: 'users', column: 'status' },
          { table: 'camelCase', column: 'primaryKey' },
          { table: 'page_visits', column: 'user_agent' },
          { table: 'page_visits', column: 'request_path' },
          { table: 'page_visits', column: 'created_at' },
          { table: 'page_visits', column: 'rowid' },
        ]);
      });

      expect(await inspector.columns()).to.have.deep.members([
        { table: 'teams', column: 'id' },
        { table: 'teams', column: 'uuid' },
        { table: 'teams', column: 'name' },
        { table: 'teams', column: 'name_upper' },
        { table: 'teams', column: 'description' },
        { table: 'teams', column: 'credits' },
        { table: 'teams', column: 'created_at' },
        { table: 'teams', column: 'activated_at' },
        { table: 'users', column: 'id' },
        { table: 'users', column: 'team_id' },
        { table: 'users', column: 'email' },
        { table: 'users', column: 'password' },
        { table: 'users', column: 'status' },
        { table: 'camelCase', column: 'primaryKey' },
        { table: 'page_visits', column: 'request_path' },
        { table: 'page_visits', column: 'user_agent' },
        { table: 'page_visits', column: 'created_at' },
        { table: 'page_visits', column: 'rowid' },
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.columns('teams')).to.have.deep.members([
        { table: 'teams', column: 'id' },
        { table: 'teams', column: 'uuid' },
        { table: 'teams', column: 'name' },
        { table: 'teams', column: 'name_upper' },
        { table: 'teams', column: 'description' },
        { table: 'teams', column: 'credits' },
        { table: 'teams', column: 'created_at' },
        { table: 'teams', column: 'activated_at' },
      ]);
    });
  });

  describe('.columnInfo', () => {
    it('returns information for all columns in all tables', async () => {
      expect(await inspector.columnInfo()).to.have.deep.members([
        {
          name: 'primaryKey',
          table: 'camelCase',
          schema: 'public',
          data_type: 'bigint',
          is_nullable: false,
          generation_expression: null,
          default_value: 'unique_rowid()',
          is_generated: false,
          max_length: null,
          comment: null,
          numeric_precision: 64,
          numeric_scale: 0,
          is_unique: true,
          is_primary_key: true,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'request_path',
          table: 'page_visits',
          schema: 'public',
          data_type: 'character varying',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: 100,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'user_agent',
          table: 'page_visits',
          schema: 'public',
          data_type: 'character varying',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: 200,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'created_at',
          table: 'page_visits',
          schema: 'public',
          data_type: 'timestamp without time zone',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: null,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'rowid',
          table: 'page_visits',
          schema: 'public',
          data_type: 'bigint',
          is_nullable: false,
          generation_expression: null,
          default_value: 'unique_rowid()',
          is_generated: false,
          max_length: null,
          comment: null,
          numeric_precision: 64,
          numeric_scale: 0,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'id',
          table: 'teams',
          schema: 'public',
          data_type: 'bigint',
          is_nullable: false,
          generation_expression: null,
          default_value: 'unique_rowid()',
          is_generated: false,
          max_length: null,
          comment: null,
          numeric_precision: 64,
          numeric_scale: 0,
          is_unique: true,
          is_primary_key: true,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'uuid',
          table: 'teams',
          schema: 'public',
          data_type: 'character',
          is_nullable: false,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: 36,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'name',
          table: 'teams',
          schema: 'public',
          data_type: 'character varying',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: 100,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'name_upper',
          table: 'teams',
          schema: 'public',
          data_type: 'character varying',
          is_nullable: true,
          generation_expression: 'upper(name)',
          default_value: null,
          is_generated: true,
          max_length: 100,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'description',
          table: 'teams',
          schema: 'public',
          data_type: 'text',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: null,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'credits',
          table: 'teams',
          schema: 'public',
          data_type: 'bigint',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: null,
          comment: 'Remaining usage credits',
          numeric_precision: 64,
          numeric_scale: 0,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'created_at',
          table: 'teams',
          schema: 'public',
          data_type: 'timestamp without time zone',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: null,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'activated_at',
          table: 'teams',
          schema: 'public',
          data_type: 'date',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: null,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'id',
          table: 'users',
          schema: 'public',
          data_type: 'bigint',
          is_nullable: false,
          generation_expression: null,
          default_value: 'unique_rowid()',
          is_generated: false,
          max_length: null,
          comment: null,
          numeric_precision: 64,
          numeric_scale: 0,
          is_unique: true,
          is_primary_key: true,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'team_id',
          table: 'users',
          schema: 'public',
          data_type: 'bigint',
          is_nullable: false,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: null,
          comment: null,
          numeric_precision: 64,
          numeric_scale: 0,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: 'public',
          foreign_key_table: 'teams',
          foreign_key_column: 'id',
        },
        {
          name: 'email',
          table: 'users',
          schema: 'public',
          data_type: 'character varying',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: 100,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'password',
          table: 'users',
          schema: 'public',
          data_type: 'character varying',
          is_nullable: true,
          generation_expression: null,
          default_value: null,
          is_generated: false,
          max_length: 60,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
        {
          name: 'status',
          table: 'users',
          schema: 'public',
          data_type: 'character varying',
          is_nullable: true,
          generation_expression: null,
          default_value: 'active',
          is_generated: false,
          max_length: 60,
          comment: null,
          numeric_precision: null,
          numeric_scale: null,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_schema: null,
          foreign_key_table: null,
          foreign_key_column: null,
        },
      ]);
    });

    it('returns information for all columns in specific table', async () => {
      expect(await inspector.columnInfo('teams')).to.have.deep.members([
        {
          name: 'id',
          table: 'teams',
          data_type: 'bigint',
          default_value: 'unique_rowid()',
          max_length: null,
          numeric_precision: 64,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: true,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
        },
        {
          name: 'uuid',
          table: 'teams',
          data_type: 'character',
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
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
        },
        {
          name: 'name',
          table: 'teams',
          data_type: 'character varying',
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
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
        },
        {
          name: 'name_upper',
          table: 'teams',
          data_type: 'character varying',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: true,
          generation_expression: 'upper(name)',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
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
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
        },
        {
          name: 'credits',
          table: 'teams',
          data_type: 'bigint',
          default_value: null,
          max_length: null,
          numeric_precision: 64,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: 'Remaining usage credits',
          schema: 'public',
          foreign_key_schema: null,
        },
        {
          name: 'created_at',
          table: 'teams',
          data_type: 'timestamp without time zone',
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
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
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
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
        },
      ]);
    });

    it('returns information for a specific column in a specific table', async () => {
      expect(await inspector.columnInfo('teams', 'uuid')).to.deep.equal({
        schema: 'public',
        name: 'uuid',
        table: 'teams',
        data_type: 'character',
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
        foreign_key_schema: null,
        foreign_key_column: null,
        foreign_key_table: null,
        comment: null,
      });
    });
  });

  describe('.primary', () => {
    it('returns primary key for a table', async () => {
      expect(await inspector.primary('teams')).to.equal('id');
      expect(await inspector.primary('page_visits')).to.equal(null);
    });
  });

  describe('.transaction', () => {
    it('works with transactions transaction', async () => {
      database.transaction(async (trx) => {
        expect(await schemaInspector(trx).primary('teams')).to.equal('id');
      });
    });
  });
});

describe('cockroachdb-with-search-path', () => {
  let database: Knex;
  let inspector: SchemaInspector;

  before(() => {
    database = knex({
      searchPath: ['public', 'test'],
      client: 'cockroachdb',
      connection: {
        host: '127.0.0.1',
        port: 26257,
        user: 'root',
        password: 'root',
        database: 'defaultdb',
        charset: 'utf8',
      },
    });
    inspector = schemaInspector(database);
  });

  after(async () => {
    await database.destroy();
  });

  describe('.primary', () => {
    it('returns primary key for a table', async () => {
      expect(await inspector.primary('test')).to.equal('id');
    });
  });

  describe('.transaction', () => {
    it('works with transactions transaction', async () => {
      database.transaction(async (trx) => {
        expect(await schemaInspector(trx).primary('test')).to.equal('id');
      });
    });
  });

  describe('.foreignKeys', () => {
    it('returns foreign keys for all tables', async () => {
      expect(await inspector.foreignKeys()).to.deep.equal([
        {
          table: 'users',
          column: 'team_id',
          foreign_key_schema: 'public',
          foreign_key_table: 'teams',
          foreign_key_column: 'id',
          constraint_name: 'fk_team_id',
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
