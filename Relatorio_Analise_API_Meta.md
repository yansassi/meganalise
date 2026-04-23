# Relatório de Análise Exaustiva da API Graph da Meta vs Sistema Atual

## 1. Introdução

Este relatório tem como objetivo confrontar o "Relatório Exaustivo de Extração de Dados e Arquitetura da API Graph da Meta" fornecido com o estado atual da nossa aplicação (backend, base de dados PocketBase e frontend Dashboard.jsx), mapeando exatamente o que nossa infraestrutura suporta, o que exibe no momento e os hiatos existentes (o que está faltando) face às exigências e atualizações da Meta Graph API (v22.0+ a inícios de 2026).

## 2. Capacidades Analíticas da Graph API (Documentação vs Sistema)

O documento especifica um rol exaustivo de novas métricas, divisões qualitativas (breakdowns) e capacidades de moderação que a Graph API oferece, em contraste com a descontinuação de métricas legadas (como *impressions*).

Abaixo, detalhamos cada grande área e comparamos com o modelo atual.

### 2.1. O Fim das "Impressões" e a Ascensão do "Views"
- **API da Meta:** Determinou o encerramento da métrica `impressions` e derivadas para vídeos (`plays`, `clips_replays_count`, etc.) a partir de abril de 2025. Estabeleceu a métrica global `views` como padrão universal de medição de exposição para FEED, REELS e STORIES.
- **Nosso Sistema:**
  - **Recebendo:** Nossa coleção `instagram_content` e `facebook_content` já possui o campo `views`. No parser CSV, nós ainda extraímos `impressions` e `reach`.
  - **Mostrando:** O `Dashboard.jsx` atualmente exibe 'Alcance Total' (usando o campo `reach` via somatório de backend/frontend) e tem estatísticas para 'Acessos'/'Crescimento', mas não faz uma distinção forte ou focada unicamente no novo paradigma de `views` como mandatório, focando muito em engajamento geral.
  - **O que falta:** O pipeline deve parar de depender de relatórios CSV que trazem a coluna "impressions" para dados novos e migrar puramente para `views`.

### 2.2. Inventário Analítico Recente (Novas Métricas de Engajamento e Retenção)
A API expõe agora contadores muito profundos para o engajamento:
- **`reach` (Alcance Estimado):** Já é coletado e salvo pelo nosso sistema (`reach` em `instagram_content` e `facebook_content`). O `Dashboard.jsx` consome isso em 'Alcance Total'.
- **`total_interactions` (Interações Totais Totais):** Nosso sistema calcula `likes + comments + shares` no parser, mas não possui um campo unificado na API que traga a dedução da Meta de forma nativa.
- **`shares` / `saved`:** Já são recebidos (`shares`, `saved` nas tabelas `instagram_content`).
- **`follows` (Atrito Retentivo de Post) e `profile_visits`:** O nosso esquema atual de base de dados para o conteúdo de IG/FB **NÃO TEM** campos dedicados a `follows` e `profile_visits` gerados por um *content item* (post) individual, o que representa uma imensa perda na visão do funil de conversão.
- **`ig_reels_avg_watch_time` e `reels_skip_rate`:** O documento exalta a métrica de "taxa de salto de reels" (nos 3s) e tempo de retenção. Nossa tabela atual tem apenas `duration`, mas **NÃO POSSUI** `reels_skip_rate` nem `avg_watch_time` explícitos para o Instagram (temos `watch_time` para o Youtube no parser).
- **`reposts_count`, `crossposted_views`, `facebook_views`:** Métricas focadas em ecossistema cruzado para Reels lançadas no final de 2025. **NÃO ESTÃO** no nosso modelo de dados atual.

### 2.3. Ramificações Qualitativas (Breakdowns)
A Meta permite subdividir o tráfego gerado por *Stories* ou cliques em ações específicas:
- Cliques de intenção: `BIO_LINK_CLICKED`, `CALL`, `DIRECTION`, `EMAIL`, `TEXT`.
- Navegação de Story: `SWIPE_FORWARD`, `TAP_FORWARD`, `TAP_BACK`, `TAP_EXIT`.
- **Nosso Sistema:** O banco de dados (`instagram_daily_metrics`) armazena logs genéricos de métricas diárias como "valor" e "métrica", mas a arquitetura de `content` não absorve estes perfis detalhados de cliques ou tap flow de stories de forma transacional. Hoje o sistema se limita a contagens absolutas estáticas na tabela `instagram_content`.

