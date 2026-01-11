# Integração de Dados TikTok

Este documento detalha o planejamento para a integração dos arquivos CSV do TikTok ao sistema Meganalise.

## 📱 Visão Geral

O objetivo é processar as exportações de dados do TikTok e exibi-los na aba "TikTok" do sistema, mantendo consistência com a estrutura já existente para o Instagram.

## 📂 Mapeamento de Arquivos e Dados

### 1. `Content.csv` (Conteúdo Detalhado)

*   **Conteúdo:** Detalhes de cada vídeo publicado (Título, Link, Data, Curtidas, Comentários, Compartilhamentos, Visualizações).
*   **Mapeamento Banco de Dados:**
    *   **Coleção:** `tiktok_content` (Nova coleção sugerida)
    *   **Campos:**
        *   `original_id`: Extraído do `Video link` (parte numérica final).
        *   `title`: `Video title`.
        *   `permalink`: `Video link`.
        *   `post_time`: `Post time` (Data de publicação).
        *   `likes`: `Total likes`.
        *   `comments`: `Total comments`.
        *   `shares`: `Total shares`.
        *   `views`: `Total views`.
        *   `date_published`: Extraído de `Time` (Ex: "8 de janeiro") - *Atenção: Este campo parece ser a data da exportação ou referência, enquanto "Post time" é a data real da publicação.*
*   **Visualização (Frontend):**
    *   **Componente:** `ContentTable` (Aba TikTok).
    *   **Uso:** Listagem de vídeos com suas métricas de engajamento.

### 2. `Overview.csv` (Visão Geral Diária)

*   **Conteúdo:** Métricas diárias agregadas (Visualizações de vídeo, Visitas ao perfil, Curtidas, Comentários, Compartilhamentos).
*   **Mapeamento Banco de Dados:**
    *   **Coleção:** `tiktok_daily_metrics` (Nova coleção sugerida)
    *   **Métricas a extrair:**
        *   `video_views`: `Video Views`
        *   `profile_views`: `Profile Views`
        *   `likes`: `Likes`
        *   `comments`: `Comments`
        *   `shares`: `Shares`
    *   **Campos Comuns:** `date` (formatado), `platform` ('tiktok'), `metric` (nome da métrica), `value`.
*   **Visualização (Frontend):**
    *   **Componente:** `StatCards` (Totais) e `GrowthChart` (Evolução diária).

### 3. `Viewers.csv` (Visualizadores)

*   **Conteúdo:** Métricas diárias de espectadores, novos e recorrentes.
*   **Mapeamento Banco de Dados:**
    *   **Coleção:** `tiktok_daily_metrics`
    *   **Métricas a extrair:**
        *   `total_viewers`: `Total Viewers`
        *   `new_viewers`: `New Viewers`
        *   `returning_viewers`: `Returning Viewers`
*   **Visualização (Frontend):**
    *   **Componente:** Novo gráfico de "Retenção de Audiência" ou cartões adicionais.

### 4. `FollowerHistory.csv` (Histórico de Seguidores)

*   **Conteúdo:** Total de seguidores por dia e a diferença diária.
*   **Mapeamento Banco de Dados:**
    *   **Coleção:** `tiktok_daily_metrics`
    *   **Métricas a extrair:**
        *   `followers_total`: `Followers`
        *   `followers_change`: `Difference in followers from previous day` (cálculo de crescimento líquido).
*   **Visualização (Frontend):**
    *   **Componente:** `StatCards` (Total atual) e `GrowthChart` (Linha de seguidores).

### 5. `FollowerActivity.csv` (Atividade de Seguidores)

*   **Conteúdo:** Horários ativos dos seguidores (Data, Hora, Seguidores ativos).
*   **Mapeamento Banco de Dados:**
    *   **Coleção:** `tiktok_audience_activity` (Nova coleção sugerida ou estrutura JSON em `tiktok_audience_demographics`)
    *   **Estrutura:** Armazenar como JSON ou registros horários. JSON é preferível para reduzir volume de registros.
*   **Visualização (Frontend):**
    *   **Componente:** Mapa de Calor (Heatmap) de atividade ou Gráfico de Barras por hora.

### 6. `FollowerGender.csv` (Gênero)

*   **Conteúdo:** Distribuição percentual por gênero (Masculino, Feminino, Outro).
*   **Mapeamento Banco de Dados:**
    *   **Coleção:** `tiktok_audience_demographics` (Nova coleção sugerida)
    *   **Campos:** `type` ('gender'), `data` (JSON: `{"Male": 0.82, "Female": 0.17...}`).
*   **Visualização (Frontend):**
    *   **Componente:** Gráfico de Pizza (Pie Chart) em `AudienceView`.

### 7. `FollowerTopTerritories.csv` (Territórios)

*   **Conteúdo:** Distribuição por países.
*   **Mapeamento Banco de Dados:**
    *   **Coleção:** `tiktok_audience_demographics`
    *   **Campos:** `type` ('territory'), `data` (JSON: `{"BR": 0.919, "JP": 0.008...}`).
*   **Visualização (Frontend):**
    *   **Componente:** Lista ou Gráfico de Barras em `AudienceView`.

## ⚙️ Alterações Necessárias no Sistema

### Backend (PocketBase)

1.  **Novas Coleções:**
    *   `tiktok_daily_metrics`: Campos `platform` (select), `date` (date), `metric` (text), `value` (number).
    *   `tiktok_content`: Campos `original_id` (text), `title` (text), `permalink` (url), `thumbnail` (url - se disponível ou placeholder), `post_date` (date), `metrics` (json - likes, comments, etc).
    *   `tiktok_audience_demographics`: Campos `type` (select), `data` (json), `date_reference` (date).

### Backend (Node.js)

1.  **Parser (`parser.js`):**
    *   Implementar `parseTikTokCSV` para identificar e processar cada um dos 7 formatos de arquivo acima.
    *   Lógica de detecção baseada em cabeçalhos (ex: "Video link" -> Content, "Active followers" -> Activity).

2.  **Upload (`upload.js`):**
    *   Adicionar case para `platform === 'tiktok'` e rotear para o novo parser.

### Frontend (React)

1.  **Dashboard (`TikTokDashboard.jsx`):**
    *   Criar ou adaptar o `PlatformView` para suportar as especificidades do TikTok.
    *   Implementar visualização de retenção (Viewers) e atividade (Activity) que não existem no Instagram.

2.  **Upload:**
    *   Garantir que a seleção "TikTok" no upload envie a flag correta para o backend.

## 📝 Próximos Passos

1.  Criar as coleções no PocketBase.
2.  Implementar o parser no backend.
3.  Implementar a lógica de salvamento no backend.
4.  Testar o upload de cada arquivo.
5.  Atualizar o frontend para exibir os dados.
