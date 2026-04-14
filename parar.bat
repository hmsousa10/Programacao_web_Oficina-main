@echo off
title SGO - Parar Servidor
color 0C
echo.
echo  A parar o Tomcat...
"C:\dev\tomcat\bin\shutdown.bat"
echo  Servidor parado.
timeout /t 3
