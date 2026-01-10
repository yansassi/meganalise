# Estrutura do Banco de Dados

Este documento detalha as coleções e esquemas atuais do PocketBase.

## 📱 Coleções da Aplicação

Estas são as coleções principais utilizadas pela lógica de negócio da aplicação.

| Coleção | Tipo | Campos Principais |
| :--- | :--- | :--- |
| **`users`** | `auth` | `id`, `password`, `tokenKey`, `email`, `avatar`, `created`, `updated` |
| **`platforms`** | `base` | `id`, `name` (text), `idiom` (text), `icon` (file), `theme_color` (text), `created` |
| **`metrics_daily_log`** | `base` | `id`, `platform` (relation), `value` (number), `metric_name` (text), `date` (autodate) |
| **`content_items`** | `base` | `id`, `platform` (relation), `original_id` (text), `thumbnail` (text), `created`, `updated` |
| **`instagram_daily_metrics`** | `base` | `id`, `platform` (select), `date` (date), `metric_category` (text), `created`, `updated` |
| **`instagram_content`** | `base` | `id`, `original_id` (text), `title` (text), `image_url` (text), `permalink` (text), `created`, `updated` |
| **`instagram_audience_demographics`** | `base` | `id`, `platform` (text), `import_date` (date), `gender_age` (select), `created`, `updated` |

---

## ⚙️ Coleções do Sistema (Internas)

Coleções geradas e utilizadas internamente pelo PocketBase para autenticação e gerenciamento.

| Coleção | Tipo | Campos |
| :--- | :--- | :--- |
| **`_superusers`** | `auth` | `id`, `password`, `tokenKey`, `email`, `verified` (bool), `created`, `updated` |
| **`_mfas`** | `base` | `id`, `collectionRef`, `recordRef`, `method` (text), `created`, `updated` |
| **`_otps`** | `base` | `id`, `collectionRef`, `recordRef`, `sentTo` (text), `created`, `updated` |
| **`_externalAuths`** | `base` | `id`, `collectionRef`, `recordRef`, `providerId` (text), `created`, `updated` |
| **`_authOrigins`** | `base` | `id`, `collectionRef`, `recordRef`, `fingerprint` (text), `created`, `updated` |

---

## 📂 Mapeamento de Arquivos e Dados

### `dados_fornecido/instagram/Alcance.csv`

Este arquivo contém métricas diárias de alcance da conta do Instagram.

**1. Conteúdo e Estrutura do CSV:**
*   **Colunas:** `Data` (período), `Valor` (quantidade de alcance).
*   **Dados:** Registros diários de quantas contas foram alcançadas.

**2. Processamento (Backend):**
*   **Status:** ✅ **INTEGRADO**.
*   **Parser:** `server/services/parser.js` -> `parseInstagramCSV` identifica o arquivo como tipo `metric` e métrica `reach`.
*   **Rota de Upload:** `server/routes/upload.js` recebe o arquivo processado.
*   **Armazenamento:** Os dados são salvos na coleção **`instagram_daily_metrics`**.
    *   `date`: Data extraída e formatada do CSV.
    *   `metric`: Definido como `'reach'`.
    *   `value`: O valor numérico do alcance diário.
    *   `platform`: Definido como `'instagram'`.
    *   `country`: País selecionado no upload.

**3. Exibição (Frontend):**
*   **Status:** ✅ **INTEGRADO**.
*   **Componente Principal:** `client/src/components/dashboard/PlatformView.jsx` (Painel do Instagram).
*   **Visualização:**
    *   **StatCards:** O somatório dos valores de alcance no período selecionado aparece no card **"Alcance Total"**.
    *   **GrowthChart:** Os dados diários alimentam o gráfico de barras **"Análise de Crescimento"** (mostrando a evolução do alcance por dia).

### `dados_fornecido/instagram/Visitas.csv`

Este arquivo contém métricas diárias de visitas ao perfil do Instagram.

**1. Conteúdo e Estrutura do CSV:**
*   **Colunas:** `Data` (período), `Valor` (quantidade de visitas).
*   **Dados:** Registros diários de quantas vezes o perfil foi visitado.

**2. Processamento (Backend):**
*   **Status:** ✅ **INTEGRADO**.
*   **Parser:** `server/services/parser.js` -> `parseInstagramCSV` identifica o arquivo como tipo `metric` e métrica `profile_visits`.
*   **Rota de Upload:** `server/routes/upload.js` recebe o arquivo processado.
*   **Armazenamento:** Os dados são salvos na coleção **`instagram_daily_metrics`**.
    *   `date`: Data extraída e formatada do CSV.
    *   `metric`: Definido como `'profile_visits'`.
    *   `value`: O valor numérico de visitas diárias.
    *   `platform`: Definido como `'instagram'`.
    *   `country`: País selecionado no upload.

