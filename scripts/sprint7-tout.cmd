@echo off
rem ============================================================
rem  Spot, Sprint 7 : compile et lance l'app sur l'emulateur, TOUT sur D:.
rem  0. scripts\fix-ninja.cmd          (ninja 1.12, une seule fois)
rem  1. scripts\setup-recognition.cmd  (npm install, types, tests)
rem  2. scripts\build-debug.cmd        (compilation, AVANT l'emulateur : memoire)
rem  3. scripts\emulateur.cmd          (demarre l'emulateur s'il n'est pas deja la)
rem  4. scripts\android.cmd            (installe et lance l'app, Metro sur le port 8085)
rem  Option :  scripts\sprint7-tout.cmd mesure   ajoute la version de production et sa taille.
rem  Journaux dans .tmp\ ; arret a la premiere erreur.
rem ============================================================
setlocal
cd /d "%~dp0.."
if not exist .tmp mkdir .tmp
echo debut %date% %time% > .tmp\sprint7-etapes.log

echo [0/4] ninja 1.12... journal : .tmp\fix-ninja.log
call scripts\fix-ninja.cmd > .tmp\fix-ninja.log 2>&1
echo ninja EXIT=%ERRORLEVEL% >> .tmp\sprint7-etapes.log

echo [1/4] Preparation (dependances, types, tests)... journal : .tmp\setup-recognition.log
call scripts\setup-recognition.cmd > .tmp\setup-recognition.log 2>&1
echo setup EXIT=%ERRORLEVEL% >> .tmp\sprint7-etapes.log
if errorlevel 1 goto :error

if /i "%~1"=="mesure" (
  echo [option] Version de production et taille... journal : .tmp\measure-apk.log
  call scripts\measure-apk.cmd apres-executorch > .tmp\measure-apk.log 2>&1
  call echo measure EXIT=%%ERRORLEVEL%% >> .tmp\sprint7-etapes.log
)

echo [2/4] Compilation (10 a 15 min la premiere fois)... journal : .tmp\build-debug.log
call scripts\build-debug.cmd > .tmp\build-debug.log 2>&1
echo build EXIT=%ERRORLEVEL% >> .tmp\sprint7-etapes.log
if errorlevel 1 goto :error

echo [3/4] Emulateur... journal : .tmp\emulateur.log
call scripts\emulateur.cmd > .tmp\emulateur.log 2>&1
echo emulateur EXIT=%ERRORLEVEL% >> .tmp\sprint7-etapes.log
if errorlevel 1 goto :error

echo [4/4] Installation et lancement de l'app... journal : .tmp\run-android.log
echo android DEBUT %time% >> .tmp\sprint7-etapes.log
call scripts\android.cmd --port 8085 > .tmp\run-android.log 2>&1
echo android EXIT=%ERRORLEVEL% >> .tmp\sprint7-etapes.log
endlocal
exit /b 0

:error
echo.
echo ECHEC : voir le journal dans .tmp\
echo ECHEC %time% >> .tmp\sprint7-etapes.log
pause
endlocal
exit /b 1
