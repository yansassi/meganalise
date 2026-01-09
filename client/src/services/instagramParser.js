import Papa from 'papaparse';

/**
 * Parses a CSV file and returns the data.
 * @param {File} file 
 * @returns {Promise<any[]>}
 */
const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        // First read as ArrayBuffer to check for BOM (Byte Order Mark)
        reader.onload = (event) => {
            const buffer = event.target.result;
            const view = new DataView(buffer);
            let decoder;

            // Check for UTF-16LE BOM (0xFF 0xFE)
            if (view.byteLength >= 2 && view.getUint8(0) === 0xFF && view.getUint8(1) === 0xFE) {
                decoder = new TextDecoder('utf-16le');
            }
            // Check for UTF-16BE BOM (0xFE 0xFF)
            else if (view.byteLength >= 2 && view.getUint8(0) === 0xFE && view.getUint8(1) === 0xFF) {
                decoder = new TextDecoder('utf-16be');
            }
            // Default to UTF-8
            else {
                decoder = new TextDecoder('utf-8');
            }

            const csvText = decoder.decode(buffer);

            // Pre-process to handle "sep=," and metadata lines
            const lines = csvText.split(/\r\n|\n/);

            // Find the index of the header line
            // for Daily Metrics: "Data","Primary"
            // for Content: "Identificador..." or "Alcance"
            let headerIndex = 0;

            for (let i = 0; i < Math.min(lines.length, 10); i++) {
                const line = lines[i].toLowerCase();
                // Check assuming quotes might be removed or present depending on csv structure
                if (line.includes('"data"') || line.includes('data,') || line.includes('data;') ||
                    line.includes('"identificador') || line.includes('identificador') ||
                    line.includes('alcance,') || line.includes('alcance;')) {
                    headerIndex = i;
                    break;
                }
            }

            // Capture metadata lines (everything before header)
            const metadataLines = lines.slice(0, headerIndex).join('\n');

            // Re-join from the header line onwards
            const cleanCSV = lines.slice(headerIndex).join('\n');

            Papa.parse(cleanCSV, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve({ data: results.data, metadata: metadataLines }),
                error: (error) => reject(error),
            });
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Normalizes daily metric data (Reach, Interactions, etc.)
 * Expects CSV with "Data" and "Primary" (or similar value column)
 */
const normalizeDailyMetric = (data, metricName) => {
    return data.map(row => {
        // Find the value column (it might be "Primary" or specific name)
        const valueKey = Object.keys(row).find(k => k !== 'Data');
        return {
            date: row['Data']?.split('T')[0] || row['Data'], // formatting 2025-10-08T00:00:00 -> 2025-10-08
            value: parseInt(row[valueKey] || 0, 10),
            metric: metricName
        };
    }).filter(item => item.date);
};

/**
 * Normalizes content export data
 */
