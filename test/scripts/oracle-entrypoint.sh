#!/bin/bash

username=quill_test
password=QuillRocks\!

# bring up the server
$ORACLE_HOME/bin/lsnrctl start

echo startup | $ORACLE_HOME/bin/sqlplus / as sysdba

# run the init script to create the DB and the tables in /table
echo importing data...

$ORACLE_HOME/bin/sqlplus -S $username/$password@127.0.0.1:1521/xe @/tmp/test/seed/oracle.sql

tail -f $ORACLE_BASE/diag/rdbms/*/*/trace/alert*.log
