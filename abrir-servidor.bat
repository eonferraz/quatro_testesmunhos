@echo off
cd /d "%~dp0"
PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0executar-local.ps1"
if errorlevel 1 echo Nao foi possivel iniciar o servidor.
pause
