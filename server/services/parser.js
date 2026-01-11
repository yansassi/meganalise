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
// Helper to safely parse dates (handles DD/MM/YYYY and other formats)
const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // Check for DD/MM/YYYY or DD-MM-YYYY format
    // Regex matches 01/01/2020 or 1/1/2020
    const ptBrMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ptBrMatch) {
        const [_, day, month, year] = ptBrMatch;
        // Return ISO format YYYY-MM-DD
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Fallback to standard parser (handles YYYY-MM-DD, ISO, etc)
    return dateStr.split('T')[0];
};

const normalizeDailyMetric = (data, metricName) => {
    return data.map(row => {
        // Find Date Key case-insensitive and robust
        const keys = Object.keys(row);
        const dateKey = keys.find(k => k.toLowerCase().trim() === 'data' || k.toLowerCase().trim() === 'date');

        if (!dateKey) return null;

        const dateVal = row[dateKey];

        // Find Value Key: first key that is not the date key and looks numeric-ish if possible
        // But simply taking the other column is standard for these 2-col exports
        const valueKey = keys.find(k => k !== dateKey);

        if (!dateVal || !valueKey) return null;

        return {
            date: parseDate(dateVal),
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
        let timeFormatted = null;
        const rawDate = findValue(row, ['Horário de publicação', 'Data', 'Date', 'Horario']);

        if (rawDate && rawDate !== 'Total') {
            try {
                const parts = rawDate.split(' ');
                const datePart = parts[0];
                const timePart = parts[1]; // Extract time "HH:MM"

                if (timePart) {
                    timeFormatted = timePart.substring(0, 5); // Ensure HH:MM
                }

                if (datePart.includes('/')) {
                    const dParts = datePart.split('/');
                    if (dParts.length === 3) {
                        if (isUSFormat) {
                            dateFormatted = `${dParts[2]}-${dParts[0]}-${dParts[1]}`;
                        } else {
                            dateFormatted = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
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
            date: dateFormatted, posting_time: timeFormatted, virality, status, reach, likes, shares, comments, saved, views, duration
        };
    });
};

// Helper to parse diverse audience/demographics file
const normalizeAudienceData = (lines) => {
    const data = {
        gender_age: {},
        cities: [],
        countries: []
    };

    let currentSection = null;
    let pendingKeys = [];

    // Helper to extract percentages
    const parsePercentage = (val) => {
        if (!val) return 0;
        return parseFloat(val.replace(',', '.').replace('%', ''));
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const lowerLine = line.toLowerCase();

        // Section Detection
        if (lowerLine.includes('faixa etária e gênero') || lowerLine.includes('age range and gender')) {
            currentSection = 'gender_age';
            pendingKeys = [];
            continue;
        } else if (lowerLine.includes('principais cidades') || lowerLine.includes('top cities')) {
            currentSection = 'cities';
            pendingKeys = [];
            continue;
        } else if (lowerLine.includes('principais países') || lowerLine.includes('top countries')) {
            currentSection = 'countries';
            pendingKeys = [];
            continue;
        }

        // Parse Data based on section
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split CSV respecting quotes
        const cols = parts.map(p => p.replace(/['"]/g, '').trim());

        if (currentSection === 'gender_age') {
            // Vertical format check: "18-24", "20%", "5%"
            if (cols[0] && /\d{2}-\d{2}|65\+/.test(cols[0])) {
                const age = cols[0];
                const val1 = parsePercentage(cols[1]);
                const val2 = parsePercentage(cols[2]);
                data.gender_age[age] = { female: val1, male: val2 || 0 };
            }
            // Horizontal format check (if keys matched previously? rare for age/gender but possible)
        } else if (currentSection === 'cities' || currentSection === 'countries') {
            // Horizontal Data Check
            // Row 1: Names (e.g., "São Paulo", "Rio")
            // Row 2: Values (e.g., "10.5", "5.2")

            // Heuristic: If row has numbers, it's values. If text, it's keys.
            const isNumericRow = cols.some(c => !isNaN(parseFloat(c.replace(',', '.'))));

            if (!isNumericRow) {
                // Assume these are names
                pendingKeys = cols;
            } else if (pendingKeys.length > 0 && isNumericRow) {
                // Map keys to values
                const collection = currentSection === 'cities' ? data.cities : data.countries;

                cols.forEach((val, idx) => {
                    if (pendingKeys[idx]) {
                        collection.push({
                            name: pendingKeys[idx],
                            value: parsePercentage(val)
                        });
                    }
                });
                pendingKeys = []; // Reset after consuming
            } else {
                // Maybe vertical format? "City", "Value"
                if (cols.length >= 2 && !isNaN(parseFloat(cols[1].replace(',', '.')))) {
                    const collection = currentSection === 'cities' ? data.cities : data.countries;
                    collection.push({
                        name: cols[0],
                        value: parsePercentage(cols[1])
                    });
                }
            }
        }
    }

    // Sort lists by value desc
    data.cities.sort((a, b) => b.value - a.value);
    data.countries.sort((a, b) => b.value - a.value);

    return data;
};

const parseInstagramCSV = async (buffer, fileName) => {
    const csvText = decodeBuffer(buffer);
    const lines = csvText.split(/\r\n|\n/);

    let headerIndex = 0;
    const fileNameLower = fileName.toLowerCase();
    const firstLines = lines.slice(0, 5).join('\n').toLowerCase();

    // Check for Audience/Demographics
    if (fileNameLower.includes('público') || fileNameLower.includes('audience') || firstLines.includes('faixa etária')) {
        const audienceData = normalizeAudienceData(lines);
        return { type: 'demographics', data: audienceData };
    }

    // Check for "Principais formatos" to ignore/handle gracefully
    if (fileNameLower.includes('formatos') || firstLines.includes('conteúdo publicado')) {
        // Return dummy success or specific type that front-end ignores or handles
        return { type: 'ignored', data: {} };
    }

    // ... rest of logic
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('"data"') || line.includes('data,') || line.includes('data;') ||
            line.includes('"identificador') || line.includes('identificador') ||
            line.includes('"identificação') || line.includes('identificação') ||
            line.includes('alcance,') || line.includes('alcance;') ||
            line.includes('link permanente') || line.includes('permalink')) {
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

                const hasColumn = (keyPart) => {
                    if (!data[0]) return false;
                    return Object.keys(data[0]).some(k => k.toLowerCase().includes(keyPart.toLowerCase()));
                };

                // Content detection logic...
                const isUSFilename = /^[a-z]{3}-\d{2}-\d{4}/i.test(fileNameLower);
                const hasContentColumns = hasColumn('permalink') || hasColumn('link permanente') || hasColumn('tipo de conte') || hasColumn('tipo de post') || hasColumn('identificação do post');

                if (isUSFilename || hasContentColumns || (data.length > 0 && typeof data[0]['Alcance'] !== 'undefined' && (hasColumn('curtidas') || hasColumn('respostas')))) {
                    resolve({ type: 'content', data: normalizeContentData(data, isUSFilename) });
                    return;
                }

                // Metrics detection logic...
                const isReach = metadataLower.includes('alcance') || fileNameLower.includes('alcance') || fileNameLower.includes('reach') || ((hasColumn('data') || hasColumn('date')) && (hasColumn('alcance') || hasColumn('reach')));
                if (isReach) {
                    resolve({ type: 'metric', metric: 'reach', data: normalizeDailyMetric(data, 'reach') });
                    return;
                }

                const isInteractions = metadataLower.includes('intera') || fileNameLower.includes('intera') || fileNameLower.includes('likes') || fileNameLower.includes('curtidas') || ((hasColumn('data') || hasColumn('date')) && (hasColumn('intera') || hasColumn('curtidas') || hasColumn('likes')));
                if (isInteractions) {
                    resolve({ type: 'metric', metric: 'interactions', data: normalizeDailyMetric(data, 'interactions') });
                    return;
                }

                const isFollowers = fileNameLower.includes('seguid') || fileNameLower.includes('follow') || ((hasColumn('data') || hasColumn('date')) && (hasColumn('seguidores') || hasColumn('followers')));
                if (isFollowers) {
                    resolve({ type: 'metric', metric: 'followers', data: normalizeDailyMetric(data, 'followers') });
                    return;
                }

                const isProfileVisits = fileNameLower.includes('visitas') || fileNameLower.includes('visit') || ((hasColumn('data') || hasColumn('date')) && (hasColumn('visitas') || hasColumn('visits')));
                if (isProfileVisits) {
                    resolve({ type: 'metric', metric: 'profile_visits', data: normalizeDailyMetric(data, 'profile_visits') });
                    return;
                }

                const isImpressions = fileNameLower.includes('visualiza') || fileNameLower.includes('impression') || ((hasColumn('data') || hasColumn('date')) && (hasColumn('visualiza') || hasColumn('impression')));
                if (isImpressions) {
                    resolve({ type: 'metric', metric: 'impressions', data: normalizeDailyMetric(data, 'impressions') });
                    return;
                }

                const isClicks = metadataLower.includes('clique') || fileNameLower.includes('clique') || fileNameLower.includes('click') || ((hasColumn('data') || hasColumn('date')) && (hasColumn('clique') || hasColumn('click')));
                if (isClicks) {
                    resolve({ type: 'metric', metric: 'website_clicks', data: normalizeDailyMetric(data, 'website_clicks') });
                    return;
                }

                console.warn('Unknown file type. Headers:', Object.keys(data[0] || {}), 'Filename:', fileName);
                resolve({ type: 'unknown', data: [] });
            },
            error: (error) => reject(error),
        });
    });
};

module.exports = { parseInstagramCSV };
