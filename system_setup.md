# Guia de Configuração do Sistema - Meganalise Pro

Este guia descreve os passos manuais para configurar o sistema Meganalise Pro, focando especificamente no Backend (PocketBase) e na criação inicial do Frontend.

## Parte 1: Configuração do Backend (PocketBase)

### 1. Acessando o Painel Administrativo
1.  Navegue para `https://auth.meganalise.pro/_/`
2.  Faça login com suas credenciais de administrador.

### 2. Criando Coleções
Consulte `database_schema.md` para os tipos exatos de campos e nomes.

**Passo-a-Passo para cada coleção:**
1.  Clique em **"New Collection"** (Nova Coleção).
2.  Insira o **Nome** (ex: `platforms`).
3.  Adicione **Campos** (Fields) clicando em "New Field" e selecionando o tipo apropriado (Text, Number, Relation, etc.).
4.  Configure as **Regras de API** (API Rules):
    *   Clique no ícone de "Cadeado" (o cadeado deve abrir) para List, View, Create, Update, Delete para torná-los **Públicos**.
    *   *Nota: Para produção, você pode querer restringir Create/Update/Delete depois.*
5.  Clique em **Create** (Criar).

**Coleções para Criar:**
*   `platforms`
*   `metrics_daily_log`
*   `content_items`
*   `breakdown_metrics`
*   `comments_log`
*   `print_analysis_log`

### 3. Populando Dados Iniciais (Plataformas)
Adicione manualmente as plataformas principais para que as referências de ID existam.
1.  Vá para a coleção `platforms`.
2.  Clique em **"New Record"** (Novo Registro).
3.  Preencha:
    *   **Name:** `YouTube` | **Idiom:** `yt` | **Theme Color:** `#FF0000`
    *   **Name:** `Instagram` | **Idiom:** `ig` | **Theme Color:** `#C13584`
    *   **Name:** `Facebook` | **Idiom:** `fb` | **Theme Color:** `#1877F2`
    *   **Name:** `TikTok` | **Idiom:** `tt` | **Theme Color:** `#000000`
4.  Salve cada registro.

---

## Parte 2: Configuração do Frontend (React + Vite)

### 1. Inicialização
Abra seu terminal no diretório `C:\Users\Yan Casa\OneDrive\VPS\Sistemas\Meganalise`.

Execute os seguintes comandos para criar o projeto:
```bash
npm create vite@latest client -- --template react
cd client
npm install
```

### 2. Instalando Dependências
Instale as bibliotecas necessárias para roteamento, api e gráficos:
```bash
npm install pocketbase react-router-dom recharts lucide-react date-fns
```

### 3. Configurando o Cliente PocketBase
Crie um arquivo `src/lib/pocketbase.js`:
```javascript
import PocketBase from 'pocketbase';

export const pb = new PocketBase('https://auth.meganalise.pro');
```

### 4. Rodando o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse o app local na URL fornecida (geralmente `http://localhost:5173`).

---

## Parte 3: Importação de Dados (Fluxo Manual)

1.  **Preparar CSVs:** Garanta que seus arquivos CSV correspondam aos formatos descritos em `csv_structures.md`.
2.  **Lógica de Ingestão:** (A ser implementada no Frontend)
    *   O frontend lerá o CSV.
    *   Ele mapeará colunas para os campos da coleção do PocketBase.
    *   Ele iterará pelas linhas e enviará requisições `pb.collection('...').create(...)`.
