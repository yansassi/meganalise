/**
 * facebookApi.js
 * Serviço de integração com a Meta Graph API
 * Busca métricas diárias de página e conteúdo (posts + stories)
 */

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Configuração das páginas por país
const PAGE_CONFIGS = [
    {
        country: 'BR',
        pageId: process.env.FB_PAGE_ID_BRASIL,
        token: process.env.FB_PAGE_TOKEN_BRASIL,
        label: 'Mega Eletrônicos Paraguai'
    },
    {
        country: 'PY',
        pageId: process.env.FB_PAGE_ID_PARAGUAI,
        token: process.env.FB_PAGE_TOKEN_PARAGUAI,
        label: 'Mega Electrónicos Paraguay'
    }
];

// Mapeamento: métrica da API → nome interno no banco
const METRIC_MAP = {
    page_impressions_unique: 'reach',
    page_impressions:        'impressions',
    page_post_engagements:   'interactions',
    page_fans:               'followers_total',
    page_views_total:        'profile_visits',
    page_website_clicks:     'website_clicks'
};

const METRICS_TO_FETCH = Object.keys(METRIC_MAP).join(',');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const toISO = (dateStr) => new Date(dateStr + 'T12:00:00.000Z').toISOString();

const toUnixTimestamp = (dateStr) => Math.floor(new Date(dateStr).getTime() / 1000);

/**
 * Faz uma requisição à Graph API e retorna o JSON.
 * Lança erro com mensagem descritiva em caso de falha.
 */
