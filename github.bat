@echo off
setlocal
cls

:: Configurações
set REPO_URL=https://github.com/yansassi/meganalise.git
set BRANCH=main

echo ======================================================
echo    AUTOMAÇÃO DE UPLOAD - REPOSITÓRIO MEGANALISE
echo ======================================================
echo.

:: Verifica se a pasta .git existe, se não, inicia o repositório
if not exist ".git" (
    echo [INFO] Inicializando repositório Git...
    git init
    git remote add origin %REPO_URL%
)

:: Adiciona todas as mudanças
echo [1/3] Adicionando arquivos...
git add .

:: Solicita a mensagem do commit
set /p commit_msg="Digite a mensagem do commit: "

:: Se a mensagem estiver vazia, define uma padrão
if "%commit_msg%"=="" set commit_msg="Atualizacao automatica via script .bat %date% %time%"

echo [2/3] Criando commit...
git commit -m "%commit_msg%"

:: Envia para o GitHub
echo [3/3] Enviando para o GitHub (Branch: %BRANCH%)...
git push origin %BRANCH%

echo.
echo ======================================================
echo    PROCESSO CONCLUÍDO COM SUCESSO!
echo ======================================================
pause