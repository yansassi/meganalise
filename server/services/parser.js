const Papa = require('papaparse');
const { TextDecoder } = require('util');
const crypto = require('crypto');

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
// Helper to safely parse dates (handles DD/MM/YYYY, MMM DD, YYYY, PT-BR months)
const parseDate = (dateStr) => {
    if (!dateStr) return null;

    const str = dateStr.trim();

    // 1. DD/MM/YYYY or DD-MM-YYYY
    const ptBrMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ptBrMatch) {
        const [_, day, month, year] = ptBrMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // 1b. DD/MM (Default to current year, fallback to previous if future)
    const shortDateMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})(\s|$)/);
    if (shortDateMatch) {
        const [_, day, month] = shortDateMatch;
        let year = new Date().getFullYear();
        const date = new Date(year, parseInt(month) - 1, parseInt(day));
        if (date > new Date()) { // Heuristic: If date is in future, it's likely last year
            year--;
        }
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // 2. YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.split('T')[0];
    }

    // 3. EN/PT Text formats: "Jan 11, 2025", "11 Jan 2025", "11 de Jan", "11 de Janeiro"
    // Normalize: remove "de "
    const cleanStr = str.replace(/\sde\s/gi, ' ').toLowerCase();

    // Regex for "DD Month YYYY" or "Month DD YYYY"
    // Month can be full name or 3 chars
    const months = {
        'jan': '01', 'janeiro': '01', 'feb': '02', 'fev': '02', 'fevereiro': '02',
        'mar': '03', 'março': '03', 'marco': '03', 'apr': '04', 'abr': '04', 'abril': '04',
        'may': '05', 'mai': '05', 'maio': '05', 'jun': '06', 'junho': '06',
        'jul': '07', 'julho': '07', 'aug': '08', 'ago': '08', 'agosto': '08',
        'sep': '09', 'set': '09', 'setembro': '09', 'oct': '10', 'out': '10', 'outubro': '10',
        'nov': '11', 'novembro': '11', 'dec': '12', 'dez': '12', 'dezembro': '12'
    };

    const parts = cleanStr.split(/[\s,]+/);

    // Heuristic: Find month in parts
    let monthIdx = -1;
    let day = null;
    let year = new Date().getFullYear(); // Default to current year if missing

    for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (months[p] || months[p.substring(0, 3)]) {
            monthIdx = i;
            break;
        }
    }

    if (monthIdx !== -1) {
        const monthStr = parts[monthIdx];
        const month = months[monthStr] || months[monthStr.substring(0, 3)];

        // Look for Day (usually adjacent)
        // If format "Jan 11", day is after. If "11 Jan", day is before.
        if (monthIdx > 0 && !isNaN(parts[monthIdx - 1])) {
            day = parts[monthIdx - 1];
        } else if (monthIdx < parts.length - 1 && !isNaN(parts[monthIdx + 1])) {
            day = parts[monthIdx + 1];
        }

        // Look for Year (4 digits)
        const yearPart = parts.find(p => /^\d{4}$/.test(p));
        if (yearPart) year = yearPart;

        if (day && month) {
            // If year was not explicitly found in the string, apply future-date heuristic
            if (!yearPart) {
                const currentYear = new Date().getFullYear();
                const tempDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
                // If the date in current year is in the future (e.g., "Jan 25" when today is "Jan 12"),
                // assume it belongs to the previous year.
                if (tempDate > new Date()) {
                    year = currentYear - 1;
                }
            }
            return `${year}-${month}-${day.toString().padStart(2, '0')}`;
        }
    }

    // 4. Try native Date parse
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }

    return str.replace('T', ' ').split(' ')[0];
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

    // Normalize string: removing accents and lowering case
    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/['"]/g, '');

    // 1. Exact match (case insensitive normalized)
    for (const c of candidates) {
        const normalizedCandidate = normalize(c);
        for (const key of keys) {
            if (normalize(key) === normalizedCandidate) return row[key];
        }
    }

    // 2. Fuzzy match
    for (const c of candidates) {
        const normalizedCandidate = normalize(c);
        for (const key of keys) {
            const normalizedKey = normalize(key);
            if (normalizedKey.includes(normalizedCandidate)) return row[key];
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
        const views = parseInt(findValue(row, ['Visualizações', 'Views', 'Visualizacoes', 'View', 'Impressões do anúncio', 'Impressões']) || 0, 10); // Facebook usually gives Impressions
        const duration = parseInt(findValue(row, ['Duração (s)', 'Duration (s)', 'Duracao']) || 0, 10);
        const clicks = parseInt(findValue(row, ['Cliques no link', 'Link Clicks']) || 0, 10);

        const permalink = findValue(row, ['Link permanente', 'Permalink', 'Link']) || '';
        const author = findValue(row, ['Nome de usuário da conta', 'Account username', 'Username', 'Nome da Página']) || '';

        const engagements = likes + shares + comments + saved + clicks;
        const virality = reach > 0 ? ((engagements / reach) * 100).toFixed(1) : 0;
        const status = 'Completed';


        let dateFormatted = null;
        let timeFormatted = null;
        const rawDate = findValue(row, ['Horário de publicação', 'Data', 'Date', 'Horario']);

        // Check if row is a summary row (starts with Total or date is Total)
        if (rawDate === 'Total' || findValue(row, ['Identificação do post']) === 'Total') {
            return null; // Skip this row
        }

        if (rawDate) {
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

        if (!dateFormatted) {
            // If date cannot be parsed, this is likely a summary row or invalid data. Skip it.
            return null;
        }

        // Robust ID generation
        let id = findValue(row, ['Identificação do post', 'Identificador multimídia', 'Identificador', 'Post ID', 'ID']);
        if (!id) {
            // Fallback: Generate hash from unique-ish content
            const uniqueString = `${title}-${dateFormatted}-${timeFormatted}-${platform}`;
            id = `gen-${crypto.createHash('md5').update(uniqueString).digest('hex')}`;
        }

        return {
            id, title, imageUrl: '', permalink, platform, manager: 'Time Social', author,
            date: dateFormatted, posting_time: timeFormatted, virality, status, reach, likes, shares, comments, saved, views, clicks, duration
        };
    }).filter(item => item !== null); // Remove skipped rows
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
    let csvText = decodeBuffer(buffer);

    // Remove "sep=," if present
    if (csvText.trim().startsWith('sep=,')) {
        csvText = csvText.replace(/^sep=,[\r\n]+/, '');
    }

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

    // BLOCK FACEBOOK FILES STRICTLY
    if (firstLines.includes('identificação do post') || firstLines.includes('número de identificação do ativo de vídeo')) {
        return { type: 'unknown', message: 'Este arquivo parece ser do Facebook. Por favor selecione a aba Facebook.' };
    }

    // ... rest of logic
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('"data"') || line.includes('data,') || line.includes('data;') ||
            line.includes('"identificador') || line.includes('identificador') ||
            // Removed "identificação" checks as they are Facebook specific
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
            transformHeader: h => h.trim(),
            complete: (results) => {
                const data = results.data;
                const metadataLower = metadataLines.toLowerCase();

                const hasColumn = (keyPart) => {
                    if (!data[0]) return false;
                    return Object.keys(data[0]).some(k => k.toLowerCase().includes(keyPart.toLowerCase()));
                };

                // Content detection logic...
                const isUSFilename = /^[a-z]{3}-\d{2}-\d{4}/i.test(fileNameLower);
                // Removed 'identificação do post' from hasContentColumns
                const hasContentColumns = hasColumn('permalink') || hasColumn('link permanente') || hasColumn('tipo de conte') || hasColumn('tipo de post');

                // EXTRA SAFEGUARD: Check first row data for Facebook
                if (data.length > 0) {
                    const permalink = data[0]['Link permanente'] || data[0]['Permalink'] || '';
                    if (permalink && permalink.includes('facebook.com')) {
                        resolve({ type: 'unknown', message: 'Conteúdo do Facebook detectado. Use a aba Facebook.' });
                        return;
                    }
                }

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
                resolve({ type: 'unknown', data: [], message: `Erro: Formato desconhecido para ${fileName}. Headers detectados: ${JSON.stringify(Object.keys(data[0] || {}))}` });
            },
            error: (error) => reject(error),
        });
    });
};


