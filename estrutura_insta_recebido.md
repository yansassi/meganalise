
# Estrutura de Dados Recebidos - Instagram

Este documento define a estrutura exata dos arquivos CSV exportados do Instagram e importados pelo sistema. Qualquer atualização nos modelos de importação deve ser refletida aqui.

## Localização Padrão
Os arquivos devem ser carregados através da interface da plataforma (aba Instagram) ou colocados na pasta:
`dados_fornecido/instagram/`

## 1. Métricas Diárias (Séries Temporais)

Estes arquivos contêm métricas evolutivas diárias.

### Padrão Geral
- **Formato**: CSV
- **Header Especial**: Os arquivos geralmente iniciam com `sep=,` na primeira linha para forçar o Excel a reconhecer o separador. O parser do sistema deve ignorar essa linha.
> [!WARNING]
> Ainda não sabemos exatamente por que a plataforma exporta com `sep=,` no início, mas é um comportamento padrão observado. O sistema está preparado para lidar com isso.

- **Separador**: Vírgula (`,`) ou Ponto e Vírgula (`;`) dependendo da região, mas o parser tratará ambos.
- **Header Obrigatório**: `"Data"` e pelo menos uma coluna de valor (geralmente `"Primary"` ou o nome da métrica).

### Arquivos Específicos

#### `Alcance.csv`
- **Métrica no Banco**: `reach`
- **Estrutura Esperada**:
  ```csv
  "Data","Primary"
  "2025-10-08T00:00:00","1234"
  ```
- **Obs**: A coluna "Primary" contém o valor do alcance diário.

#### `Interações.csv`
- **Métrica no Banco**: `interactions`
- **Estrutura Esperada**:
  ```csv
  "Data","Primary"
  "2025-10-08T00:00:00","56"
  ```

#### `Seguidores.csv`
- **Métrica no Banco**: `followers` (Novos seguidores)
- **Estrutura Esperada**:
  ```csv
  "Data","Primary"
  "2025-10-08T00:00:00","10"
  ```

#### `Visitas.csv`
- **Métrica no Banco**: `profile_visits`
- **Estrutura Esperada**:
  ```csv
  "Data","Primary"
  "2025-10-08T00:00:00","100"
  ```

#### `Visualizações.csv` (Impressões)
- **Métrica no Banco**: `impressions`
- **Estrutura Esperada**:
  ```csv
  "Data","Primary"
  "2025-10-08T00:00:00","2000"
  ```

#### `Cliques no link.csv`
- **Métrica no Banco**: `website_clicks`
- **Estrutura Esperada**:
  ```csv
  "Data","Primary"
  "2025-10-08T00:00:00","5"
  ```

---

## 2. Exportação de Conteúdo (Posts/Reels)

Arquivo contendo a lista de publicações e suas métricas individuais.

### Padrão de Nome
Geralmente nomeado com o intervalo de datas, ex: `Jan-10-2025_Jan-08-2026_1416659706530207.csv`.

### Estrutura e Mapeamento
O sistema procura por colunas específicas (em Português) para mapear para o banco de dados `instagram_content`.

| Coluna no CSV (PT) | Campo no Banco | Descrição |
| :--- | :--- | :--- |
| `Identificador cont.` ou `Identificador` | `original_id` | ID único do post/link |
| `Título da legenda` ou `Legenda` | `title` | Texto da legenda do post |
| `Permalink` | `image_url` | Link do post (usado como img provisória) |
| `Tipo de conteúdo` | `platform_type` | Se contém "Reel" -> `video`, senão `social` |
| `Data` | `date` | Data da publicação |
| `Alcance` | `reach` | Alcance total |
| `Curtidas` | `likes` | Número de curtidas |
| `Compartilhamentos` | `shares` | Número de compartilhamentos |
| `Respostas` | `comments` | Número de comentários |

### Exemplo de CSV
```csv
"Título da legenda","Permalink","Tipo de conteúdo","Data","Alcance","Curtidas","Compartilhamentos","Respostas"
"Legenda do post...","https://instagram.com/p/...","Imagem","10/01/2025 10:00","1500","100","20","5"
```
