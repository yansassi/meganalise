@echo off
echo Iniciando Deploy para Meganalise VPS...
echo.

:: Configurar Git para ignorar avisos de CRLF
git config core.autocrlf true

:: Adicionar todas as mudanças
git add .

:: Commit com data e hora
set "timestamp=%date% %time%"
git commit -m "Deploy: %timestamp%"

:: Verificar se o remote existe, se não, adicionar
git remote get-url production >nul 2>&1
if %errorlevel% neq 0 (
    echo Configurando remote 'production'...
    git remote add production http://git.72.60.255.60.sslip.io/yansassi/meganalise.git
)

:: Sincronizar com o remote antes do push para evitar erros
echo Sincronizando com o servidor (production)...
git pull production main --rebase

:: Push para o remote production
echo Enviando para http://git.72.60.255.60.sslip.io/yansassi/meganalise.git...
git push production main

echo.
echo Deploy Concluido!
pause
