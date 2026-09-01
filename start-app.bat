@echo off
title Peralatan MWT - Dev Server
echo ========================================
echo   Peralatan MWT - Memulai Server...
echo ========================================
echo.
echo [1/2] Memulai Backend API (MySQL)...
start "Backend API - Port 3001" cmd /k "node backend\server.js"
timeout /t 2 /nobreak >nul

echo [2/2] Memulai Frontend (Vite)...
start "Frontend - Port 5173" cmd /k "npm run dev"

echo.
echo ========================================
echo   Semua server berjalan!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:3001
echo ========================================
echo.
echo Tekan tombol apa saja untuk keluar dari launcher ini...
pause >nul
