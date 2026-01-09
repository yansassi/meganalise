# Arquitetura do Sistema - Meganalise Pro

## Visão Geral do Sistema
O Meganalise Pro é um dashboard de análise de mídias sociais projetado para consolidar dados do YouTube, Instagram, Facebook e TikTok. Ele fornece insights visuais, rastreamento histórico e ferramentas de análise de conteúdo.

## Stack Tecnológico

### Frontend
*   **Framework:** React 18+ (Vite)
*   **Linguagem:** JavaScript/TypeScript (ES6+)
*   **Estilização:** Vanilla CSS (Variáveis CSS para temas)
*   **Gráficos:** Recharts ou Chart.js (A definir)
*   **Gerenciamento de Estado:** React Context / Hooks
*   **Cliente HTTP:** Fetch API / Axios

### Backend e Banco de Dados
*   **Núcleo:** PocketBase (Backend as a Service baseado em Go)
*   **Banco de Dados:** SQLite (Embutido no PocketBase) / Componente do PocketBase
*   **Autenticação:** Auth nativo do PocketBase (Email/Senha)
*   **Hospedagem:** VPS (Windows/Linux)

### Infraestrutura
*   **Servidor:** VPS do Usuário (IP: 72.60.255.60)
*   **URL do PocketBase:** `https://auth.meganalise.pro`
*   **URL do Frontend:** `https://meganalise.pro` (Planejado)

## Fluxo de Dados

1.  **Ingestão de Dados:**
    *   **Importação de CSV:** Usuários enviam arquivos CSV exportados das plataformas sociais.
    *   **Parsing:** O Frontend processa os CSVs usando lógica padrão definida em `csv_structures.md`.
    *   **Armazenamento:** Os dados processados são normalizados e enviados para as coleções do PocketBase (`metrics_daily_log`, `comments_log`, etc.).

2.  **Visualização:**
    *   O Frontend consulta o PocketBase via SDK/REST API.
    *   Os dados são agregados (ex: somados por data) e renderizados em gráficos.

## Arquitetura de Deploy

*   **PocketBase:** Roda como um processo/serviço persistente na VPS. Proxied via Nginx/Caddy ou exposto diretamente se configurado.
*   **Frontend:** Arquivos estáticos de build servidos por um servidor web (IIS, Nginx ou diretório `pb_public` do PocketBase).

## Segurança
*   **Regras de API:** As coleções do PocketBase são protegidas por regras de API. Acesso de Leitura Público para dados do dashboard (se a intenção for visualização aberta da equipe) ou Leitura Autenticada. Acesso de Escrita restrito a Admin/Usuários Autorizados.
*   **HTTPS:** Forçado via certificados SSL (provavelmente gerenciado pela configuração robusta de proxy reverso na VPS).
