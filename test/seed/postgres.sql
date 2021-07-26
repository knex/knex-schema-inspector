create table teams (
  id serial primary key,
  uuid char(36) not null,
  name varchar(100),
  description text,
  credits integer,
  created_at timestamp,
  activated_at date,
  unique(uuid)
);
comment on column teams.credits is 'Remaining usage credits';

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
    on delete cascade
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
