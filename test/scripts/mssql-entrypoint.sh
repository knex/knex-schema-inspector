#!/bin/bash
password=Test@123

# bring up the server
/opt/mssql/bin/sqlservr

# run the init script to create the DB and the tables in /table
echo importing data...

/opt/mssql-tools/bin/sqlcmd -S 0.0.0.0 -U SA -P $password -i ./seed/init-mssql.sql
