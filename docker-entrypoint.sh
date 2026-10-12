#!/bin/sh
set -e
./bin/validate
./bin/migrate
node ./server.js
