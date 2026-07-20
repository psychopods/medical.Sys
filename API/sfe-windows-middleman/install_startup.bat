@echo off
setlocal

echo =====================================================
echo    SFE Windows Biometric Proxy - Startup Installer
echo =====================================================
echo.

set "TARGET_EXE=%~dp0sfe_middleman64.exe"
if not exist "%TARGET_EXE%" (
    set "TARGET_EXE=%~dp0sfe_middleman32.exe"
)

if not exist "%TARGET_EXE%" (
    echo [ERROR] No compiled sfe_middleman executable found!
    echo Please run compile.bat first!
    pause
    exit /b 1
)

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\SfeBiometricProxy.lnk"

echo Target Executable: %TARGET_EXE%
echo Creating startup shortcut in: %STARTUP_FOLDER%
echo.

:: Use PowerShell to create a shortcut that starts minimized (WindowStyle = 7)
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT%'); $s.TargetPath='%TARGET_EXE%'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Save()"

if exist "%SHORTCUT%" (
    echo =====================================================
    echo [SUCCESS] SFE Biometric Proxy added to Windows Startup!
    echo It will now run automatically in the background 
    echo whenever Windows boots up or logs in.
    echo =====================================================
) else (
    echo [ERROR] Failed to create startup shortcut.
)

pause
