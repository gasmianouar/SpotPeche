@echo off
rem ============================================================
rem  Spot : compile une version de PRODUCTION arm64 et mesure sa taille.
rem  Tout reste sur D: (mêmes réglages que scripts\android.cmd).
rem  Utilisation (depuis le dossier du projet) :  scripts\measure-apk.cmd [etiquette]
rem  Le résultat est ajouté à .tmp\apk-sizes.txt (ex. « avant-executorch : 41.2 Mo »).
rem ============================================================
setlocal

set JAVA_HOME=D:\Android\jbr
set ANDROID_HOME=D:\Android\Sdk
set ANDROID_SDK_ROOT=D:\Android\Sdk
set ANDROID_USER_HOME=D:\Android\userhome
set ANDROID_EMULATOR_HOME=D:\Android\userhome
set ANDROID_AVD_HOME=D:\Android\userhome\avd
set GRADLE_USER_HOME=D:\Android\gradle
set TEMP=D:\Android\Temp
set TMP=D:\Android\Temp
set JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=D:\Android\Temp
set npm_config_cache=D:\Android\npm-cache
set __UNSAFE_EXPO_HOME_DIRECTORY=D:\Android\expo-home
set PATH=D:\Android\jbr\bin;D:\Android\Sdk\platform-tools;%PATH%

set LABEL=%~1
if "%LABEL%"=="" set LABEL=mesure

cd /d "%~dp0.."
if not exist .tmp mkdir .tmp

rem Régénère android\ depuis app.json (Continuous Native Generation), sans toucher au code.
call npx.cmd expo prebuild --platform android --no-install || goto :error

cd android
call gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a || goto :error
cd ..

set APK=android\app\build\outputs\apk\release\app-release.apk
for %%F in ("%APK%") do set SIZE=%%~zF
powershell -NoProfile -Command "'{0} : {1:N1} Mo ({2})' -f '%LABEL%', (%SIZE%/1MB), (Get-Date -Format 'yyyy-MM-dd HH:mm')" >> .tmp\apk-sizes.txt
type .tmp\apk-sizes.txt
endlocal
exit /b 0

:error
echo.
echo ECHEC de la compilation : voir les messages ci-dessus.
endlocal
exit /b 1
