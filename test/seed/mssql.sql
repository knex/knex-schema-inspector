USE test_db;
GO

create table teams (
  id int not null identity primary key,
  uuid char(36) not null,
  name nvarchar(100) default null,
  name_upper as upper(name),
  description varchar(max),
  credits integer,
  created_at datetime2(0),
  activated_at date,
  constraint uuid unique (uuid)
);

GO

create table users (
  id int not null identity primary key,
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

GO

create table page_visits (
  request_path varchar(100),
  user_agent varchar(200),
  created_at datetime2(0)
);

GO
