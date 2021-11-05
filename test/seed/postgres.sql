create table teams (
  id serial primary key,
  uuid char(36) not null,
  name varchar(100),
  name_upper varchar(100) generated always as (upper(name)) stored,
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

-- One table with multiple default values
create table multiple_defaults (
  i1 int default 12,
  i2 smallint default '12'::smallint,
  i3 integer default '12'::integer,
  i4 bigint default '12'::bigint,

  f1 float default 12.12,
  f2 float4 default '12.12'::float4,
  f3 float8 default '12.12'::float8,
  f4 real default '12.12'::real,

  b1 bool default false,
  b2 bool default false::boolean,
  
  c1 char default 'Lorem Ipsum',
  c2 varchar default 'Lorem Ipsum',

  t1 timestamp default '2021-11-01 10:23:54',
  t2 timestamp with time zone default '2021-11-01 10:23:54+02',

  d1 date default '2021-11-01',

  j1 json default '{"text":"Lorem Ipsum"}'::json,
  j2 jsonb default '{"text":"Lorem Ipsum"}'::jsonb,

  a1 json[] default array[]::json[],
  a2 jsonb[] default array[]::jsonb[],
  a3 json[] default array['{"text":"Lorem Ipsum"}', '{"text":"dolor sit amet"}']::json[],

  p1 int[] default '{12, 24, 48}',
  p2 int2[] default '{12, 24, 48}',
  p3 bigint[] default '{12, 24, 48}',
  
  p4 float4[] default '{12.12, 24.12, 48.12}',
  p5 float8[] default '{12.12, 24.12, 48.12}',
  p6 real[] default '{12.12, 24.12, 48.12}',

  p7 bool[] default '{1, true, t, false, f}',

  p8 character[] default '{"Lorem Ipsum","dolor sit amet"}',
  p9 varchar[] default '{"Lorem Ipsum","dolor sit amet"}',

  p10 timestamp[] default '{"2021-11-01 10:23:54","2021-11-11 10:23:54"}',
  p11 timestamp with time zone[] default '{"2021-11-01 10:23:54","2021-11-11 10:23:54"}',
  p12 date[] default '{"2021-11-01","2021-11-11"}'
);

-- One table in a schema
create schema test;
create table test.test (
    id serial primary key,
    number int not null
);
