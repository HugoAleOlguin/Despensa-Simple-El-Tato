@echo off
title SERVIDOR TATO - NO CERRAR
echo ===================================================
echo   INICIANDO SISTEMA DESPENSA EL TATO
echo   (No cierres esta ventana negra)
echo ===================================================
echo.
cd /d "%~dp0"

REM Chequear si existe la carpeta de herramientas
IF NOT EXIST "node_modules" (
    echo.
    echo [PRIMERA VEZ DETECTADA]
    echo Instalando el cerebro del sistema...
    echo (Esto pasa solo una vez y puede tardar unos minutos)
    echo.
    call npm install
    echo.
    echo [INSTALACION COMPLETADA]
    echo.
)

call node server/index.js
pause
