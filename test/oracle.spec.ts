import knex, { Knex } from 'knex';
import { expect } from 'chai';
import schemaInspector from '../lib';
import { SchemaInspector } from '../lib/types/schema-inspector';

describe('oracledb', () => {
  let database: Knex;
  let inspector: SchemaInspector;

  before(() => {
    database = knex({
      client: 'oracledb',
      connection: {
        host: '127.0.0.1',
        port: 5104,
        user: 'quill_test',
        password: 'QuillRocks!',
        database: 'xe',
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
      expect(await inspector.tables()).to.deep.members([
        'TEAMS',
        'USERS',
        'PAGE_VISITS',
      ]);
    });
  });

  describe('.tableInfo', () => {
    it('returns information for all tables', async () => {
      expect(await inspector.tableInfo()).to.deep.members([
        { name: 'TEAMS' },
        { name: 'USERS' },
        { name: 'PAGE_VISITS' },
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.tableInfo('TEAMS'.toUpperCase())).to.deep.equal({
        name: 'TEAMS',
      });
    });
  });

  describe('.hasTable', () => {
    it('returns if table exists or not', async () => {
      expect(await inspector.hasTable('TEAMS')).to.equal(true);
      expect(await inspector.hasTable('FOOBAR')).to.equal(false);
    });
  });

  describe('.columns', () => {
    it('returns information for all tables', async () => {
      expect(await inspector.columns()).to.have.deep.members([
        { table: 'TEAMS', column: 'ID' },
        { table: 'TEAMS', column: 'UUID' },
        { table: 'TEAMS', column: 'NAME' },
        { table: 'TEAMS', column: 'NAME_UPPER' },
        { table: 'TEAMS', column: 'DESCRIPTION' },
        { table: 'TEAMS', column: 'CREDITS' },
        { table: 'TEAMS', column: 'CREATED_AT' },
        { table: 'TEAMS', column: 'ACTIVATED_AT' },
        { table: 'USERS', column: 'ID' },
        { table: 'USERS', column: 'TEAM_ID' },
        { table: 'USERS', column: 'EMAIL' },
        { table: 'USERS', column: 'PASSWORD' },
        { table: 'USERS', column: 'STATUS' },
        { table: 'PAGE_VISITS', column: 'REQUEST_PATH' },
        { table: 'PAGE_VISITS', column: 'USER_AGENT' },
        { table: 'PAGE_VISITS', column: 'CREATED_AT' },
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.columns('TEAMS')).to.have.deep.members([
        { column: 'ID', table: 'TEAMS' },
        { column: 'UUID', table: 'TEAMS' },
        { column: 'NAME', table: 'TEAMS' },
        { column: 'NAME_UPPER', table: 'TEAMS' },
        { column: 'DESCRIPTION', table: 'TEAMS' },
        { column: 'CREDITS', table: 'TEAMS' },
        { column: 'CREATED_AT', table: 'TEAMS' },
        { column: 'ACTIVATED_AT', table: 'TEAMS' },
      ]);
    });
  });

  describe('.columnInfo', () => {
    it('returns information for all columns in all tables', async () => {
      expect(await inspector.columnInfo()).to.have.deep.members([
        {
          name: 'ACTIVATED_AT',
          table: 'TEAMS',
          data_type: 'DATE',
          default_value: null,
          max_length: 7,
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
        },
        {
          name: 'CREATED_AT',
          table: 'TEAMS',
          data_type: 'TIMESTAMP(0)',
          default_value: null,
          max_length: 7,
          numeric_precision: null,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
        },
        {
          name: 'CREDITS',
          table: 'TEAMS',
          data_type: 'NUMBER',
          default_value: null,
          max_length: 22,
          numeric_precision: 10,
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
        },
        {
          name: 'DESCRIPTION',
          table: 'TEAMS',
          data_type: 'CLOB',
          default_value: null,
          max_length: 4000,
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
        },
        {
          name: 'ID',
          table: 'TEAMS',
          data_type: 'NUMBER',
          default_value: null,
          max_length: 22,
          numeric_precision: 10,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: true,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
        },
        {
          name: 'NAME',
          table: 'TEAMS',
          data_type: 'VARCHAR2',
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
        },
        {
          name: 'NAME_UPPER',
          table: 'TEAMS',
          data_type: 'VARCHAR2',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: true,
          generation_expression: 'UPPER("NAME")',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
        },
        {
          name: 'UUID',
          table: 'TEAMS',
          data_type: 'CHAR',
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
        },
        {
          name: 'EMAIL',
          table: 'USERS',
          data_type: 'VARCHAR2',
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
        },
        {
          name: 'ID',
          table: 'USERS',
          data_type: 'NUMBER',
          default_value: null,
          max_length: 22,
          numeric_precision: 10,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: true,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
        },
        {
          name: 'PASSWORD',
          table: 'USERS',
          data_type: 'VARCHAR2',
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
          comment: null,
        },
        {
          name: 'TEAM_ID',
          table: 'USERS',
          data_type: 'NUMBER',
          default_value: null,
          max_length: 22,
          numeric_precision: 10,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: 'ID',
          foreign_key_table: 'TEAMS',
          comment: null,
        },
        {
          name: 'STATUS',
          table: 'USERS',
          data_type: 'VARCHAR2',
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
          comment: null,
        },
        {
          name: 'CREATED_AT',
          table: 'PAGE_VISITS',
          data_type: 'TIMESTAMP(0)',
          default_value: null,
          max_length: 7,
          numeric_precision: null,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
        },
        {
          name: 'REQUEST_PATH',
          table: 'PAGE_VISITS',
          data_type: 'VARCHAR2',
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
        },
        {
          name: 'USER_AGENT',
          table: 'PAGE_VISITS',
          data_type: 'VARCHAR2',
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
          comment: null,
        },
      ]);
    });

    it('returns information for all columns in specific table', async () => {
      expect(await inspector.columnInfo('TEAMS')).to.have.deep.members([
        {
          name: 'ACTIVATED_AT',
          table: 'TEAMS',
          data_type: 'DATE',
          default_value: null,
          max_length: 7,
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
        },
        {
          name: 'CREATED_AT',
          table: 'TEAMS',
          data_type: 'TIMESTAMP(0)',
          default_value: null,
          max_length: 7,
          numeric_precision: null,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
        },
        {
          name: 'CREDITS',
          table: 'TEAMS',
          data_type: 'NUMBER',
          default_value: null,
          max_length: 22,
          numeric_precision: 10,
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
        },
        {
          name: 'DESCRIPTION',
          table: 'TEAMS',
          data_type: 'CLOB',
          default_value: null,
          max_length: 4000,
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
        },
        {
          name: 'ID',
          table: 'TEAMS',
          data_type: 'NUMBER',
          default_value: null,
          max_length: 22,
          numeric_precision: 10,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: true,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
        },
        {
          name: 'NAME',
          table: 'TEAMS',
          data_type: 'VARCHAR2',
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
        },
        {
          name: 'NAME_UPPER',
          table: 'TEAMS',
          data_type: 'VARCHAR2',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: true,
          generation_expression: 'UPPER("NAME")',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
        },
        {
          name: 'UUID',
          table: 'TEAMS',
          data_type: 'CHAR',
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
        },
      ]);
    });

    it('returns information for a specific column in a specific table', async () => {
      expect(await inspector.columnInfo('TEAMS', 'UUID')).to.deep.equal({
        name: 'UUID',
        table: 'TEAMS',
        data_type: 'CHAR',
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
      });
    });
  });

  describe('.hasColumn', () => {
    it('returns has column', async () => {
      expect(await inspector.hasColumn('TEAMS', 'ID')).to.equal(true);
      expect(await inspector.hasColumn('PAGE_VISITS', 'INVALID')).to.equal(
        false
      );
    });
  });

  describe('.primary', () => {
    it('returns primary key for a table', async () => {
      expect(await inspector.primary('TEAMS')).to.equal('ID');
      expect(await inspector.primary('PAGE_VISITS')).to.equal(null);
    });
  });

  describe('.foreignKeys', () => {
    it('returns foreign keys for all tables', async () => {
      expect(await inspector.foreignKeys()).to.deep.equal([
        {
          table: 'USERS',
          column: 'TEAM_ID',
          foreign_key_table: 'TEAMS',
          foreign_key_column: 'ID',
          constraint_name: 'FK_TEAM_ID',
          on_delete: 'CASCADE',
          on_update: null,
        },
      ]);
    });

    it('filters based on table param', async () => {
      expect(await inspector.foreignKeys('teams')).to.deep.equal([]);
    });
  });
});
