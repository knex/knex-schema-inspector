import knex, { Knex } from 'knex';
import { expect } from 'chai';
import schemaInspector from '../lib';
import { SchemaInspector } from '../lib/types/schema-inspector';

describe('mysql', () => {
  let database: Knex;
  let inspector: SchemaInspector;

  before(() => {
    database = knex({
      client: 'mysql',
      connection: {
        host: '127.0.0.1',
        port: 5100,
        user: 'root',
        password: 'secret',
        database: 'test_db',
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
      expect(await inspector.tables()).to.deep.equal([
        'page_visits',
        'teams',
        'users',
      ]);
    });
  });

  describe('.tableInfo', () => {
    it('returns information for all tables', async () => {
      expect(await inspector.tableInfo()).to.have.deep.members([
        {
          name: 'page_visits',
          schema: 'test_db',
          comment: '',
          collation: 'latin1_swedish_ci',
          engine: 'InnoDB',
        },
        {
          name: 'teams',
          schema: 'test_db',
          comment: '',
          collation: 'latin1_swedish_ci',
          engine: 'InnoDB',
        },
        {
          name: 'users',
          schema: 'test_db',
          comment: '',
          collation: 'latin1_swedish_ci',
          engine: 'InnoDB',
        },
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.tableInfo('teams')).to.deep.equal({
        collation: 'latin1_swedish_ci',
        comment: '',
        engine: 'InnoDB',
        name: 'teams',
        schema: 'test_db',
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
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.columns('teams')).to.have.deep.members([
        { column: 'id', table: 'teams' },
        { column: 'uuid', table: 'teams' },
        { column: 'name', table: 'teams' },
        { column: 'name_upper', table: 'teams' },
        { column: 'description', table: 'teams' },
        { column: 'credits', table: 'teams' },
        { column: 'created_at', table: 'teams' },
        { column: 'activated_at', table: 'teams' },
      ]);
    });
  });

  describe('.columnInfo', () => {
    it('returns information for all columns in all tables', async () => {
      const columnInfo = await inspector.columnInfo();
      expect(columnInfo).to.have.length(16);
      expect(columnInfo).to.deep.include.members([
        {
          name: 'team_id',
          table: 'users',
          data_type: 'int',
          default_value: null,
          max_length: null,
          numeric_precision: 10,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: 'id',
          foreign_key_table: 'teams',
          comment: '',
        },
        {
          name: 'id',
          table: 'teams',
          data_type: 'int',
          default_value: null,
          max_length: null,
          numeric_precision: 10,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'uuid',
          table: 'teams',
          data_type: 'char',
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
          comment: '',
        },
        {
          name: 'id',
          table: 'users',
          data_type: 'int',
          default_value: null,
          max_length: null,
          numeric_precision: 10,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
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
          comment: '',
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
          comment: '',
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
          comment: '',
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
          comment: '',
        },
        {
          name: 'name_upper',
          table: 'teams',
          data_type: 'varchar',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: true,
          generation_expression: 'upper(`name`)',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'description',
          table: 'teams',
          data_type: 'text',
          default_value: null,
          max_length: 65535,
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
          comment: '',
        },
        {
          name: 'credits',
          table: 'teams',
          data_type: 'int',
          default_value: null,
          max_length: null,
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
          comment: '',
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
          comment: '',
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
          comment: '',
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
          comment: '',
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
          comment: '',
        },
      ]);
    });

    it('returns information for all columns in specific table', async () => {
      expect(await inspector.columnInfo('teams')).to.deep.include.members([
        {
          name: 'id',
          table: 'teams',
          data_type: 'int',
          default_value: null,
          max_length: null,
          numeric_precision: 10,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'uuid',
          table: 'teams',
          data_type: 'char',
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
          comment: '',
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
          comment: '',
        },
        {
          name: 'name_upper',
          table: 'teams',
          data_type: 'varchar',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: true,
          generation_expression: 'upper(`name`)',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'description',
          table: 'teams',
          data_type: 'text',
          default_value: null,
          max_length: 65535,
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
          comment: '',
        },
        {
          name: 'credits',
          table: 'teams',
          data_type: 'int',
          default_value: null,
          max_length: null,
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
          comment: '',
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
          comment: '',
        },
      ]);
    });

    it('returns information for a specific column in a specific table', async () => {
      expect(await inspector.columnInfo('teams', 'uuid')).to.deep.equal({
        name: 'uuid',
        table: 'teams',
        data_type: 'char',
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
        comment: '',
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
