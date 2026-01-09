# Estrutura dos Arquivos CSV (Completo)

Este documento detalha a estrutura de colunas de **TODOS** os arquivos CSV identificados na pasta `dados_fornecido`.

## 1. Dados de Comentários (`dados_comentarios`)
*   **Padrão:** Único para todas as redes.
*   **Separador:** `;` (Ponto e vírgula)
*   **Colunas:**
    *   `Nome`
    *   `Link_Perfil`
    *   `Comentario`
    *   `Likes`
    *   `E_Pergunta`
    *   `Status`

---

## 2. Facebook & Instagram (`dados_fornecido/facebook`, `/instagram`)
*   **Padrão:** Arquivos de Métrica Diária de Time-Series.
*   **Codificação:** UTF-16LE (Unicode)
*   **Separador:** `,` (Vírgula)

### Arquivos Identificados:
`Alcance.csv`, `Visualizações.csv`, `Seguidores.csv`, `Visitas.csv`, `Interações.csv`, `Cliques no link.csv`, etc.

### Estrutura Comum:

| Coluna | Descrição |
| :--- | :--- |
| `Data` | Data da métrica (ISO ou YYYY-MM-DD) |
| `Primary` | Valor da métrica principal do arquivo (ex: Alcance) |
| `Secondary` | (Opcional) Valor secundário (ex: Comparativo) |

### Arquivos de Distribuição (Demográficos):
`Público.csv`, `Faixa etária e gênero.csv`

**Estrutura:**
| Coluna | Descrição |
| :--- | :--- |
| `[Vazio]` | Rótulo (ex: "Mulheres", "18-24") |
| `[Valores]` | Colunas dinâmicas dependendo do arquivo |

---

## 3. TikTok (`dados_fornecido/tiktok`)

### 3.1 Métricas de Vídeo (`Content_...`)
*   **Arquivo:** `Content.csv`
*   **Codificação:** UTF-16LE
*   **Estrutura:**
    *   `Time`, `Video title`, `Video link`, `Post time`, `Total likes`, `Total comments`, `Total shares`, `Total views`

### 3.2 Visão Geral (`Overview_...`)
*   **Arquivo:** `Overview.csv`
*   **Codificação:** UTF-8
*   **Estrutura:**
    *   `Date`, `Video Views`, `Profile Views`, `Likes`, `Comments`, `Shares`

### 3.3 Seguidores (`Followers_...`)
*   **Arquivo:** `FollowerActivity.csv` (Atividade Horária)
    *   **Estrutura:** `Date`, `Hour`, `Active followers`
*   **Arquivo:** `FollowerGender.csv`
    *   **Estrutura:** `Gender`, `Distribution`
*   **Arquivo:** `FollowerTopTerritories.csv`
    *   **Estrutura:** `Top territories`, `Distribution`
*   **Arquivo:** `Viewers.csv` (Visualizadores - `Viewers_...`)
    *   **Estrutura:** `Date`, `Viewers`

---

## 4. YouTube (`dados_fornecido/youtube`)
Organizado por pastas temáticas (ex: Cidades, País, Gênero, Conteúdo).
*   **Codificação:** UTF-8
*   **Separador:** `,` (Vírgula)

### 4.1 Totais Diários (Em cada subpasta)
*   **Arquivo:** `Total.csv`
*   **Estrutura:**

| Coluna | Descrição |
| :--- | :--- |
| `Data` | Data do registro |
| `[Métrica Principal]` | O nome da coluna varia conforme a pasta (ex: Impressões, Visualizações) |

### 4.2 Detalhamento (Breakdown - `breakdown_metrics`)
*   **Arquivo:** `Dados da tabela.csv`
*   **Estrutura:** A primeira coluna define a Dimensão (o que está sendo analisado), as demais são métricas.

**Exemplo (Pasta Cidades):**
*   Cidades (Dimensão)
*   Nome da cidade (Dimensão)
*   Visualizações
*   Tempo de exibição (horas)
*   Duração média da visualização

**Exemplo (Pasta Conteúdo):**
*   Conteúdo (ID do Vídeo?)
*   Título do vídeo
*   Horário de publicação
*   Visualizações, Inscritos, Impressões...

---

## 5. Estratégia de Banco de Dados
Para suportar essa variabilidade, o banco terá 3 estruturas principais:

1.  **`metrics_daily_log`**: Para todos os arquivos que possuem Data + Valor (Facebook, Instagram, TikTok Overview, YouTube Total).
2.  **`content_items` + snapshot**: Para performance de vídeos individuais (TikTok Content, YouTube Tabela de Conteúdo).
3.  **`breakdown_metrics`**: Para dados demográficos e geográficos (Tiktok Followers/Territories, YouTube Cidades/Gênero).
    *   **Campos:** `Dimension` ("City", "Gender"), `Label` ("Rio de Janeiro", "Female"), `Metric`, `Value`.
