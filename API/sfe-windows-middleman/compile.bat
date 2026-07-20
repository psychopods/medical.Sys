@echo off
setlocal enabledelayedexpansion

echo =====================================================
echo    SFE Windows Biometric Proxy Compiler Script
echo =====================================================
echo.

:: Detect standard .NET Framework compiler path
set "CSC_PATH="
if exist "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if "%CSC_PATH%"=="" (
    echo [ERROR] csc.exe (C# Compiler) was not found in the standard Windows .NET paths.
    echo Please make sure .NET Framework 4.0 or higher is installed.
    pause
    exit /b 1
)

echo Found C# compiler at: %CSC_PATH%
echo.

echo Compiling 64-bit proxy (loads SFE64.dll / SFEMediator64.dll)...
"%CSC_PATH%" /nologo /platform:x64 /out:sfe_middleman64.exe SfeMiddleman.cs
if !errorlevel! equ 0 (
    echo [SUCCESS] Compiled: sfe_middleman64.exe
) else (
    echo [ERROR] 64-bit compilation failed.
)
echo.

echo Compiling 32-bit proxy (loads SFE.dll / SFEMediator.dll)...
"%CSC_PATH%" /nologo /platform:x86 /out:sfe_middleman32.exe SfeMiddleman.cs
if !errorlevel! equ 0 (
    echo [SUCCESS] Compiled: sfe_middleman32.exe
) else (
    echo [ERROR] 32-bit compilation failed.
)
echo.

echo =====================================================
echo Instructions:
echo 1. If your fingerprint driver is 64-bit, run 'sfe_middleman64.exe'
echo    (Make sure SFE64.dll and SFEMediator64.dll are in the same folder).
echo 2. If your fingerprint driver is 32-bit, run 'sfe_middleman32.exe'
echo    (Make sure SFE.dll and SFEMediator.dll are in the same folder).
echo =====================================================
pause