const graphFetch = async (path, params = {}) => {
    const url = new URL(`${GRAPH_API_BASE}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());
    const json = await res.json();

    if (json.error) {
        throw new Error(`Graph API Error [${json.error.code}]: ${json.error.message}`);
    }

    return json;
};

/**
 * Retorna a configuração da página pelo country slug.
 */
const getPageConfig = (country) => {
    const config = PAGE_CONFIGS.find(c => c.country === country.toLowerCase());
    if (!config) throw new Error(`Configuração de página não encontrada para country: "${country}"`);
    if (!config.pageId || !config.token) throw new Error(`Token ou Page ID ausente para country: "${country}". Verifique o .env`);
    return config;
};

// ─────────────────────────────────────────────
// 1. Métricas Diárias da Página
// ─────────────────────────────────────────────

/**
 * Busca métricas diárias da página para um período.
 * Retorna array de { date, metric, value } compatível com facebook_daily_metrics.
 *
 * @param {string} country - 'brasil' | 'paraguai'
 * @param {string} since   - 'YYYY-MM-DD'
 * @param {string} until   - 'YYYY-MM-DD'
 */
const fetchPageMetrics = async (country, since, until) => {
    const config = getPageConfig(country);

    const data = await graphFetch(`/${config.pageId}/insights`, {
        metric: METRICS_TO_FETCH,
        period: 'day',
        since: toUnixTimestamp(since),
        until: toUnixTimestamp(until),
        access_token: config.token
    });

    const results = [];

    for (const metricObj of data.data) {
        const metricName = METRIC_MAP[metricObj.name];
        if (!metricName) continue;

        for (const entry of metricObj.values) {
            // end_time vem como ISO string "2026-04-23T07:00:00+0000"
            const date = entry.end_time
                ? entry.end_time.substring(0, 10)
                : null;

            if (!date) continue;

            const value = typeof entry.value === 'object'
                ? Object.values(entry.value).reduce((a, b) => a + b, 0)
                : (parseInt(entry.value) || 0);

            results.push({ date, metric: metricName, value });
        }
    }

    console.log(`[FB API] ${country}: ${results.length} pontos de métricas carregados (${since} → ${until})`);
    return results;
};

// ─────────────────────────────────────────────
// 2. Conteúdo — Posts
// ─────────────────────────────────────────────

/**
 * Busca posts publicados da página.
 * Retorna array normalizado compatível com facebook_content.
 */
const fetchPagePosts = async (country, since, until) => {
    const config = getPageConfig(country);

    const fields = [
        'id', 'message', 'story', 'created_time', 'permalink_url',
        'attachments{media_type,type}',
        'insights.metric(post_impressions_unique,post_impressions,post_reactions_by_type_total,post_clicks_unique){name,values}'
    ].join(',');

    let posts = [];
    let url = `/${config.pageId}/posts`;
    let params = {
        fields,
        since: toUnixTimestamp(since),
        until: toUnixTimestamp(until),
        limit: 100,
        access_token: config.token
    };

    // Paginação
    while (url) {
        const data = await graphFetch(url.startsWith('/') ? url : url.replace(GRAPH_API_BASE, ''), params);
        posts = posts.concat(data.data || []);

        // Próxima página
        url = data.paging?.next
            ? data.paging.next.replace(GRAPH_API_BASE, '')
            : null;
        params = {}; // next URL já tem todos os parâmetros embutidos
    }

    return posts.map(post => normalizePost(post, country, 'post'));
};

// ─────────────────────────────────────────────
// 3. Conteúdo — Stories
// ─────────────────────────────────────────────

/**
 * Busca stories publicados da página.
 * Retorna array normalizado compatível com facebook_content.
 */
const fetchPageStories = async (country) => {
    const config = getPageConfig(country);

    const data = await graphFetch(`/${config.pageId}/stories`, {
        fields: 'post_id,status,creation_time,media_type,url,media_id',
        limit: 100,
        access_token: config.token
    });

    const stories = data.data || [];

    return stories.map(story => ({
        id: story.post_id || story.media_id || `story-${story.creation_time}`,
        title: `Story - ${story.creation_time ? new Date(story.creation_time * 1000).toISOString().split('T')[0] : ''}`,
        author: '',
        date: story.creation_time
            ? new Date(story.creation_time * 1000).toISOString().split('T')[0]
            : null,
        permalink: story.url || '',
        platform: 'story',
        platform_type: 'story',
        media_type: story.media_type || 'unknown',
        country,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saved: 0,
        views: 0,
        clicks: 0,
        virality: 0,
        status: story.status || 'published'
    })).filter(s => s.date);
};

// ─────────────────────────────────────────────
// Helper: Normalizar post
// ─────────────────────────────────────────────

const normalizePost = (post, country, defaultPlatform = 'social') => {
    const mediaType = post.attachments?.data?.[0]?.media_type || '';
    const attachType = post.attachments?.data?.[0]?.type || '';

    let platform = defaultPlatform;
    if (mediaType === 'video' || attachType === 'video_inline') platform = 'video';
    else if (mediaType === 'photo' || attachType === 'photo') platform = 'image';

    // Extrair métricas dos insights
    const insightMap = {};
    for (const insight of (post.insights?.data || [])) {
        const val = insight.values?.[0]?.value;
        insightMap[insight.name] = typeof val === 'object'
            ? Object.values(val).reduce((a, b) => a + b, 0)
            : (parseInt(val) || 0);
    }

    const reach    = insightMap['post_impressions_unique'] || 0;
    const views    = insightMap['post_impressions'] || 0;
    const likes    = insightMap['post_reactions_by_type_total'] || 0;
    const clicks   = insightMap['post_clicks_unique'] || 0;

    return {
        id: post.id,
        title: post.message || post.story || 'Post sem legenda',
        author: '',
        date: post.created_time ? post.created_time.substring(0, 10) : null,
        permalink: post.permalink_url || '',
        platform,
        platform_type: platform,
        country,
        reach,
        views,
        likes,
        comments: 0,
        shares: 0,
        saved: 0,
        clicks,
        virality: reach > 0 ? ((likes + clicks) / reach * 100).toFixed(1) : 0,
        status: 'published'
    };
};

// ─────────────────────────────────────────────
// 4. Exportar configs para uso em outras rotas
// ─────────────────────────────────────────────

module.exports = {
    fetchPageMetrics,
    fetchPagePosts,
    fetchPageStories,
    PAGE_CONFIGS
};
