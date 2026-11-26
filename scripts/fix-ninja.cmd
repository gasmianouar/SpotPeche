@echo off
rem ============================================================
rem  Spot : remplace ninja.exe de CMake 3.22.1 par ninja 1.12.1.
rem  Le ninja livre avec CMake 3.22.1 refuse les chemins de plus de 260 caracteres,
rem  meme avec LongPathsEnabled. Ninja 1.12 sait les gerer (compilation de production).
rem  L'ancien ninja.exe est garde en ninja-1.10.exe. Tout reste sur D:.
rem  Utilisation (depuis le dossier du projet) :  scripts\fix-ninja.cmd
rem ============================================================
setlocal
set NINJA_DIR=D:\Android\Sdk\cmake\3.22.1\bin
set WORK=D:\Android\Temp\ninja-1.12.1
cd /d "%~dp0.."

if not exist "%NINJA_DIR%\ninja.exe" (echo ninja.exe introuvable dans %NINJA_DIR% & goto :error)
"%NINJA_DIR%\ninja.exe" --version | findstr /b "1.12" >nul && (echo Deja fait : ninja 1.12 est en place. & goto :ok)

if exist "%WORK%" rmdir /s /q "%WORK%"
mkdir "%WORK%" || goto :error
echo Telechargement de ninja 1.12.1 (github.com/ninja-build, environ 300 Ko)...
curl.exe -L --fail -o "%WORK%\ninja-win.zip" https://github.com/ninja-build/ninja/releases/download/v1.12.1/ninja-win.zip || goto :error
powershell -NoProfile -Command "Expand-Archive -Force '%WORK%\ninja-win.zip' '%WORK%'" || goto :error

if not exist "%NINJA_DIR%\ninja-1.10.exe" copy /y "%NINJA_DIR%\ninja.exe" "%NINJA_DIR%\ninja-1.10.exe" >nul || goto :error
copy /y "%WORK%\ninja.exe" "%NINJA_DIR%\ninja.exe" >nul || goto :error
"%NINJA_DIR%\ninja.exe" --version

rem Les dossiers .cxx gardent l'echec precedent en cache.
if exist "android\app\.cxx" rmdir /s /q "android\app\.cxx"

:ok
echo.
echo OK : relancez scripts\sprint7-tout.cmd
endlocal
exit /b 0

:error
echo.
echo ECHEC : voir les messages ci-dessus.
endlocal
exit /b 1
