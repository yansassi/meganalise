const Papa = require('papaparse');
const { TextDecoder } = require('util');

/**
 * Helper to decode buffer with BOM detection
 */
const decodeBuffer = (buffer) => {
    // Check for UTF-16LE BOM (0xFF 0xFE)
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return new TextDecoder('utf-16le').decode(buffer);
    }
    // Check for UTF-16BE BOM (0xFE 0xFF)
    else if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        return new TextDecoder('utf-16be').decode(buffer);
    }
    // Default to UTF-8
    return new TextDecoder('utf-8').decode(buffer);
};

/**
 * Normalizes daily metric data
 */
const normalizeDailyMetric = (data, metricName) => {
    return data.map(row => {
        // Find Date Key case-insensitive
        const dateKey = Object.keys(row).find(k => k.toLowerCase() === 'data' || k.toLowerCase() === 'date');
        const dateVal = row[dateKey];

        // Find Value Key: first key that is not the date key
        const valueKey = Object.keys(row).find(k => k !== dateKey);

        // Safety check
        if (!dateVal) return null;

        return {
            date: dateVal.split('T')[0] || dateVal,
            value: parseInt(row[valueKey] || 0, 10),
            metric: metricName
        };
    }).filter(item => item && item.date); // Filter nulls
};

const findValue = (row, candidates) => {
    const keys = Object.keys(row);
    // 1. Exact match
    for (const c of candidates) {
        if (row[c] !== undefined) return row[c];
    }
    // 2. Fuzzy match
    for (const key of keys) {
        const cleanKey = key.replace(/['"]/g, '').trim().toLowerCase();
        for (const c of candidates) {
            const cleanCandidate = c.toLowerCase();
            if (cleanKey === cleanCandidate) return row[key];
            if (cleanCandidate.length > 4 && cleanKey.includes(cleanCandidate)) return row[key];
        }
    }
    return undefined;
};

const normalizeContentData = (data, isUSFormat = false) => {
    return data.map((row, index) => {
        const reach = parseInt(findValue(row, ['Alcance', 'Reach']) || 0, 10);
        const likes = parseInt(findValue(row, ['Curtidas', 'Likes', 'Curtida', 'Like']) || 0, 10);
        const shares = parseInt(findValue(row, ['Compartilhamentos', 'Shares', 'Share']) || 0, 10);
        const comments = parseInt(findValue(row, ['Respostas', 'Comentários', 'Comments', 'Comentarios', 'Comentario', 'Comment', 'Res']) || 0, 10);
        const saved = parseInt(findValue(row, ['Salvamentos', 'Saved', 'Save']) || 0, 10);
        const views = parseInt(findValue(row, ['Visualizações', 'Views', 'Visualizacoes', 'View']) || 0, 10);
        const duration = parseInt(findValue(row, ['Duração (s)', 'Duration (s)', 'Duracao']) || 0, 10);
        const permalink = findValue(row, ['Link permanente', 'Permalink', 'Link']) || '';

        const engagements = likes + shares + comments + saved;
        const virality = reach > 0 ? ((engagements / reach) * 100).toFixed(1) : 0;
        const status = 'Completed';
        const id = findValue(row, ['Identificação do post', 'Identificador multimídia', 'Identificador', 'Post ID']) || `post-${index}`;

        let dateFormatted = null;
        const rawDate = findValue(row, ['Horário de publicação', 'Data', 'Date', 'Horario']);

        if (rawDate && rawDate !== 'Total') {
            try {
                const datePart = rawDate.split(' ')[0];
                if (datePart.includes('/')) {
                    const parts = datePart.split('/');
                    if (parts.length === 3) {
                        if (isUSFormat) {
                            dateFormatted = `${parts[2]}-${parts[0]}-${parts[1]}`;
                        } else {
                            dateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                    }
                } else {
                    dateFormatted = datePart;
                }
            } catch (e) {
                console.error('Date parsing error', rawDate);
            }
        }

        const rawType = (findValue(row, ['Tipo de post', 'Tipo de conteúdo', 'Tipo de conteÃºdo', 'Content type']) || '');
        const typeLower = rawType.toLowerCase();

        let platform = 'social';
        if (typeLower.includes('story')) {
            platform = 'story';
        } else if (typeLower.includes('reel') || typeLower.includes('video')) {
            platform = 'video';
        }

        let title = findValue(row, ['Descrição', 'TÃ\xadtulo da legenda', 'Legenda', 'Título/Legenda', 'Caption']);
        if (!title || title.trim() === '') {
            if (platform === 'story') {
                title = `Story - ${dateFormatted || 'Instagram'}`;
            } else {
                title = 'Post sem legenda';
            }
        }

        return {
            id, title, imageUrl: '', permalink, platform, manager: 'Time Social',
            date: dateFormatted, virality, status, reach, likes, shares, comments, saved, views, duration
        };
    });
};

const parseInstagramCSV = async (buffer, fileName) => {
    const csvText = decodeBuffer(buffer);
    const lines = csvText.split(/\r\n|\n/);

    let headerIndex = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('"data"') || line.includes('data,') || line.includes('data;') ||
            line.includes('"identificador') || line.includes('identificador') ||
            line.includes('alcance,') || line.includes('alcance;')) {
            headerIndex = i;
            break;
        }
    }

    const metadataLines = lines.slice(0, headerIndex).join('\n');
    const cleanCSV = lines.slice(headerIndex).join('\n');

    return new Promise((resolve, reject) => {
        Papa.parse(cleanCSV, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                const metadataLower = metadataLines.toLowerCase();
                const fileNameLower = fileName.toLowerCase();

                const hasColumn = (keyPart) => {
                    if (!data[0]) return false;
                    return Object.keys(data[0]).some(k => k.toLowerCase().includes(keyPart.toLowerCase()));
                };

                const isUSFilename = /^[a-z]{3}-\d{2}-\d{4}/i.test(fileNameLower);
                const hasContentColumns = hasColumn('permalink') || hasColumn('link permanente') || hasColumn('tipo de conte') || hasColumn('tipo de post') || hasColumn('identificação do post');

                if (isUSFilename || hasContentColumns || (data.length > 0 && typeof data[0]['Alcance'] !== 'undefined' && (hasColumn('curtidas') || hasColumn('respostas')))) {
                    resolve({ type: 'content', data: normalizeContentData(data, isUSFilename) });
                    return;
                }

                if (metadataLower.includes('alcance') || fileNameLower.includes('alcance') || (hasColumn('data') && hasColumn('alcance'))) {
                    resolve({ type: 'metric', metric: 'reach', data: normalizeDailyMetric(data, 'reach') });
                    return;
                }
                if (metadataLower.includes('intera') || fileNameLower.includes('interações') || fileNameLower.includes('interacoes') || (hasColumn('data') && hasColumn('intera'))) {
                    resolve({ type: 'metric', metric: 'interactions', data: normalizeDailyMetric(data, 'interactions') });
                    return;
                }
                if (fileNameLower.includes('seguidores') || (hasColumn('data') && hasColumn('seguidores'))) {
                    resolve({ type: 'metric', metric: 'followers', data: normalizeDailyMetric(data, 'followers') });
                    return;
                }
                if (fileNameLower.includes('visitas') || (hasColumn('data') && hasColumn('visitas'))) {
                    resolve({ type: 'metric', metric: 'profile_visits', data: normalizeDailyMetric(data, 'profile_visits') });
                    return;
                }
                if (fileNameLower.includes('visualizações') || fileNameLower.includes('visualizacoes') || (hasColumn('data') && hasColumn('visualiza'))) {
                    resolve({ type: 'metric', metric: 'impressions', data: normalizeDailyMetric(data, 'impressions') });
                    return;
                }
                if (metadataLower.includes('clique') || fileNameLower.includes('cliques') || (hasColumn('data') && hasColumn('cliques'))) {
                    resolve({ type: 'metric', metric: 'website_clicks', data: normalizeDailyMetric(data, 'website_clicks') });
                    return;
                }

                resolve({ type: 'unknown', data: [] });
            },
            error: (error) => reject(error),
        });
    });
};

module.exports = { parseInstagramCSV };
