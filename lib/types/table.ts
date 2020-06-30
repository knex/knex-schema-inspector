export interface Table {
  name: string;
  schema: string;
  comment: string | null;

  // MySQL Only
  collation?: string;
  engine?: string;

  // Postgres Only
  owner?: string;
}
