create table teams (
  id serial primary key,
  uuid char(36) not null,
  name varchar(100) default null,
  name_upper varchar(100), -- generated always as (upper(name)) stored, Postgres 10 doesn't have generated columns
  description text,
  credits integer,
  created_at timestamp,
  activated_at date,
  unique(uuid)
);
comment on column teams.credits is 'Remaining usage credits';
COMMENT ON TABLE teams IS 'Teams in competition';

create table users (
  id serial primary key,
  team_id int not null,
  email varchar(100),
  password varchar(60),
  status varchar(60) default 'active',
  constraint fk_team_id
    foreign key (team_id)
    references teams (id)
    on update cascade
    on delete cascade,
  constraint team_id_email_unique
    unique (team_id, email)
);

-- One table with camelCase naming
create table "camelCase" (
  "primaryKey" serial primary key
);

-- One table without a primary key
create table page_visits (
  request_path varchar(100),
  user_agent varchar(200),
  created_at timestamp
);

-- One table in a schema
create schema test;
create table test.test (
    id serial primary key,
    number int not null
);
