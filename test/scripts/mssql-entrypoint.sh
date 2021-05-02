#!/bin/bash

wait_time=15s
password=Test@123

# bring up the server
/opt/mssql/bin/sqlservr &

# wait for SQL Server to come up
echo importing data will start in $wait_time...
sleep $wait_time

# run the init script to create the DB and the tables in /table
echo importing data...

/opt/mssql-tools/bin/sqlcmd -S 127.0.0.1 -U SA -P $password -i ./seed/mssql.sql