const findValue = (row, candidates) => {
    const keys = Object.keys(row);
    // 1. Exact match attempt
    for (const c of candidates) {
        if (row[c] !== undefined) return row[c];
    }

    // 2. Fuzzy match attempt (normalized keys)
    for (const key of keys) {
        const cleanKey = key.replace(/['"]/g, '').trim().toLowerCase();
        for (const c of candidates) {
            const cleanCandidate = c.toLowerCase();
            // Strict match first
            if (cleanKey === cleanCandidate) return row[key];
            // Partial match if candidate is long enough to be unique (e.g. 'coment')
            if (cleanCandidate.length > 4 && cleanKey.includes(cleanCandidate)) return row[key];
        }
    }
    return undefined;
};

const normalizeContentData = (data, isUSFormat = false) => {
    return data.map((row, index) => {
        // Field Mappers with multiple candidates
        const reach = parseInt(findValue(row, ['Alcance', 'Reach']) || 0, 10);
        const likes = parseInt(findValue(row, ['Curtidas', 'Likes', 'Curtida', 'Like']) || 0, 10);
        const shares = parseInt(findValue(row, ['Compartilhamentos', 'Shares', 'Share']) || 0, 10);
        const comments = parseInt(findValue(row, ['Respostas', 'Comentários', 'Comments', 'Comentarios', 'Comentario', 'Comment', 'Res']) || 0, 10);
        const saved = parseInt(findValue(row, ['Salvamentos', 'Saved', 'Save']) || 0, 10);
        const views = parseInt(findValue(row, ['Visualizações', 'Views', 'Visualizacoes', 'View']) || 0, 10);
        const duration = parseInt(findValue(row, ['Duração (s)', 'Duration (s)', 'Duracao']) || 0, 10);
        const permalink = findValue(row, ['Link permanente', 'Permalink', 'Link']) || '';

        // Calculate Virality: (Engagements / Reach) * 100
        const engagements = likes + shares + comments + saved;
        const virality = reach > 0 ? ((engagements / reach) * 100).toFixed(1) : 0;

        // Determine status based on date (mock logic for now, or just leave as Completed)
        const status = 'Completed';

        // Extract ID or use index
        const id = findValue(row, ['Identificação do post', 'Identificador multimídia', 'Identificador', 'Post ID']) || `post-${index}`;

        // Extract and format date
        let dateFormatted = null;
        const rawDate = findValue(row, ['Horário de publicação', 'Data', 'Date', 'Horario']);

        if (rawDate && rawDate !== 'Total') {
            try {
                const datePart = rawDate.split(' ')[0]; // Get "02/07/2025" or "10/09/2025"
                if (datePart.includes('/')) {
                    const parts = datePart.split('/');
                    if (parts.length === 3) {
                        if (isUSFormat) {
                            // Convert MM/DD/YYYY -> YYYY-MM-DD
                            dateFormatted = `${parts[2]}-${parts[0]}-${parts[1]}`;
                        } else {
                            // Convert DD/MM/YYYY -> YYYY-MM-DD
                            dateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                    }
                } else {
                    // Already in YYYY-MM-DD or other format?
                    dateFormatted = datePart;
                }
            } catch (e) {
                console.error('Date parsing error', rawDate);
            }
        }

        // Determine platform/type
        const rawType = (findValue(row, ['Tipo de post', 'Tipo de conteúdo', 'Tipo de conteÃºdo', 'Content type']) || '');
        const typeLower = rawType.toLowerCase();

        // Exact mapping - Prioritize STORY check
        let platform = 'social';
        // Logic: if it mentions 'story' -> story
        // if it mentions 'reel' or 'video' -> video
        // else social
        if (typeLower.includes('story')) {
            platform = 'story';
        } else if (typeLower.includes('reel') || typeLower.includes('video')) {
            platform = 'video';
        }

        // Determine Title
        let title = findValue(row, ['Descrição', 'TÃ\xadtulo da legenda', 'Legenda', 'Título/Legenda', 'Caption']);

        // Better fallback for Stories or missing titles
        if (!title || title.trim() === '') {
            if (platform === 'story') {
                title = `Story - ${dateFormatted || 'Instagram'}`;
            } else {
                title = 'Post sem legenda';
            }
        }

        return {
            id: id,
            title: title,
            imageUrl: '',
            permalink: permalink,
            platform: platform,
            manager: 'Time Social',
            date: dateFormatted,
            virality: virality,
            status: status,
            reach: reach,
            likes: likes,
            shares: shares,
            comments: comments,
            saved: saved,
            views: views,
            duration: duration
        };
    });
};

export const instagramParser = {
    async parseFile(file) {
        const { data, metadata } = await parseCSV(file);

        // Detect file type by filename or headers or metadata
        const fileName = file.name.toLowerCase();
        const metadataLower = metadata ? metadata.toLowerCase() : '';

        // Debug detection
        console.log(`Parsing ${fileName}`, { metadataSnippet: metadataLower.substring(0, 50), firstRow: data[0] });

        const hasColumn = (keyPart) => {
            if (!data[0]) return false;
            return Object.keys(data[0]).some(k => k.toLowerCase().includes(keyPart.toLowerCase()));
        };

        // Content Export Detection (Prioritized)
        // Check for US-style dates in filename (e.g. Oct-09-2025)
        const isUSFilename = /^[a-z]{3}-\d{2}-\d{4}/i.test(fileName);

        const hasContentColumns = hasColumn('permalink') || hasColumn('link permanente') || hasColumn('tipo de conte') || hasColumn('tipo de post') || hasColumn('identificação do post');

        if (isUSFilename || hasContentColumns || (data.length > 0 && typeof data[0]['Alcance'] !== 'undefined' && (hasColumn('curtidas') || hasColumn('respostas')))) {
            return { type: 'content', data: normalizeContentData(data, isUSFilename) };
        }

        // Daily Metrics Detection
        // Check metadata first (more reliable for these specific exports)
        if (metadataLower.includes('alcance') || fileName.includes('alcance') || (hasColumn('data') && hasColumn('alcance'))) {
            return { type: 'metric', metric: 'reach', data: normalizeDailyMetric(data, 'reach') };
        }

        if (metadataLower.includes('intera') || fileName.includes('interações') || fileName.includes('interacoes') || (hasColumn('data') && hasColumn('intera'))) {
            return { type: 'metric', metric: 'interactions', data: normalizeDailyMetric(data, 'interactions') };
        }
        if (fileName.includes('seguidores') || (hasColumn('data') && hasColumn('seguidores'))) {
            return { type: 'metric', metric: 'followers', data: normalizeDailyMetric(data, 'followers') };
        }
        if (fileName.includes('visitas') || (hasColumn('data') && hasColumn('visitas'))) {
            return { type: 'metric', metric: 'profile_visits', data: normalizeDailyMetric(data, 'profile_visits') };
        }
        if (fileName.includes('visualizações') || fileName.includes('visualizacoes') || (hasColumn('data') && hasColumn('visualiza'))) {
            return { type: 'metric', metric: 'impressions', data: normalizeDailyMetric(data, 'impressions') };
        }
        if (metadataLower.includes('clique') || fileName.includes('cliques') || (hasColumn('data') && hasColumn('cliques'))) {
            return { type: 'metric', metric: 'website_clicks', data: normalizeDailyMetric(data, 'website_clicks') };
        }

        console.warn('Unknown file type:', fileName, Object.keys(data[0] || {}));
        return { type: 'unknown', data };
    }
};
