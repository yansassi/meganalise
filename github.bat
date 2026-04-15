@echo off
setlocal
cls

:: Configurações Pessoais
set REPO_URL=https://yansassi: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@github.com/yansassi/meganalise.git
set BRANCH=main

echo ======================================================
echo    AUTOMACAO DE UPLOAD - REPOSITORIO MEGANALISE
echo ======================================================
echo.

:: 1. Garantir que o repositório está configurado
if not exist ".git" (
    echo [INFO] Inicializando repositorio Git local...
    git init
    git remote add origin %REPO_URL%
) else (
    git remote set-url origin %REPO_URL%
)

:: 2. Primeiro, registrar as suas mudanças locais
echo [1/4] Preparando arquivos locais...
git add .

set /p commit_msg="Digite a descricao do que foi feito: "
if "%commit_msg%"=="" set commit_msg="Update automatico: %date% %time%"

git commit -m "%commit_msg%"

:: 3. Agora sim, puxar o que está no servidor para mesclar
echo [2/4] Sincronizando com o GitHub (Pull/Merge)...
git pull origin %BRANCH% --rebase

:: 4. Enviar tudo
echo [3/4] Enviando para o GitHub...
git push origin %BRANCH%

echo.
echo ======================================================
echo    PROCESSO CONCLUIDO!
echo ======================================================
pause