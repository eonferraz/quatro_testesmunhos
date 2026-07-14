@echo off
cd /d "%~dp0"
echo Servidor da Timeline dos Evangelhos
echo Acesse http://localhost:8000
echo Pressione Ctrl+C para encerrar.
python -m http.server 8000
pause
