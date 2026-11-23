@echo off
rem ============================================================
rem  Spot : compile et lance l'app Android en gardant TOUT sur D:
rem  Utilisation (depuis le dossier du projet) :  scripts\android.cmd
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
set PATH=D:\Android\jbr\bin;D:\Android\Sdk\platform-tools;D:\Android\Sdk\emulator;%PATH%

rem Crée les dossiers s'ils n'existent pas encore.
for %%D in ("%TEMP%" "%npm_config_cache%" "%__UNSAFE_EXPO_HOME_DIRECTORY%" "%GRADLE_USER_HOME%" "%ANDROID_USER_HOME%") do if not exist %%D mkdir %%D

rem Se place dans le dossier du projet (le parent de scripts\).
cd /d "%~dp0.."

echo Appareils Android connectes :
adb devices
echo.
npx.cmd expo run:android %*

endlocal
