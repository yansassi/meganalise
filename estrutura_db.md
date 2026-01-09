# Schema do Banco de Dados - Meganalise Pro

Este documento define a estrutura do banco de dados para o projeto Meganalise Pro usando PocketBase.

## Visão Geral
O banco de dados foi projetado para armazenar métricas de mídias sociais, registros de conteúdo e configurações de plataforma. Ele é otimizado para dados de séries temporais (métricas) e dados relacionais (plataformas, itens de conteúdo).

## Coleções

### 1. `platforms` (plataformas)
Armazena as plataformas de mídia social gerenciadas pelo sistema.

*   **Tipo:** Base
*   **Regras de API:**
    *   Listar/Pesquisar (List/Search): Público
    *   Visualizar (View): Público
    *   Criar (Create): Apenas Admin (típico)
    *   Atualizar (Update): Apenas Admin
    *   Excluir (Delete): Apenas Admin

| Nome do Campo | Tipo | Opções/Notas |
| :--- | :--- | :--- |
| `id` | System | Gerado automaticamente |
| `name` | Text | ex: "YouTube", "Instagram" |
| `idiom` | Text | Código da variante da plataforma, ex: "yt", "ig" |
| `icon` | Text/File | URL ou arquivo de ícone enviado |
| `theme_color` | Text | Código de cor Hex (ex: `#FF0000`) |

---

### 2. `instagram_daily_metrics`
Armazena métricas diárias do Instagram importadas via CSV.

*   **Tipo:** Base
*   **Regras de API:** Público (Create/View/List/Update/Delete)
*   **Formato**: Long (Uma linha por métrica por dia)

| Nome do Campo | Tipo | Opções/Notas |
| :--- | :--- | :--- |
| `id` | System | Gerado automaticamente |
| `platform` | Text | "instagram" |
| `date` | Date/Time | Data da métrica |
| `metric` | Text | Nome da métrica (ex: "reach", "interactions") |
| `value` | Number | Valor da métrica |
| `country` | Text | País (ex: "AO", "BR", "PT") |

> [!NOTE]
> **Controle de Duplicidade:** O sistema backend aplica uma lógica de verificação antes de salvar. Ele busca registros existentes baseados na data (intervalo do dia), métrica, país e plataforma. Se encontrar, ele **atualiza** o registro existente e **remove** quaisquer duplicatas excedentes para garantir a integridade dos dados e evitar soma incorreta de valores.

---

### 3. `instagram_content`
Armazena posts e vídeos do Instagram.

*   **Tipo:** Base
*   **Regras de API:** Público (Create/View/List/Update/Delete)

| Nome do Campo | Tipo | Opções/Notas |
| :--- | :--- | :--- |
| `id` | System | Gerado automaticamente |
| `original_id` | Text | ID original/link |
| `title` | Text | Legenda/Título |
| `image_url` | Text | URL da capa/imagem |
| `platform_type` | Select | "social" ou "video" |
| `date` | Date/Time | Data de publicação |
| `reach` | Number | Alcance |
| `likes` | Number | Curtidas |
| `shares` | Number | Compartilhamentos |
| `comments` | Number | Comentários |
| `virality_score` | Number | Score de viralidade |
| `country` | Text | País |
| `status` | Text | Status interno |
| `saved` | Number | Quantidade de salvamentos |
| `views` | Number | Quantidade de visualizações |
| `duration` | Number | Duração em segundos |
| `permalink` | Text | Link permanente do post |

---

### 5. `comments_log` (log_comentarios)
Armazena comentários importados para análise de sentimento e rastreamento de perguntas e respostas.

*   **Tipo:** Base
*   **Regras de API:** Público

| Nome do Campo | Tipo | Opções/Notas |
| :--- | :--- | :--- |
| `id` | System | Gerado automaticamente |
| `platform` | Relation | Relação única para `platforms` |
| `nome` | Text | Nome de exibição do usuário |
| `profile_link` | Text | Link para o perfil do usuário |
| `comment` | Text | O texto do comentário |
| `likes` | Number | Contagem de curtidas no comentário |
| `is_question` | Bool | Flag processada: é uma pergunta? |
| `status` | Text | Status da resposta (ex: "Pendente", "Respondido") |

---

### 6. `print_analysis_log` (log_analise_print)
(Uso Futuro) Armazena resultados de análises de prints/capturas de tela enviados.

*   **Tipo:** Base
*   **Regras de API:** Público

| Nome do Campo | Tipo | Opções/Notas |
| :--- | :--- | :--- |
| `id` | System | Gerado automaticamente |
| `image` | File | O print enviado |
| `analysis_text` | Text | Análise gerada por IA |
| `created` | Date/Time | Gerado automaticamente |
