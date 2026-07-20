@echo off
if exist sfe_middleman64.exe (
    echo Starting 64-bit proxy server...
    sfe_middleman64.exe
) else if exist sfe_middleman32.exe (
    echo Starting 32-bit proxy server...
    sfe_middleman32.exe
) else (
    echo [ERROR] No compiled executable found. Please run compile.bat first!
    pause
)
