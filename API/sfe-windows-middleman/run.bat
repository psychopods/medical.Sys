@echo off
title SFE Biometric Proxy Server

if exist sfe_middleman64.exe (
    echo Starting 64-bit SFE Biometric Proxy Server...
    sfe_middleman64.exe
) else if exist sfe_middleman32.exe (
    echo Starting 32-bit SFE Biometric Proxy Server...
    sfe_middleman32.exe
) else (
    color 0C
    echo =======================================================================
    echo [ERROR] No compiled executable found! 
    echo Please double-click 'compile.bat' first to build the executable.
    echo =======================================================================
    echo.
    echo Press any key to close...
    pause >nul
)
