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

:: Verifica se a pasta .git existe
if not exist ".git" (
    echo [INFO] Inicializando repositorio Git local...
    git init
    git remote add origin %REPO_URL%
) else (
    git remote set-url origin %REPO_URL%
)

:: 1. Puxar alterações do servidor para evitar conflitos
echo [1/4] Sincronizando com o servidor (Pull)...
git pull origin %BRANCH% --rebase

:: 2. Adicionar arquivos
echo [2/4] Detectando alteracoes...
git add .

:: 3. Commit
set /p commit_msg="Digite a descricao do que foi feito: "
if "%commit_msg%"=="" set commit_msg="Update automatico: %date% %time%"

echo [3/4] Criando commit local...
git commit -m "%commit_msg%"

:: 4. Enviar
echo [4/4] Enviando para o GitHub...
git push origin %BRANCH%

echo.
echo ======================================================
echo    PROCESSO CONCLUIDO!
echo ======================================================
pause