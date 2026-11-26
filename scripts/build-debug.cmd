@echo off
rem ============================================================
rem  Spot : compile la version de developpement (x86_64, pour l'emulateur), TOUT sur D:.
rem  Lance AVANT l'emulateur : la compilation C++ a besoin de beaucoup de memoire,
rem  et 2 taches Gradle a la fois au plus (--max-workers=2) pour ne pas saturer la RAM.
rem  Utilisation (depuis le dossier du projet) :  scripts\build-debug.cmd
rem ============================================================
setlocal
set JAVA_HOME=D:\Android\jbr
set ANDROID_HOME=D:\Android\Sdk
set ANDROID_SDK_ROOT=D:\Android\Sdk
set ANDROID_USER_HOME=D:\Android\userhome
set GRADLE_USER_HOME=D:\Android\gradle
set TEMP=D:\Android\Temp
set TMP=D:\Android\Temp
set JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=D:\Android\Temp
set npm_config_cache=D:\Android\npm-cache
set __UNSAFE_EXPO_HOME_DIRECTORY=D:\Android\expo-home
set PATH=D:\Android\jbr\bin;D:\Android\Sdk\platform-tools;%PATH%
cd /d "%~dp0.."

call npx.cmd expo prebuild --platform android --no-install || goto :error
cd android
call gradlew.bat app:assembleDebug -x lint -x test --build-cache --max-workers=2 -PreactNativeDevServerPort=8085 -PreactNativeArchitectures=x86_64 || goto :error
cd ..
echo.
echo OK : version de developpement compilee.
endlocal
exit /b 0

:error
echo.
echo ECHEC de la compilation : voir les messages ci-dessus.
endlocal
exit /b 1
