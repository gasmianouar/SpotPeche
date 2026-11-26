@echo off
rem ============================================================
rem  Spot (Sprint 7) : prépare la reconnaissance des espèces sur le téléphone.
rem  1. supprime les fichiers devenus inutiles ;
rem  2. installe les nouvelles dépendances (ExecuTorch, expo-image-manipulator, jpeg-js...)
rem     et télécharge les bibliothèques natives d'ExecuTorch ;
rem  3. lance la vérification des types et les tests.
rem  Tout reste sur D:. Utilisation (depuis le dossier du projet) :  scripts\setup-recognition.cmd
rem ============================================================
setlocal
set TEMP=D:\Android\Temp
set TMP=D:\Android\Temp
set npm_config_cache=D:\Android\npm-cache
set __UNSAFE_EXPO_HOME_DIRECTORY=D:\Android\expo-home
cd /d "%~dp0.."

echo Suppression des fichiers remplaces :
for %%F in (
  "src\features\spots\data\recognition\QuotaLimitedImageRecognizer.ts"
  "src\features\spots\data\__tests__\QuotaLimitedImageRecognizer.test.ts"
  "src\features\spots\data\recognition\executorch\centroids.ts"
  "assets\models\species-labels.json"
) do if exist %%F (del %%F && echo   - %%~F)

rem package.json fixe react-native-worklets 0.13.1 et react-native-reanimated 4.7.2 (overrides) :
rem ExecuTorch 0.11 exige worklets < 0.14. Ne pas lancer « npx expo install --fix », qui remettrait 0.14.
call npm.cmd install || goto :error

rem npm bloque le script d'installation de react-native-executorch (allowScripts) : on lance nous-memes
rem le telechargement de ses bibliotheques natives. package.json ne demande que le moteur XNNPACK.
rem Cache sur D: (sinon il irait dans %%USERPROFILE%%\.cache, sur C:).
set RNET_LIBS_CACHE_DIR=D:\Android\rnet-cache
set INIT_CWD=%CD%
call node node_modules\react-native-executorch\scripts\download-libs.js || goto :error
call npx.cmd tsc --noEmit || goto :error
rem Cache de Jest dans le projet : celui de D:\Android\Temp\jest etait verrouille (EPERM).
call npx.cmd jest --cacheDirectory .tmp\jest-cache || goto :error

echo.
echo OK : dependances installees, types et tests verts.
endlocal
exit /b 0

:error
echo.
echo ECHEC : voir les messages ci-dessus.
endlocal
exit /b 1