**3. Exibição (Frontend):**
*   **Status:** ✅ **INTEGRADO**.
*   **Componente Principal:** `client/src/components/dashboard/PlatformView.jsx` (Painel do Instagram).
*   **Visualização:**
    *   **StatCards:** O somatório das visitas no período selecionado aparece no card **"Visitas ao Perfil"**.
    *   **(Nota):** Diferente do alcance, atualmente as visitas ao perfil *não* são exibidas no `GrowthChart` (que foca em alcance ou seguidores).

### `dados_fornecido/instagram/Seguidores.csv`

Este arquivo contém (ou deveria conter) a evolução de seguidores.

**1. Conteúdo e Estrutura do CSV:**
*   **Estado Atual:** O arquivo fornecido está praticamente vazio (contém apenas cabeçalho de separador).
*   **Expectativa do Sistema:** O parser espera colunas referentes a Data e "Seguidores" ou "Followers". Normalmente, representa o ganho/perda de seguidores no período ou o total acumulado (dependendo da exportação).

**2. Processamento (Backend):**
*   **Parser:** `server/services/parser.js` -> `parseInstagramCSV` identifica o arquivo por nome (`seguid` ou `follow`) ou colunas, categorizando como métrica `followers`.
*   **Armazenamento:** Salvo em **`instagram_daily_metrics`** com `metric: 'followers'`.

**3. Exibição (Frontend):**
*   **Visualização:**
    *   **StatCards:** O valor é somado e exibido no card **"Seguidores"**.
    *   **GrowthChart:** *Não* é utilizado no gráfico atualmente (o código do gráfico filtra apenas por `reach`).
    *   **(Atenção):** A lógica atual *SOMA* os valores de todos os dias. Se o CSV contiver o "Total de Seguidores" (acumulado), a soma estará incorreta. Se contiver "Novos Seguidores", a soma estará correta.

### `dados_fornecido/instagram/Público.csv`

Este arquivo contém dados demográficos (Faixa etária e gênero, Cidades, Países).

**1. Conteúdo e Estrutura do CSV:**
*   **Seções:** O arquivo é dividido em blocos de texto separados, não é um CSV tabular padrão único.
    *   "Faixa etária e gênero": Tabela com faixas de idade (linhas) e porcentagens por gênero (colunas).
    *   "Principais cidades": Lista de cidades e suas porcentagens.
    *   "Principais países": Lista de países e suas porcentagens.
*   **Estado Atual:** Arquivo presente, contendo dados ricos de audiência.

**2. Processamento (Backend):**
*   **Status:** ❌ **NÃO INTEGRADO**.
*   **Diagnóstico:** O parser atual (`server/services/parser.js`) não possui lógica para identificar ou processar este formato de arquivo (dados não tabulares mistos).
*   **Ação Necessária:** Ver detalhes técnicos em `integrar.md`.

**3. Exibição (Frontend):**
*   **Status:** ❌ **Sem visualização**.
*   **Componentes:** Não existem gráficos ou tabelas implementados no `PlatformView.jsx` para exibir demografia.

### `dados_fornecido/instagram/Principais formatos de conteúdo.csv`

Este arquivo contém uma contagem agregada de tipos de conteúdo publicados (ex: Posts vs Stories).

**1. Conteúdo e Estrutura do CSV:**
*   **Colunas:** `Conteúdo publicado` (cabeçalho da seção), seguidos pelos tipos (`Posts`, `Stories`) e seus valores na linha seguinte.
*   **Dados:** Simples contagem de lançamentos no período.

**2. Processamento (Backend):**
*   **Status:** ❌ **NÃO INTEGRADO**.
*   **Diagnóstico:** O parser atual ignora este arquivo "horizontal" simples.
*   **Ação Necessária:** Ver detalhes técnicos em `integrar.md`.

**3. Exibição (Frontend):**
*   **Status:** ❌ **Sem visualização**.
*   **Status:** ❌ **Sem visualização**.
*   **Componentes:** O dashboard atual calcula posts/stories contando itens individuais da lista de conteúdo (`content_items`), o que é mais preciso que este CSV agregado. Talvez este arquivo seja redundante se já importamos o "Conteúdo" detalhado.

### `dados_fornecido/instagram/Interações.csv`

Este arquivo contém métricas diárias de total de interações (curtidas, comentários, salvamentos, compartilhamentos somados).

