@echo off
title DETENIENDO SISTEMA TATO
color 4f
echo ===================================================
echo      DETENIENDO SERVIDOR DESPENSA EL TATO
echo ===================================================
echo.
echo Cerrando procesos de Node.js...
taskkill /F /IM node.exe
echo.
echo Cerrando procesos de consola residuales...
taskkill /F /FI "WINDOWTITLE eq SERVIDOR TATO - NO CERRAR"
echo.
echo ===================================================
echo           SISTEMA DETENIDO CORRECTAMENTE
echo ===================================================
timeout /t 3
exit
