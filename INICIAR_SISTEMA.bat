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

REM Chequear si existe la carpeta de produccion (dist)
IF NOT EXIST "dist" (
    echo.
    echo [NO SE DETECTA LA VERSION OPTIMIZADA]
    echo Construyendo el sistema para uso ligero...
    echo (Esto pasa solo una vez)
    echo.
    call npm run build
    echo.
    echo [OPTIMIZACION COMPLETADA]
    echo.
)

call node server/index.js
pause