**1. Conteúdo e Estrutura do CSV:**
*   **Colunas:** `Data` (período), `Valor` (quantidade total de interações).
*   **Dados:** Série temporal de engajamento diário.

**2. Processamento (Backend):**
*   **Parser:** `server/services/parser.js` -> `parseInstagramCSV` identifica o arquivo como tipo `metric` e métrica `interactions`.
*   **Armazenamento:** Salvo em **`instagram_daily_metrics`** com `metric: 'interactions'`.

**3. Exibição (Frontend):**
*   **Visualização:**
    *   **StatCards:** O somatório é exibido no card **"Interações"**.
    *   **(Nota):** Não possui gráfico de crescimento específico no momento (o gráfico exibe apenas Alcance), mas o componente `StatCards` exibe o volume total do período.

### `dados_fornecido/instagram/Cliques no link.csv`

Este arquivo contém métricas diárias de cliques no link (website) do perfil.

**1. Conteúdo e Estrutura do CSV:**
*   **Colunas:** `Data` (período), `Valor` (quantidade de cliques).
*   **Dados:** Série temporal de cliques diários no link da bio.

**2. Processamento (Backend):**
*   **Parser:** `server/services/parser.js` -> `parseInstagramCSV` identifica o arquivo por nome (`clique`, `click`) ou colunas, categorizando como métrica `website_clicks`.
*   **Armazenamento:** Salvo em **`instagram_daily_metrics`** com `metric: 'website_clicks'`.

**3. Exibição (Frontend):**
*   **Visualização:**
    *   **StatCards:** O somatório é exibido no card **"Cliques no Link"**.
    *   **(Nota):** Não exibido no gráfico principal.

### `dados_fornecido/instagram/Visualizações.csv`

Este arquivo contém métricas diárias de impressões (visualizações totais).

**1. Conteúdo e Estrutura do CSV:**
*   **Colunas:** `Data` (período), `Valor` (número de impressões).
*   **Dados:** Série temporal de quantas vezes o conteúdo foi exibido na tela.

**2. Processamento (Backend):**
*   **Status:** ✅ **INTEGRADO**.
*   **Parser:** `server/services/parser.js` -> `parseInstagramCSV` identifica o arquivo por nome (`visualiza`, `impression`) e categoriza como `impressions`.
*   **Armazenamento:** Salvo em **`instagram_daily_metrics`** com `metric: 'impressions'`.

**3. Exibição (Frontend):**
*   **Status:** ⚠️ **PARCIALMENTE INTEGRADO**.
*   **Backend:** Dados são salvos corretamente.
*   **Frontend:** Atualmente **NÃO** há um card específico para "Impressões" no `PlatformView.jsx` (apenas Alcance, Interações, Seguidores, Visitas e Cliques). Os dados existem no banco, mas não são mostrados ao usuário.

### `dados_fornecido/instagram/Jan-10...csv` e `Oct-09...csv` (Exportações de Conteúdo)

Estes arquivos nomes longos (geralmente datas e IDs) contêm o detalhamento de cada postagem (Posts, Reels e Stories).

**1. Conteúdo e Estrutura do CSV:**
*   **Colunas:** Detalhadas por post, incluindo `Link permanente`, `Horário de publicação`, `Tipo de post` (Reel, Story, Imagem), `Impressões`, `Alcance`, `Curtidas`, `Comentários`, `Salvamentos`, etc.
*   **Dados:** Lista completa de cada conteúdo publicado e suas métricas individuais.

**2. Processamento (Backend):**
*   **Status:** ✅ **INTEGRADO**.
*   **Parser:** `server/services/parser.js` -> `parseInstagramCSV` identifica colunas-chave (`permalink`, `tipo de post`, `identificação do post`) e categoriza como `content`.
*   **Rota de Upload:** `server/routes/upload.js` processa a lista (`result.data`) e salva/atualiza item por item na coleção **`instagram_content`**.
    *   Faz o "upsert" (atualiza se existir, cria se novo) baseado no ID original do post.
    *   Mapeia campos como `reach`, `likes`, `shares`, `comments`, `saved`, `views`, `duration`.

**3. Exibição (Frontend):**
*   **Status:** ✅ **INTEGRADO**.
*   **Componente Principal:** `client/src/components/dashboard/ContentTable.jsx` (Tabelas de Conteúdo).
*   **Visualização:**
    *   **Tabelas:** Os dados alimentam as tabelas "Reels e Feed" e "Stories Recentes" no dashboard.
    *   **Detalhes:** Ao clicar em um item, o `ContentDetailsModal.jsx` exibe todas as métricas detalhadas importadas do CSV.
