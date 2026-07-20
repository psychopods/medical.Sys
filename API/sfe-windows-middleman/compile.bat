@echo off
setlocal enabledelayedexpansion
title SFE Biometric Proxy Compiler
color 0A

echo =======================================================================
echo              SFE WINDOWS BIOMETRIC PROXY COMPILER                      
echo =======================================================================
echo.

:: Step 1: Searching Compiler
echo [Step 1/3] Searching for native Windows C# compiler...
echo Progress: [====                ] 20%%
echo.

set "CSC_PATH="

:: Try standard 64-bit .NET path
if exist "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
)

:: Try standard 32-bit .NET path
if "!CSC_PATH!"=="" (
    if exist "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
        set "CSC_PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
    )
)

:: Try system PATH
if "!CSC_PATH!"=="" (
    for /f "tokens=*" %%g in ('where csc.exe 2^>nul') do (
        set "CSC_PATH=%%g"
    )
)

:: Try recursive search under Microsoft.NET
if "!CSC_PATH!"=="" (
    echo Searching Microsoft.NET directory for csc.exe...
    for /f "delims=" %%i in ('dir /b /s "C:\Windows\Microsoft.NET\csc.exe" 2^>nul') do (
        set "CSC_PATH=%%i"
    )
)

if "!CSC_PATH!"=="" goto NO_COMPILER

echo Found compiler at: !CSC_PATH!
echo Progress: [========            ] 40%%
echo.

:: Step 2: Compile 64-Bit
echo [Step 2/3] Compiling 64-bit executable (sfe_middleman64.exe)...
"!CSC_PATH!" /nologo /platform:x64 /out:sfe_middleman64.exe SfeMiddleman.cs > compile_log_x64.txt 2>&1

if !errorlevel! equ 0 (
    echo [SUCCESS] 64-bit binary compiled successfully.
    echo Progress: [============        ] 70%%
) else (
    echo [WARNING] 64-bit compilation returned errors. Details below:
    echo -----------------------------------------------------------------------
    type compile_log_x64.txt
    echo -----------------------------------------------------------------------
)
echo.

:: Step 3: Compile 32-Bit
echo [Step 3/3] Compiling 32-bit executable (sfe_middleman32.exe)...
"!CSC_PATH!" /nologo /platform:x86 /out:sfe_middleman32.exe SfeMiddleman.cs > compile_log_x86.txt 2>&1

if !errorlevel! equ 0 (
    echo [SUCCESS] 32-bit binary compiled successfully.
    echo Progress: [====================] 100%%
) else (
    echo [WARNING] 32-bit compilation returned errors. Details below:
    echo -----------------------------------------------------------------------
    type compile_log_x86.txt
    echo -----------------------------------------------------------------------
)
echo.

echo =======================================================================
if exist sfe_middleman64.exe (
    echo STATUS: COMPILATION COMPLETE! - sfe_middleman64.exe created
) else if exist sfe_middleman32.exe (
    echo STATUS: COMPILATION COMPLETE! - sfe_middleman32.exe created
) else (
    color 0C
    echo STATUS: COMPILATION FAILED!
)
echo =======================================================================
echo.
echo Please press any key to close this window...
pause >nul
exit /b 0

:NO_COMPILER
color 0C
echo [ERROR] csc.exe was not found in standard .NET paths.
echo Please verify .NET Framework 4.0 or higher is enabled in Windows Features.
echo =======================================================================
echo RESULT: COMPILATION FAILED (Compiler Not Found)
echo =======================================================================
echo.
echo Press any key to close this window...
pause >nul
exit /b 1
