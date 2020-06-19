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

const inspector = schemaInspector(knex);

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

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)