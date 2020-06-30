# knex-schema-inspector

Utility for extracting information about existing DB schema

## Installation

Install the package through NPM or Yarn:

```
npm install knex/knex-schema-inspector
```

```
yarn knex/knex-schema-inspector
```

Note: The package is currently not yet published to npm. The above commands install the package through
the git repo

## Usage

The package is initialized by passing it an instance of Knex:

```ts
import knex from 'knex';
import schemaInspector from 'knex/knex-schema-inspector';

const database = knex({
  client: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test',
    charset  : 'utf8'
  }
});

const inspector = schemaInspector(database);

export default inspector;
```

## Examples

```ts
import inspector from './inspector';

async function logTables() {
  const tables = await inspector.tables();
  console.log(tables);
}
```

## API

Note: MySQL doesn't support the `schema` parameter, as schema and database are ambiguous in MySQL.

Note 2: Some database types might return slightly more information than others. See the type files for a specific overview what to expect from driver to driver.

### `withSchema(schema: string): void`

_Not supported in MySQL_

Set the schema to use. Note: this is set on the inspector instance and only has to be done once:

```ts
inspector.withSchema('my-schema');
```

### `hasTable(table: string): Promise<boolean>`

Check if a table exists in the current database.

```ts
await inspector.hasTable('articles');
// => true | false
```

### `table(table: string): Promise<Table>`

Retrieve the table information for a given table.

```ts
await inspector.table('articles');
// => { name: 'articles', schema: 'project', comment: 'Informational blog posts' }
```

### `tables(schema?: string): Promise<Table[]>`

Retrieve all tables in the current database.

```ts
await inspector.tables();
// => [{ name: 'articles', schema: 'project', comment: 'Informational blog posts' }, {...}, {...}]
```

### `primary(table: string): Promise<string>`

Retrieve the primary key column for a given table

```ts
await inspector.primary('articles');
// => "id"
```

### `columns(table?: string): Promise<Column[]>`

Retrieve all columns from a given table. Returns all columns if `table` parameter is undefined.

```ts
await inspector.columns('articles');
// => [
//   {
//     name: "id",
//     table: "articles",
//     type: "VARCHAR",
//     defaultValue: null,
//     maxLength: null,
//     isNullable: false,
//     isPrimaryKey: true,
//     hasAutoIncrement: true,
//     foreignKeyColumn: null,
//     foreignKeyTable: null,
//     comment: "Primary key for the articles collection"
//   }
// ]
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)