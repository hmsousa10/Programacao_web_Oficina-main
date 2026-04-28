@echo off
title SGO - Sistema de Gestao de Oficina
color 0A

echo.
echo  ============================================
echo   SGO - Sistema de Gestao de Oficina v2.0
echo  ============================================
echo.

set JAVA_HOME=C:\Program Files\Java\jdk-21
set CATALINA_HOME=C:\dev\tomcat
set TOMCAT_WEBAPPS=%CATALINA_HOME%\webapps

:: Carregar configuracao local de BD (opcional)
set DB_ENV_FILE=%~dp0config\db.env
if exist "%DB_ENV_FILE%" (
    for /f "usebackq tokens=1,* delims== eol=#" %%A in ("%DB_ENV_FILE%") do (
        if not "%%A"=="" set "%%A=%%B"
    )
)

:: Verificar se o Tomcat existe
if not exist "%CATALINA_HOME%\bin\startup.bat" (
    echo [ERRO] Tomcat nao encontrado em %CATALINA_HOME%
    echo Por favor instala o Tomcat primeiro.
    pause
    exit /b 1
)

:: Parar Tomcat se estiver a correr
echo [0/4] A verificar Tomcat em execucao...
call "%CATALINA_HOME%\bin\shutdown.bat" >nul 2>&1
timeout /t 4 /nobreak >nul

:: Fazer build do backend
echo [1/4] A compilar backend (Maven)...
cd /d "%~dp0backend"
call mvn clean package -DskipTests -q
if errorlevel 1 (
    echo [ERRO] Build falhou! Verifica os erros acima.
    pause
    exit /b 1
)
echo [OK] Build concluido.

:: Copiar WAR para o Tomcat (como ROOT para servir na raiz)
echo [2/4] A fazer deploy do backend WAR...
if exist "%TOMCAT_WEBAPPS%\sgo" (
    rmdir /s /q "%TOMCAT_WEBAPPS%\sgo"
)
if exist "%TOMCAT_WEBAPPS%\sgo.war" del "%TOMCAT_WEBAPPS%\sgo.war"
copy /y "target\sgo.war" "%TOMCAT_WEBAPPS%\sgo.war" >nul
echo [OK] WAR copiado.

:: Copiar frontend para sgofront
echo [3/4] A copiar frontend...
if exist "%TOMCAT_WEBAPPS%\sgofront" (
    rmdir /s /q "%TOMCAT_WEBAPPS%\sgofront"
)
xcopy /e /i /y "%~dp0frontend" "%TOMCAT_WEBAPPS%\sgofront" >nul
echo [OK] Frontend copiado.

:: Iniciar Tomcat
cd /d "%~dp0"
echo [4/4] A iniciar servidor Tomcat...
start "Tomcat SGO" /min "%CATALINA_HOME%\bin\startup.bat"

echo.
echo  A aguardar arranque do servidor (15 segundos)...
timeout /t 15 /nobreak >nul

echo.
echo  ============================================
echo   Backend API: http://localhost:8080/sgo/api
echo   Frontend:    http://localhost:8080/sgofront/
echo  ============================================
echo.

:: Abrir o frontend no browser padrao
start "" "http://localhost:8080/sgofront/"

echo Servidor a correr em background.
echo Para parar: executa parar.bat
echo.
pause
