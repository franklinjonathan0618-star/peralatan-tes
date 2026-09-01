@echo off
set NODE_OPTIONS=--openssl-legacy-provider --no-warnings
set NODE_ENV=development
set TS_NODE_TRANSPILE_ONLY=true
npx vite --config vite.config.simple.ts --port 8080 --host 0.0.0.0