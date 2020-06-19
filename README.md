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
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test',
    charset  : 'utf8'
  }
});

const schemaInspector = require('knex/knex-schema-inspector')(knex);
```

## Examples

```ts
const knex = require('knex')({
  client: 'mysql',
  connection: process.env.MYSQL_DATABASE_CONNECTION
});

const schemaInspector = require('knex/knex-schema-inspector')(knex);

schemaInspector
  .tables()
  .then((tables) => {
    console.log(tables);
  })
  .catch((error) => {
    console.error(error);
  });
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)