const normalizeTikTokDailyMetric = (data, metricMapping) => {
    return data.map(row => {
        const dateKey = Object.keys(row).find(k => k.toLowerCase() === 'date' || k.toLowerCase() === 'data');
        if (!dateKey) return null;

        const dateVal = row[dateKey];
        if (!dateVal) return null;

        const metrics = [];
        for (const [csvKey, dbMetricName] of Object.entries(metricMapping)) {
            const rowKey = Object.keys(row).find(k => k.toLowerCase() === csvKey.toLowerCase());
            if (rowKey && row[rowKey] !== undefined) {
                metrics.push({
                    date: parseDate(dateVal),
                    metric: dbMetricName,
                    value: parseInt(row[rowKey] || 0, 10)
                });
            }
        }
        return metrics;
    }).flat().filter(item => item && item.date);
};

const parseTikTokCSV = async (buffer, fileName) => {
    const csvText = decodeBuffer(buffer);
    const lines = csvText.split(/\r\n|\n/);
    const fileNameLower = fileName.toLowerCase();

    // Simple heuristic: TikTok CSVs provided usually have headers on line 1 or 2
    // Overview.csv has "Date","Video Views"...

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                const headers = results.meta.fields || [];
                const headersLower = headers.map(h => h.toLowerCase());

                // 1. Content
                // 1. Content
                const linkHeader = headers.find(h => h.toLowerCase() === 'video link' || h.toLowerCase() === 'link do vídeo' || h.toLowerCase() === 'link do video');
                const titleHeader = headers.find(h => h.toLowerCase() === 'video title' || h.toLowerCase() === 'título do vídeo' || h.toLowerCase() === 'titulo do video');

                if (linkHeader && titleHeader) {
                    const contentData = data.map(row => {
                        const link = row[linkHeader] || '';
                        const idMatch = link.match(/\/video\/(\d+)/);
                        const original_id = idMatch ? idMatch[1] : link;

                        // Find other headers dynamically
                        const postTimeHeader = headers.find(h => h.toLowerCase() === 'post time' || h.toLowerCase() === 'tempo de publicação' || h.toLowerCase() === 'tempo de publicacao');
                        const likesHeader = headers.find(h => h.toLowerCase() === 'total likes' || h.toLowerCase() === 'curtidas' || h.toLowerCase() === 'total curtidas');
                        const commentsHeader = headers.find(h => h.toLowerCase() === 'total comments' || h.toLowerCase() === 'comentários' || h.toLowerCase() === 'total comentários' || h.toLowerCase() === 'comentarios');
                        const sharesHeader = headers.find(h => h.toLowerCase() === 'total shares' || h.toLowerCase() === 'compartilhamentos' || h.toLowerCase() === 'total compartilhamentos');
                        const viewsHeader = headers.find(h => h.toLowerCase() === 'total views' || h.toLowerCase() === 'visualizações' || h.toLowerCase() === 'total visualizações' || h.toLowerCase() === 'visualizacoes');

                        return {
                            original_id,
                            title: row[titleHeader],
                            permalink: link,
                            post_time: postTimeHeader ? row[postTimeHeader] : null,
                            date_published: parseDate(postTimeHeader ? row[postTimeHeader] : null),
                            likes: parseInt(row[likesHeader] || 0, 10),
                            comments: parseInt(row[commentsHeader] || 0, 10),
                            shares: parseInt(row[sharesHeader] || 0, 10),
                            views: parseInt(row[viewsHeader] || 0, 10),
                            platform: 'tiktok'
                        };
                    });
                    resolve({ type: 'content', data: contentData });
                    return;
                }

                // 2. Overview (Daily Metrics)
                if (headersLower.includes('video views') && headersLower.includes('profile views')) {
                    const mapping = {
                        'Video Views': 'video_views',
                        'Profile Views': 'profile_views',
                        'Likes': 'likes',
                        'Comments': 'comments',
                        'Shares': 'shares'
                    };
                    resolve({ type: 'metric', data: normalizeTikTokDailyMetric(data, mapping) });
                    return;
                }

                // 3. Viewers
                if (headersLower.includes('total viewers') && headersLower.includes('new viewers')) {
                    const mapping = {
                        'Total Viewers': 'total_viewers',
                        'New Viewers': 'new_viewers',
                        'Returning Viewers': 'returning_viewers'
                    };
                    resolve({ type: 'metric', data: normalizeTikTokDailyMetric(data, mapping) });
                    return;
                }

                // 4. Follower History
                if (headersLower.includes('followers') && headersLower.includes('difference in followers from previous day')) {
                    const mapping = {
                        'Followers': 'followers_total',
                        'Difference in followers from previous day': 'followers_change'
                    };
                    resolve({ type: 'metric', data: normalizeTikTokDailyMetric(data, mapping) });
                    return;
                }

                // 5. Demographics (Gender)
                if (headersLower.includes('gender') && headersLower.includes('distribution')) { // FollowerGender
                    const genderData = {};
                    data.forEach(row => {
                        if (row['Gender'] && row['Distribution']) {
                            genderData[row['Gender']] = parseFloat(row['Distribution']);
                        }
                    });
                    resolve({ type: 'demographics', subtype: 'gender', data: genderData });
                    return;
                }

                // 6. Demographics (Territory) - FollowerTopTerritories
                if (fileNameLower.includes('territor') || (headersLower.includes('top territories') && headersLower.includes('distribution'))) {
                    const territoryData = {};
                    data.forEach(row => {
                        const key = row['Top territories'] || row['Top Territories'];
                        if (key && row['Distribution']) {
                            territoryData[key] = parseFloat(row['Distribution']);
                        }
                    });
                    resolve({ type: 'demographics', subtype: 'territory', data: territoryData });
                    return;
                }

                // 7. Activity - FollowerActivity
                if (headersLower.includes('hour') && headersLower.includes('active followers')) {
                    // This is hourly data. We might want to compress it or store as is?
                    // Proposal: Store as one JSON record per day? OR return 'activity' type.
                    // Let's resolve as 'activity'
                    resolve({ type: 'activity', data: data });
                    return;
                }

                console.warn('Unknown TikTok CSV format:', fileName);
                resolve({ type: 'unknown', data: [] });
            },
            error: (err) => reject(err)
        });
    });
};

