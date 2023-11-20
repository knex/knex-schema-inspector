export type UniqueConstraint = {
  table: string;
  constraint_name: null | string;
  columns: string[];
};
