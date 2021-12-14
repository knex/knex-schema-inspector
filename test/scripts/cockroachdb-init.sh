#!/bin/bash
echo Wait for servers to be up
sleep 10

HOSTPARAMS="--host cockroachdb --insecure"
SQL="/cockroach/cockroach.sh sql $HOSTPARAMS"

$SQL -f /seed.sql
