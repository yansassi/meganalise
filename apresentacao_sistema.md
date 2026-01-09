# Meganalise Pro: Apresentação do Sistema

**Meganalise Pro** é uma plataforma centralizada de inteligência de dados (Business Intelligence) voltada para mídias sociais. O sistema unifica dados dispersos de múltiplas redes (YouTube, Instagram, Facebook, TikTok) em um único dashboard interativo, permitindo análises profundas que as ferramentas nativas não oferecem de forma integrada.

---

## 🚀 Como Funciona

O sistema opera em um fluxo de três etapas principais, transformando dados brutos em insights visuais:

1.  **Ingestão Universal (Importação):**
    *   O usuário exporta arquivos CSV brutos das plataformas (YouTube Studio, Meta Business Suite, TikTok Analytics).
    *   O sistema aceita esses arquivos "como estão" (sem necessidade de edição manual), identificando automaticamente a origem (ex: reconhece se é um relatório de "Cidades" do YouTube ou "Seguidores" do TikTok).

2.  **Processamento e Normalização (O "Cérebro"):**
    *   Os dados são limpos e padronizados. Por exemplo, "Visualizações" (YouTube) e "Views" (TikTok) são unificados numa métrica comum de "Impressões/Alcance".
    *   O sistema cruza dados de diferentes fontes. Ele sabe que o vídeo "A" no TikTok corresponde à mesma campanha do vídeo "B" no Instagram.

3.  **Visualização (Dashboard):**
    *   Uma interface web interativa exibe gráficos de evolução temporal, mapas de calor de audiência e tabelas de desempenho de conteúdo.

---

## 📊 O Que O Sistema Faz (Funcionalidades)

### 1. Centralização de Métricas (Time-Series)
*   **Histórico Unificado:** Acompanhe a evolução diária, semanal e mensal de Alcance, Engajamento e Seguidores de todas as redes em um único gráfico.
*   **Comparativo de Plataformas:** Entenda qual rede está crescendo mais rápido ou retendo mais público.

### 2. Análise de Conteúdo Profunda
*   **Rastreamento Individual:** Cada vídeo ou post é catalogado.
*   **Performance Real:** Identifique quais conteúdos "viralizaram" cruzando Views vs. Retenção vs. Engajamento.
*   **Thumbnails e Títulos:** O sistema armazena títulos e capas para permitir análise visual do que chama mais atenção.

### 3. Raio-X da Audiência (Demografia e Geografia)
*   **Breakdown Granular:** O sistema processa arquivos de demografia para responder: "Quem é meu público?".
*   **Segmentation:** Analise por Idade, Gênero, Cidade e País.
*   ** Cruzamento:** Descubra se seu público no TikTok é mais jovem que no Facebook, ou se o YouTube atinge regiões geográficas diferentes.

### 4. Inteligência de Comentários (Feedback Loop)
*   **Central de Feedback:** Importa comentários de todos os canais.
*   **Classificação Automática:** Identifica se um comentário é uma **Pergunta**, um **Elogio** ou uma **Crítica**.
*   **Status de Resposta:** Controla o que já foi respondido, garantindo que nenhum fã fique sem atenção.

---

## 💡 Potencial de Dados: O Que Podemos Descobrir?

Com a estrutura de dados atual (`csv_structures.md`), o sistema permite responder perguntas estratégicas complexas:

*   **Otimização de Horário:** Cruzando dados de "Atividade Horária" (TikTok/Insta), o sistema pode sugerir o **Melhor Horário Global** para postar.
*   **Eficácia de Conteúdo:** "Vídeos longos funcionam melhor no YouTube ou no Facebook?" (Cruzando duração média de visualização).
*   **Retenção vs. Viralidade:** "Muitos views, mas pouco tempo assistido?" O sistema alerta sobre títulos "clickbait" que não seguram a audiência.
*   **Expansão Geográfica:** Identificar cidades onde a marca é forte organicamente para focar campanhas de tráfego pago (Ads).

---

## 🛠️ Stack Tecnológico
*   **Frontend:** React (Rápido, Interativo, Moderno).
*   **Backend:** PocketBase (Seguro, Escalável, Banco de Dados em Tempo Real).
*   **Hospedagem:** VPS Própria (Controle total dos dados e privacidade).

O **Meganalise Pro** transforma planilhas estáticas em uma máquina de decisões estratégicas.
