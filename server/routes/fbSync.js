/**
 * fbSync.js
 * Rota POST /api/facebook/sync
 * Sincroniza métricas e conteúdo do Facebook via Meta Graph API
 * e salva no PocketBase (facebook_daily_metrics + facebook_content)
 */

const express = require('express');
const { pb } = require('../services/db');
const { fetchPageMetrics, fetchPagePosts, fetchPageStories } = require('../services/facebookApi');

const router = express.Router();

// ─────────────────────────────────────────────
// Helpers de upsert no PocketBase
// ─────────────────────────────────────────────

/**
 * Upsert em lote para facebook_daily_metrics.
 * Evita duplicatas por (date + metric + country).
 */
const upsertDailyMetrics = async (metrics, country) => {
    if (metrics.length === 0) return { saved: 0, errors: [] };

    const saved = { count: 0 };
    const errors = [];

    // Pré-busca por range de datas para evitar N+1
    const dates = metrics.map(m => m.date).sort();
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    let existing = [];
    try {
        existing = await pb.collection('facebook_daily_metrics').getFullList({
            filter: `country = "${country}" && date >= "${minDate} 00:00:00" && date <= "${maxDate} 23:59:59"`,
            requestKey: null
        });
    } catch (e) {
        console.warn('[FB Sync] Aviso: falha ao pré-buscar métricas existentes:', e.message);
    }

    const existingMap = new Map();
    for (const rec of existing) {
        const key = `${rec.date.substring(0, 10)}_${rec.metric.toLowerCase()}`;
        existingMap.set(key, rec);
    }

    const BATCH = 30;
    for (let i = 0; i < metrics.length; i += BATCH) {
        const chunk = metrics.slice(i, i + BATCH);

        await Promise.all(chunk.map(async (item) => {
            try {
                const key = `${item.date}_${item.metric.toLowerCase()}`;
                const existing = existingMap.get(key);

                const recordData = {
                    platform: 'facebook',
                    date: new Date(item.date + 'T12:00:00.000Z').toISOString(),
                    metric: item.metric,
                    value: item.value,
                    country
                };

                if (existing) {
                    await pb.collection('facebook_daily_metrics').update(existing.id, recordData, { requestKey: null });
                } else {
                    await pb.collection('facebook_daily_metrics').create(recordData, { requestKey: null });
                }
                saved.count++;
            } catch (e) {
                console.error(`[FB Sync] Erro métrica ${item.metric} ${item.date}:`, e.message);
                errors.push(`${item.metric} ${item.date}: ${e.message}`);
            }
        }));
    }

    return { saved: saved.count, errors };
};

/**
 * Upsert em lote para facebook_content.
 * Evita duplicatas por original_id.
 */
const upsertContent = async (items, country) => {
    if (items.length === 0) return { saved: 0, errors: [] };

    const saved = { count: 0 };
    const errors = [];
    const BATCH = 30;

    for (let i = 0; i < items.length; i += BATCH) {
        const chunk = items.slice(i, i + BATCH);
        const ids = chunk.map(c => c.id).filter(Boolean);

        let existingMap = new Map();
        if (ids.length > 0) {
            try {
                const filter = ids.map(id => `original_id = "${id}"`).join(' || ');
                const found = await pb.collection('facebook_content').getFullList({
                    filter: `(${filter}) && country = "${country}"`,
                    requestKey: null,
                    fields: 'id,original_id'
                });
                found.forEach(r => existingMap.set(r.original_id, r));
            } catch (e) {
                console.warn('[FB Sync] Aviso: falha ao pré-buscar conteúdo existente:', e.message);
            }
        }

        await Promise.all(chunk.map(async (item) => {
            if (!item.id || !item.date) return;

            try {
                const payload = {
                    original_id: item.id,
                    title: item.title || 'Sem legenda',
                    permalink: item.permalink || '',
                    platform_type: item.platform_type || item.platform || 'social',
                    social_network: 'facebook',
                    country,
                    date: new Date(item.date + 'T12:00:00.000Z').toISOString(),
                    reach: item.reach || 0,
                    likes: item.likes || 0,
                    shares: item.shares || 0,
                    comments: item.comments || 0,
                    saved: item.saved || 0,
                    views: item.views || 0,
                    clicks: item.clicks || 0,
                    virality: parseFloat(item.virality) || 0,
                    status: item.status || 'published',
                    author: item.author || '',
                    media_type: item.platform || item.platform_type || 'social'
                };

                const existing = existingMap.get(item.id);
                if (existing) {
                    await pb.collection('facebook_content').update(existing.id, payload, { requestKey: null });
                } else {
                    await pb.collection('facebook_content').create(payload, { requestKey: null });
                }
                saved.count++;
            } catch (e) {
                console.error(`[FB Sync] Erro conteúdo ${item.id}:`, e.message);
                errors.push(`content ${item.id}: ${e.message}`);
            }
        }));
    }

    return { saved: saved.count, errors };
};

