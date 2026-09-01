
@echo off
echo Menjalankan server...
cd /d %~dp0
set NODE_OPTIONS=--openssl-legacy-provider
npm run dev
pause
