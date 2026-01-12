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
| **`instagram_daily_metrics`** | `base` | `id`, `platform` (select), `date` (date), `metric_category` (text), `country` (text), `created`, `updated` |
| **`instagram_content`** | `base` | `id`, `original_id` (text), `title` (text), `image_url` (text), `permalink` (text), `date` (date), `author` (text), `created`, `updated` |
| **`instagram_audience_demographics`** | `base` | `id`, `platform` (text), `import_date` (date), `gender_age` (select), `created`, `updated` |
| **`evidence_registries`** | `base` | `id`, `title` (text), `start_date` (date), `end_date` (date), `keywords` (json), `country` (text), `type` (text), `created`, `updated` |
| **`tiktok_daily_metrics`** | `base` | `id`, `date` (date), `metric` (text), `value` (number), `country` (text), `platform` (text), `created`, `updated` |
| **`tiktok_content`** | `base` | `id`, `original_id` (text), `title` (text), `permalink` (text), `image_file` (file), `author` (text), `date` (date), `created`, `updated` |
| **`tiktok_audience_demographics`** | `base` | `id`, `data` (json), `date_reference` (date), `country` (text), `type` (text), `created`, `updated` |

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

---

## 🔍 Funcionalidade de Evidência (Evidence Registry)

A funcionalidade de Evidência permite criar registros de monitoramento de marcas/produtos através de palavras-chave, gerando dashboards automáticos com conteúdos identificados.

### Coleção: `evidence_registries`

**Estrutura:**
*   `id`: Identificador único do registro.
*   `title`: Nome/título do registro (ex: "Campanha Natal 2025" ou "Nome do Influencer").
*   `start_date`: Data de início do período de monitoramento (formato: YYYY-MM-DD).
*   `end_date`: Data de fim do período de monitoramento (formato: YYYY-MM-DD).
*   `keywords`: Array de palavras-chave em formato JSON (ex: `["realme", "smartphone", "oferta"]`).
*   `country`: País do registro (ex: "Brasil", "Paraguai"). **[NOVO CAMPO]**
*   `type`: Tipo do registro (`keyword` ou `influencer`). **[NOVO CAMPO]**
*   `created`: Data de criação do registro.
*   `updated`: Data da última atualização.

### Lógica de Busca e Filtragem

**Processo em 2 Etapas:**

1.  **Filtro no Banco de Dados (PocketBase):**
    *   Utiliza o operador `~` (LIKE) para buscar conteúdos dentro do período especificado.
    *   Filtro aplicado: `date >= "YYYY-MM-DD 00:00:00" && date <= "YYYY-MM-DD 23:59:59" && (title ~ "palavra1" || title ~ "palavra2" || ...)`
    *   **Vantagem:** Busca eficiente em todo o histórico do banco, não limitada aos posts mais recentes.
    *   **Limitação:** O operador `~` faz busca por substring, podendo retornar falsos positivos (ex: "realme" encontra "realmente").

2.  **Refinamento em Memória (JavaScript/RegEx):**
    *   Aplica validação de **palavra completa** usando expressões regulares com word boundaries (`\b`).
    *   Regex aplicado: `/\bpalavra\b/i` (case-insensitive).
    *   **Resultado:** Elimina falsos positivos, garantindo que apenas palavras exatas sejam consideradas.
    *   **Exemplo:** "realme" aceita "Celular Realme 9" mas rejeita "isso aconteceu realmente".

**Campos Pesquisados:**
*   Apenas o campo `title` (legenda/caption) do conteúdo.
*   O campo `permalink` foi **removido** da busca para evitar falsos positivos de parâmetros de URL.

### Componentes Frontend

**1. Página de Listagem (`client/src/pages/Evidence.jsx`):**
*   Lista todos os registros de evidência criados.
*   Permite criar novos registros através de modal.
*   Permite deletar registros existentes.
*   Exibe preview das informações: título, período, e primeiras 3 palavras-chave.

**2. Dashboard de Evidência (`client/src/pages/EvidenceDashboard.jsx`):**
*   Exibe métricas agregadas do registro:
    *   Total de posts encontrados.
    *   Interações totais (likes + comments + shares + saved).
    *   Total de likes.
    *   Total de comentários.
*   Utiliza `ContentGrid` para exibir os conteúdos identificados com layout visual premium (cards com imagens).
*   **Funcionalidades:**
    *   Botão "Editar": Permite alterar título, datas e palavras-chave do registro.
    *   Botão "Imprimir Relatório": Gera versão imprimível do dashboard.
    *   Link externo nos cards: Acesso direto ao post original no Instagram.

**3. Serviço de Dados (`client/src/services/dataService.js`):**
*   `saveEvidenceRegistry(data)`: Cria ou atualiza um registro.
*   `getEvidenceRegistries()`: Lista todos os registros.
*   `deleteEvidenceRegistry(id)`: Remove um registro.
*   `getEvidenceRegistry(id)`: Busca detalhes de um registro específico.
*   `getEvidenceDashboardData(registryId)`: Gera dashboard com métricas e conteúdos filtrados.

### Fluxo de Uso

1.  **Criação:** Usuário acessa "Evidência" no menu lateral e clica em "Novo Registro".
2.  **Configuração:** Define título, período (datas) e palavras-chave separadas por vírgula.
3.  **Visualização:** Ao clicar no registro, é gerado automaticamente um dashboard com:
    *   Métricas agregadas dos posts encontrados.
    *   Grid visual de todos os conteúdos que mencionam as palavras-chave.
4.  **Edição:** Possibilidade de ajustar parâmetros (datas, palavras) e recarregar os resultados.
5.  **Exportação:** Opção de imprimir relatório para documentação.