### 2.4. Demografia e Business Discovery
- A permissão `instagram_basic` providencia acesso a dados massivos da conta como `followers_count`, `follows_count`, `media_count`. A arquitetura da API Graph também exige que esse rastreamento seja feito num polling server (registrando os seguidores ao longo do tempo).
- **Nosso Sistema:** Está extremamente bem servido aqui. As coleções de `_audience_demographics` têm o campo JSON `followers_history_data` e `similar_pages_data` para guardar as observações ao longo do tempo. O parser CSV de upload (upload.js) também consegue carregar as listas completas de cidades, países e gender_age.

### 2.5. Moderação Ativa e Automação (Webhooks e instagram_manage_comments)
- O relatório destaca a infraestrutura orientada a Webhooks e ações destrutivas (POST/DELETE em comentários, esconder comentários, respostas auto em DM).
- **Nosso Sistema:** Nosso sistema backend (Node.js/Express) é puramente de **ingestão passiva de dados CSV** (`upload.js`) e leitura para o `dashboard.js`. Nós não possuímos nenhuma rota para receber eventos de Webhook da Meta, tampouco temos fluxos lógicos ou tabelas em PocketBase para gerir os "replies", "direct messages" ou as árvores de comentários de forma ativa. Trata-se puramente de uma aplicação *Business Intelligence* passiva, não um *CRM Social/Moderação* operacional.

## 3. Resumo Executivo: O que o Sistema Exibe vs O que pode Receber

| Capacidade da API Meta | Status de Recepção no BD | Exibido no Frontend (Dashboard) |
|-------------------------|---------------------------|----------------------------------|
| **Views (Onipresente)** | Parcialmente Preparado (`views` em conteúdos). | Exibe Engajamentos/Acessos numéricos, não isola Views universalmente |
| **Reach (Alcance)** | ✅ Preparado e Funcional | ✅ Exibido (Alcance Total) |
| **Shares / Saved** | ✅ Preparado e Funcional | Exibido de forma indireta/somada |
| **Follows por Post** | ❌ Não existe coluna no esquema PocketBase | ❌ Não exibido |
| **Profile Visits por Post** | ❌ Não existe coluna no esquema PocketBase | ❌ Não exibido |
| **Taxa de Evasão Reels (Skip Rate)**| ❌ Não existe coluna no esquema PocketBase | ❌ Não exibido |
| **Retenção de Vídeo (Avg Watch Time)**| ❌ Não existe (apenas duração crua) | ❌ Não exibido |
| **Views Cruzadas e Reposts** | ❌ Não existe | ❌ Não exibido |
| **Demografia e Público** | ✅ Muito bem preparado (JSONs avançados) | O Dashboard foca nas grandes tendências de topo. |
| **Breakdowns (Cliques BIO, Swipe)** | ❌ Limitado, suporta apenas cliques brutos via Facebook | ❌ Não exibido |
| **Webhooks e Respostas/DMs** | ❌ Nenhuma rota/infraestrutura para isso | ❌ O painel é apenas de leitura visual |

## 4. Recomendações e Plano de Ação

Para alinhar plenamente a nossa infraestrutura corporativa ao novo cenário imposto pela Graph API da Meta v24.0 (2026), precisamos:

1. **Atualização do Schema de Conteúdos:** Adicionar à coleção `instagram_content` e `facebook_content` os campos ausentes vitais:
   - `reels_skip_rate` (Number)
   - `avg_watch_time` (Number)
   - `post_follows` (Number)
   - `profile_visits` (Number)
   - `reposts_count` (Number)
2. **Atualização do Frontend (Dashboard):** Implementar visualizações específicas para retenção em vídeos curtos ("reels_skip_rate" ou "Taxa de Rejeição de 3s"), pois esta métrica dita a penalidade algorítmica moderna.
3. **Desapegar de Impressões:** O Dashboard.jsx deve passar a sumarizar métricas focadas exclusivamente em `views` e `reach`, retirando métricas derivadas de `impressions` legadas.
4. **Avaliar Necessidade de Webhooks:** Se a ferramenta pretende dar o salto para "Automação de Respostas/Ações", será preciso arquitetar um *webhook handler* em `server/routes/webhooks.js` e novas coleções no banco de dados para espelhar a "Árvore de Comentários". Caso a ferramenta seja apenas analítica, a permissão `instagram_manage_comments` pode ser considerada um "excesso de privilégio", criando fricção atoa no App Review da Meta.
