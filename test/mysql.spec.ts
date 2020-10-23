import Knex from 'knex';
import schemaInspector from '../lib';
import { SchemaInspector } from '../lib/types/schema-inspector';

describe('mysql', () => {
  let database: Knex;
  let inspector: SchemaInspector;

  beforeAll(() => {
    database = Knex({
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

  afterAll(async () => {
    await database.destroy();
  });

  describe('.tables', () => {
    it('returns tables', async () => {
      expect(await inspector.tables()).toEqual([
        'page_visits',
        'teams',
        'users',
      ]);
    });
  });

  describe('.tableInfo', () => {
    it('returns information for all tables', async () => {
      expect(await inspector.tableInfo()).toEqual([
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
      expect(await inspector.tableInfo('teams')).toEqual({
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
      expect(await inspector.hasTable('teams')).toEqual(true);
      expect(await inspector.hasTable('foobar')).toEqual(false);
    });
  });

  describe('.columns', () => {
    it('returns information for all tables', async () => {
      expect(await inspector.columns()).toEqual([
        { table: 'page_visits', column: 'request_path' },
        { table: 'page_visits', column: 'user_agent' },
        { table: 'page_visits', column: 'created_at' },
        { table: 'teams', column: 'id' },
        { table: 'teams', column: 'name' },
        { table: 'teams', column: 'description' },
        { table: 'teams', column: 'credits' },
        { table: 'teams', column: 'created_at' },
        { table: 'teams', column: 'activated_at' },
        { table: 'users', column: 'id' },
        { table: 'users', column: 'team_id' },
        { table: 'users', column: 'email' },
        { table: 'users', column: 'password' },
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.columns('teams')).toEqual([
        { column: 'id', table: 'teams' },
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
      expect(await inspector.columnInfo()).toEqual([
        {
          name: 'team_id',
          table: 'users',
          type: 'int',
          default_value: null,
          max_length: null,
          is_nullable: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: 'id',
          foreign_key_table: 'teams',
          comment: '',
        },
        {
          name: 'id',
          table: 'teams',
          type: 'int',
          default_value: null,
          max_length: null,
          is_nullable: false,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'id',
          table: 'users',
          type: 'int',
          default_value: null,
          max_length: null,
          is_nullable: false,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'request_path',
          table: 'page_visits',
          type: 'varchar',
          default_value: null,
          max_length: 100,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'user_agent',
          table: 'page_visits',
          type: 'varchar',
          default_value: null,
          max_length: 200,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'created_at',
          table: 'page_visits',
          type: 'datetime',
          default_value: null,
          max_length: null,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'name',
          table: 'teams',
          type: 'varchar',
          default_value: null,
          max_length: 100,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'description',
          table: 'teams',
          type: 'text',
          default_value: null,
          max_length: 65535,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'credits',
          table: 'teams',
          type: 'int',
          default_value: null,
          max_length: null,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: 'Remaining usage credits',
        },
        {
          name: 'created_at',
          table: 'teams',
          type: 'datetime',
          default_value: null,
          max_length: null,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'activated_at',
          table: 'teams',
          type: 'date',
          default_value: null,
          max_length: null,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'email',
          table: 'users',
          type: 'varchar',
          default_value: null,
          max_length: 100,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'password',
          table: 'users',
          type: 'varchar',
          default_value: null,
          max_length: 60,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
      ]);
    });

    it('returns information for all columns in specific table', async () => {
      expect(await inspector.columnInfo('teams')).toEqual([
        {
          name: 'id',
          table: 'teams',
          type: 'int',
          default_value: null,
          max_length: null,
          is_nullable: false,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'name',
          table: 'teams',
          type: 'varchar',
          default_value: null,
          max_length: 100,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'description',
          table: 'teams',
          type: 'text',
          default_value: null,
          max_length: 65535,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'credits',
          table: 'teams',
          type: 'int',
          default_value: null,
          max_length: null,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: 'Remaining usage credits',
        },
        {
          name: 'created_at',
          table: 'teams',
          type: 'datetime',
          default_value: null,
          max_length: null,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
        {
          name: 'activated_at',
          table: 'teams',
          type: 'date',
          default_value: null,
          max_length: null,
          is_nullable: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: '',
        },
      ]);
    });

    it('returns information for a specific column in a specific table', async () => {
      expect(await inspector.columnInfo('teams', 'name')).toEqual({
        name: 'name',
        table: 'teams',
        type: 'varchar',
        default_value: null,
        max_length: 100,
        is_nullable: true,
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
      expect(await inspector.primary('teams')).toEqual('id');
      expect(await inspector.primary('page_visits')).toEqual(null);
    });
  });
});
