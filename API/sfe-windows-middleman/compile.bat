@echo off
setlocal enabledelayedexpansion
title SFE Biometric Proxy Compiler

color 0A

echo =======================================================================
echo              SFE WINDOWS BIOMETRIC PROXY COMPILER                      
echo =======================================================================
echo.

:: Step 1: Searching Compiler
echo [Step 1/3] Searching for native Windows C# compiler (csc.exe)...
echo Progress: [====                ] 20%%
echo.

set "CSC_PATH="
if exist "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if "%CSC_PATH%"=="" (
    color 0C
    echo [ERROR] csc.exe was not found in standard .NET paths!
    echo Please verify .NET Framework 4.0+ is installed on this machine.
    echo.
    echo =======================================================================
    echo RESULT: COMPILATION FAILED (Compiler not found)
    echo =======================================================================
    echo.
    echo Press any key to close this window...
    pause >nul
    exit /b 1
)

echo Found compiler at: %CSC_PATH%
echo Progress: [========            ] 40%%
echo.
timeout /t 1 >nul

:: Step 2: Compile 64-Bit
echo [Step 2/3] Compiling 64-bit executable (sfe_middleman64.exe)...
"%CSC_PATH%" /nologo /platform:x64 /out:sfe_middleman64.exe SfeMiddleman.cs > compile_log_x64.txt 2>&1

if %errorlevel% equ 0 (
    echo [SUCCESS] 64-bit binary compiled successfully.
    echo Progress: [============        ] 70%%
) else (
    echo [WARNING] 64-bit compilation failed. Check compile_log_x64.txt for details.
)
echo.
timeout /t 1 >nul

:: Step 3: Compile 32-Bit
echo [Step 3/3] Compiling 32-bit executable (sfe_middleman32.exe)...
"%CSC_PATH%" /nologo /platform:x86 /out:sfe_middleman32.exe SfeMiddleman.cs > compile_log_x86.txt 2>&1

if %errorlevel% equ 0 (
    echo [SUCCESS] 32-bit binary compiled successfully.
    echo Progress: [====================] 100%%
) else (
    echo [WARNING] 32-bit compilation failed. Check compile_log_x86.txt for details.
)
echo.

echo =======================================================================
if exist sfe_middleman64.exe (
    echo STATUS: COMPILATION COMPLETE! (sfe_middleman64.exe created)
) else if exist sfe_middleman32.exe (
    echo STATUS: COMPILATION COMPLETE! (sfe_middleman32.exe created)
) else (
    color 0C
    echo STATUS: COMPILATION FAILED! (No executable created)
)
echo =======================================================================
echo.
echo Please press any key to close this window...
pause >nul