const parseFacebookCSV = (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        let decodedContent = decodeBuffer(fileBuffer);

        // Remove "sep=," if present at the start (common in Excel CSV exports)
        if (decodedContent.trim().startsWith('sep=,')) {
            decodedContent = decodedContent.replace(/^sep=,[\r\n]+/, '');
        }

        const fileNameLower = fileName.toLowerCase();

        // 1. Audience (Público) -> Text Parsing
        // Checks for "publico" (normalized), "audience", or partial match "blico" due to encoding issues
        if (fileNameLower.includes('publico') || fileNameLower.includes('audience') || fileNameLower.includes('blico')) {
            console.log('Parsing Facebook Audience/Publico file');
            const lines = decodedContent.split(/\r?\n/);
            const audienceData = normalizeAudienceData(lines);
            resolve({ type: 'audience', data: audienceData });
            return;
        }

        // 1b. Principais Formatos
        if (fileNameLower.includes('principais formats') || fileNameLower.includes('principais formatos')) {
            console.log('Skipping "Principais formatos" file (likely summary)');
            resolve({ type: 'ignored', message: 'Arquivo de resumo ignorado (Principais formatos)' });
            return;
        }

        // 2. Metrics (Visitas, Seguidores, etc.)
        // Normalized keywords: visitas, seguidores, interacoes, cliques, visualizacoes
        // Partial matches for robustness: 'visualiza', 'intera'
        if (fileNameLower.includes('visitas') || fileNameLower.includes('seguidores') ||
            fileNameLower.includes('interacoes') || fileNameLower.includes('interações') || fileNameLower.includes('intera') ||
            fileNameLower.includes('cliques') ||
            fileNameLower.includes('visualizacoes') || fileNameLower.includes('visualizações') || fileNameLower.includes('visualiza')) {

            console.log('Parsing Facebook Metric file:', fileNameLower);

            Papa.parse(decodedContent, {
                header: true,
                skipEmptyLines: true,
                transformHeader: h => h.trim(),
                beforeFirstChunk: (chunk) => {
                    const lines = chunk.split(/\r?\n/);
                    // Find line starting with "Data"
                    const index = lines.findIndex(l => l.toLowerCase().includes('"data"') || l.toLowerCase().startsWith('data,'));
                    if (index !== -1) {
                        return lines.slice(index).join('\n');
                    }
                    return chunk;
                },
                complete: (results) => {
                    const data = results.data;
                    let metricName = 'unknown';
                    if (fileNameLower.includes('visitas')) metricName = 'profile_visits';
                    else if (fileNameLower.includes('seguidores')) metricName = 'followers_total';
                    else if (fileNameLower.includes('interacoes') || fileNameLower.includes('interações') || fileNameLower.includes('intera')) metricName = 'interactions';
                    else if (fileNameLower.includes('cliques')) metricName = 'website_clicks';
                    else if (fileNameLower.includes('visualizacoes') || fileNameLower.includes('visualizações') || fileNameLower.includes('visualiza')) metricName = 'reach';

                    console.log(`Detected metric: ${metricName} for file ${fileName}`);

                    const metrics = normalizeDailyMetric(data, metricName);
                    resolve({ type: 'metric', data: metrics });
                },
                error: (err) => reject(err)
            });
            return;
        }

        // 3. Content (Posts/Videos)
        // Usually contains "Identificação do post" or "Número de identificação do ativo de vídeo"
        Papa.parse(decodedContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: h => h.trim(),
            beforeFirstChunk: (chunk) => {
                const lines = chunk.split(/\r?\n/);
                // Look for header line containing key columns
                // Keywords: "Link permanente", "Permalink", "Identificação", "Título", "Data"
                const index = lines.findIndex(l => {
                    const lower = l.toLowerCase();
                    return lower.includes('link permanente') || lower.includes('permalink') ||
                        lower.includes('identificação do post') || lower.includes('active video id') ||
                        lower.includes('título') || lower.includes('title');
                });

                if (index !== -1) {
                    console.log('Found Content headers at line:', index);
                    return lines.slice(index).join('\n');
                }
                return chunk;
            },
            complete: (results) => {
                const data = results.data;
                const headers = results.meta.fields || [];
                const headersLower = headers.map(h => h.toLowerCase());

                if (headersLower.some(h => h.includes('dentificação do post') || h.includes('número de identificação') || h.includes('active video id') || h.includes('identificação'))) {
                    const content = normalizeContentData(data);
                    resolve({ type: 'content', data: content });
                } else {
                    // Fallback/Unknown
                    console.warn('Unknown Facebook CSV format:', fileName, 'Headers found:', headers);
                    resolve({ type: 'unknown', data: [], message: `Formato desconhecido para: ${fileName}. Headers: ${headers.join(', ')}` });
                }
            },
            error: (err) => reject(err)
        });
    });
};

module.exports = { parseInstagramCSV, parseTikTokCSV, parseFacebookCSV };