// ─────────────────────────────────────────────
// POST /api/facebook/sync
// Body: { country, since?, until?, syncContent? }
// ─────────────────────────────────────────────

router.post('/sync', async (req, res) => {
    try {
        const { country, since, until, syncContent = true } = req.body;

        if (!country) {
            return res.status(400).json({ error: '"country" é obrigatório (brasil ou paraguai)' });
        }

        // Período padrão: últimos 30 dias
        const today = new Date().toISOString().split('T')[0];
        const sinceDate = since || (() => {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return d.toISOString().split('T')[0];
        })();
        const untilDate = until || today;

        console.log(`[FB Sync] Iniciando sync para "${country}" | ${sinceDate} → ${untilDate}`);

        const summary = {
            country,
            period: { since: sinceDate, until: untilDate },
            metrics: { saved: 0, errors: [] },
            posts: { saved: 0, errors: [] },
            stories: { saved: 0, errors: [] }
        };

        // 1. Métricas diárias da página
        try {
            const metrics = await fetchPageMetrics(country, sinceDate, untilDate);
            summary.metrics = await upsertDailyMetrics(metrics, country);
            console.log(`[FB Sync] Métricas: ${summary.metrics.saved} salvas`);
        } catch (e) {
            console.error('[FB Sync] Erro ao buscar métricas:', e.message);
            summary.metrics.errors.push(e.message);
        }

        // 2. Posts (opcional, mas ativado por padrão)
        if (syncContent) {
            try {
                const posts = await fetchPagePosts(country, sinceDate, untilDate);
                summary.posts = await upsertContent(posts, country);
                console.log(`[FB Sync] Posts: ${summary.posts.saved} salvos`);
            } catch (e) {
                console.error('[FB Sync] Erro ao buscar posts:', e.message);
                summary.posts.errors.push(e.message);
            }

            // 3. Stories (sem filtro de data — API retorna os mais recentes)
            try {
                const stories = await fetchPageStories(country);
                summary.stories = await upsertContent(stories, country);
                console.log(`[FB Sync] Stories: ${summary.stories.saved} salvos`);
            } catch (e) {
                console.error('[FB Sync] Erro ao buscar stories:', e.message);
                summary.stories.errors.push(e.message);
            }
        }

        const totalErrors = [
            ...summary.metrics.errors,
            ...summary.posts.errors,
            ...summary.stories.errors
        ];

        res.json({
            success: true,
            summary,
            errors: totalErrors.length > 0 ? totalErrors : undefined
        });

    } catch (err) {
        console.error('[FB Sync] Erro geral:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/facebook/sync/all
// Sincroniza todas as páginas de uma vez
// ─────────────────────────────────────────────

router.post('/sync/all', async (req, res) => {
    const { since, until, syncContent = true } = req.body;
    const countries = ['brasil', 'paraguai'];

    const results = [];
    for (const country of countries) {
        try {
            // Reutiliza a lógica do /sync mas internamente
            const today = new Date().toISOString().split('T')[0];
            const sinceDate = since || (() => {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                return d.toISOString().split('T')[0];
            })();
            const untilDate = until || today;

            const { fetchPageMetrics, fetchPagePosts, fetchPageStories } = require('../services/facebookApi');

            const [metricsData, postsData, storiesData] = await Promise.allSettled([
                fetchPageMetrics(country, sinceDate, untilDate),
                syncContent ? fetchPagePosts(country, sinceDate, untilDate) : Promise.resolve([]),
                syncContent ? fetchPageStories(country) : Promise.resolve([])
            ]);

            const metrics = metricsData.status === 'fulfilled' ? await upsertDailyMetrics(metricsData.value, country) : { saved: 0, errors: [metricsData.reason?.message] };
            const posts   = postsData.status   === 'fulfilled' ? await upsertContent(postsData.value, country)   : { saved: 0, errors: [postsData.reason?.message] };
            const stories = storiesData.status === 'fulfilled' ? await upsertContent(storiesData.value, country) : { saved: 0, errors: [storiesData.reason?.message] };

            results.push({ country, metrics, posts, stories });
        } catch (e) {
            results.push({ country, error: e.message });
        }
    }

    res.json({ success: true, results });
});

module.exports = router;
