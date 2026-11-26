@echo off
rem ============================================================
rem  Spot : demarre l'emulateur Android en gardant TOUT sur D:
rem  (les appareils virtuels sont dans D:\Android\userhome\avd).
rem  Android Studio lance sans ces reglages cherche sur C: : utiliser ce script.
rem  Utilisation :  scripts\emulateur.cmd            (premier appareil virtuel)
rem                 scripts\emulateur.cmd Pixel_API_34
rem ============================================================
setlocal
set ANDROID_HOME=D:\Android\Sdk
set ANDROID_SDK_ROOT=D:\Android\Sdk
set ANDROID_USER_HOME=D:\Android\userhome
set ANDROID_EMULATOR_HOME=D:\Android\userhome
set ANDROID_AVD_HOME=D:\Android\userhome\avd
set TEMP=D:\Android\Temp
set TMP=D:\Android\Temp
set PATH=D:\Android\Sdk\platform-tools;D:\Android\Sdk\emulator;%PATH%
if not exist "%TEMP%" mkdir "%TEMP%"

rem Deja un appareil pret ? On ne relance rien.
adb start-server >nul 2>&1
for /f "skip=1 tokens=2" %%S in ('adb devices') do if "%%S"=="device" (echo Un appareil Android est deja pret. & goto :ok)

set AVD=%~1
if "%AVD%"=="" for /f "delims=" %%A in ('emulator -list-avds') do if not defined AVD set AVD=%%A
if "%AVD%"=="" (echo Aucun appareil virtuel dans %ANDROID_AVD_HOME%. & goto :error)

echo Demarrage de l'emulateur %AVD% (fenetre separee)...
start "Emulateur %AVD%" emulator -avd %AVD% -no-boot-anim
adb wait-for-device

echo Attente de la fin du demarrage d'Android...
set /a TRIES=0
:wait
set BOOTED=
for /f "delims=" %%B in ('adb shell getprop sys.boot_completed 2^>nul') do set BOOTED=%%B
if "%BOOTED%"=="1" goto :ok
set /a TRIES+=1
if %TRIES% GEQ 60 (echo L'emulateur n'a pas fini de demarrer apres 5 minutes. & goto :error)
timeout /t 5 /nobreak >nul
goto :wait

:ok
echo Emulateur pret.
endlocal
exit /b 0

:error
echo.
echo ECHEC : voir les messages ci-dessus.
endlocal
exit /b 1
