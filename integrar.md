# Plano de Integração: Dados de Público (Instagram)

Status: **Pendente**
Arquivo Alvo: `dados_fornecido/instagram/Público.csv`

## 1. Análise do Arquivo
O arquivo `Público.csv` difere dos demais por não ser uma série temporal simples. Ele contém "snapshots" de demografia com múltiplos blocos de dados distintos no mesmo arquivo:
- **Faixa Etária e Gênero:** Matriz de porcentagens.
- **Principais Cidades:** Lista ordenadas.
- **Principais Países:** Lista ordenada.

## 2. Necessidades de Backend (`server/`)

### A. Atualizar Parser (`services/parser.js`)
É necessário implementar uma nova lógica de parsing (`parseDemographics`?):
- **Detectar Arquivo:** Identificar cabeçalhos como "Faixa etária e gênero", "Principais cidades".
- **Extrair Blocos:** O parser precisa ler o arquivo linha a linha (não apenas `Papa.parse` direto) para separar as seções.
- **Normalizar Dados:**
  - `gender_age`: Transformar em JSON/Objeto `{ "18-24": { "female": 3.2, "male": 3.3 }, ... }`.
  - `top_cities`: Transformar em Array `[{ city: "São Paulo", value: 6.92 }, ...]`.
  - `top_countries`: Transformar em Array.

### B. Atualizar Banco de Dados (PocketBase)
A coleção `instagram_audience_demographics` já existe no esquema, mas precisa ser verificada se suporta a estrutura de dados complexa ou se usaremos campos JSON.
- **Campos Sugeridos:**
  - `gender_age_data` (JSON)
  - `cities_data` (JSON)
  - `countries_data` (JSON)
  - `import_date` (Date) - Para manter histórico de como a audiência mudou.

### C. Atualizar Rota de Upload (`routes/upload.js`)
- Adicionar tratamento para `result.type === 'demographics'`.
- Salvar/Atualizar na coleção `instagram_audience_demographics`.

## 3. Necessidades de Frontend (`client/`)

### A. Novos Componentes de Visualização
Criar seção "Público" no `PlatformView.jsx` ou uma nova aba "Audiência":
- **Gráfico de Pirâmide Etária:** Para exibir Faixa Etária x Gênero.
- **Gráfico de Barras/Mapa:** Para "Principais Cidades" e "Países".

### B. Serviço de Dados
- Atualizar `dataService.js` para buscar os dados demográficos mais recentes do endpoint.

---

# Plano de Integração: Formatos de Conteúdo (Instagram)

Status: **Pendente (Baixa Prioridade)**
Arquivo Alvo: `dados_fornecido/instagram/Principais formatos de conteúdo.csv`

## 1. Análise do Arquivo
O arquivo contém apenas contagens totais (`Posts`, `Stories`) no período.

## 2. Recomendação
**Não Integrar Diretamente.**
A aplicação já importa a lista detalhada de posts via CSV de Conteúdo (`instagram_content`). É mais eficiente calcular a quantidade de Posts e Stories contando os registros no banco de dados (`instagram_content`) do que criar uma lógica para importar este CSV agregado que pode gerar inconsistência.

## 3. Ação Alternativa
- Apenas garantir que a importação de **Conteúdo** esteja funcionando 100%.
- O `PlatformView.jsx` já faz a contagem de `reels` e `stories` baseada nos itens carregados.
