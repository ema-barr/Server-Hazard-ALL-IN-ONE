@echo off
title Compiling Hazard Dashboard
set folder=dashboard
set publicassets=public
color 3

echo  ##################################
echo  ##                              ##
echo  ##       Hazard Dashboard       ##
echo  ##                              ##
echo  ##################################


taskkill /im node.exe >nul 2>&1

echo [1/6] ::: Cleaning previously compiled files...
rd .\release\%folder%\ /S /Q 


echo [2/6] ::: Building folder structure...
mkdir release\%folder% 
mkdir release\%folder%\%publicassets% 


echo [3/6] ::: Copying files...
xcopy app.js release\%folder%\ >nul 2>&1
xcopy index.html release\%folder%\ >nul 2>&1
xcopy /E %publicassets% release\%folder%\%publicassets%\ >nul 2>&1

rd .\release\%folder%\%publicassets%\assets\compiled-js\ /S /Q >nul 2>&1
mkdir release\%folder%\%publicassets%\assets\compiled-js

echo [4/6] ::: Resolving module dependencies...
cmd /C browserify .\%publicassets%\assets\js\Main.js -o .\release\%folder%\%publicassets%\assets\compiled-js\bundle.js --debug

echo [5/6] ::: Running babel...
cmd /C babel .\release\%folder%\%publicassets%\assets\compiled-js\bundle.js -o .\release\%folder%\%publicassets%\assets\compiled-js\bundled.js --compact=false

echo [6/6] ::: Minifing...
cmd /C babili .\release\%folder%\%publicassets%\assets\compiled-js\bundled.js -o .\release\%folder%\%publicassets%\assets\compiled-js\bundled.min.js

echo.
echo ### Build Complete ###
echo Compiled files in ^.^\release^\%folder%
for /f %%i in ('node --version') do set VERSION=%%i

echo.
echo ### Server Running on Node %VERSION%###
echo Dashboard Online at http^:^/^/127^.0^.0^.1^:3000
echo CTRL^-C to exit
cmd /C node ./release/dashboard/app.js
pause >nul

