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

:: Verifica se a pasta .git existe, se não, inicia o repositório
if not exist ".git" (
    echo [INFO] Inicializando repositorio Git local...
    git init
    git remote add origin %REPO_URL%
) else (
    :: Garante que a URL do remote esteja sempre atualizada com o Token
    git remote set-url origin %REPO_URL%
)

:: Adiciona todas as mudancas
echo [1/3] Detectando alteracoes...
git add .

:: Solicita a mensagem do commit
set /p commit_msg="Digite a descricao do que foi feito: "

:: Se a mensagem estiver vazia, define uma padrao
if "%commit_msg%"=="" set commit_msg="Update automatico: %date% %time%"

echo [2/3] Criando commit local...
git commit -m "%commit_msg%"

:: Envia para o GitHub usando o Token configurado
echo [3/3] Enviando para o GitHub (Branch: %BRANCH%)...
git push origin %BRANCH%

echo.
echo ======================================================
echo    PROCESSO CONCLUIDO! VERIFIQUE SEU GITHUB.
echo ======================================================
pause