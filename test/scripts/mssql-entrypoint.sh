#!/bin/bash

wait_time=15s
password=Test@123

# wait for SQL Server to come up
echo importing data will start in $wait_time...
sleep $wait_time

# run the init script to create the DB and the tables in /table
echo importing data...

/opt/mssql-tools/bin/sqlcmd -S 0.0.0.0 -U SA -P $password -i ./seed/init-mssql.sql

for entry in "./seed/mssql.sql"
do
  echo executing $entry
  /opt/mssql-tools/bin/sqlcmd -S 0.0.0.0 -U SA -P $password -i $entry
done
