@echo off
title SERVIDOR TATO - NO CERRAR
echo ===================================================
echo   INICIANDO SISTEMA DESPENSA EL TATO
echo   (No cierres esta ventana negra)
echo ===================================================
echo.
cd /d "%~dp0"
call npm run dev
pause
