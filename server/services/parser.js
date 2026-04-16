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
    // Try UTF-8 first
    try {
        const utf8Text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        // Check if result looks like Windows-1252 mis-decoded as UTF-8
        // Telltale: sequences like Ã¡ (á), Ã§ (ç), Ã£ (ã), Ã© (é), Ã­ (í), Ã³ (ó), Ãº (ú)
        if (/Ã[¡-¿]/.test(utf8Text) || /Ã\u00a3/.test(utf8Text)) {
            // Re-decode as latin1 (windows-1252 compatible)
            return new TextDecoder('iso-8859-1').decode(buffer);
        }
        return utf8Text;
    } catch (e) {
        // UTF-8 failed, try latin1 as fallback
        return new TextDecoder('iso-8859-1').decode(buffer);
    }
};

// Helper: normalize a string removing accents for robust comparison
const stripAccents = (str) => str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

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
        // Heuristic: If date is in future, it's likely last year.
        // Note: This check uses strict comparison. If today is Jan 1, and parsed date is Jan 1, it's fine.
        // If parsed date is Jan 2, it is future -> year-- (becomes Jan 2 last year).
        // WARNING: This assumes uploads are for recent past events. Uploading very old data without year might fail.
        if (date > new Date()) {
            year--;
        }
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // 2. YYYY-MM-DD or YYYY/MM/DD
    if (/^\d{4}[\/\-]\d{2}[\/\-]\d{2}/.test(str)) {
        return str.substring(0, 10).replace(/\//g, '-');
    }

    // 3. EN/PT Text formats: "Jan 11, 2025", "11 Jan 2025", "11 de Jan", "11 de Janeiro"
    // Normalize: remove "de ", periods, and extra spaces
    const cleanStr = str.replace(/\sde\s/gi, ' ').replace(/\./g, '').toLowerCase();

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
                if (tempDate > new Date()) {
                    year = currentYear - 1;
                }
            }
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
    }

    // 4. Try native Date parse
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }

    // 5. Fallback: Parse failed
    console.warn(`Date parsing failed for value: "${str}"`);
    return null;
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

// Normalize string: removing accents and lowering case
const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/['"]/g, '');

const createKeyMap = (row) => {
    const map = new Map();
    for (const key of Object.keys(row)) {
        map.set(normalize(key), key);
    }
    return map;
};

const findValue = (row, keyMap, candidates) => {
    // 1. Exact match (case insensitive normalized)
    for (const c of candidates) {
        const normalizedCandidate = normalize(c);
        if (keyMap.has(normalizedCandidate)) {
            return row[keyMap.get(normalizedCandidate)];
        }
    }

    // 2. Fuzzy match
    for (const c of candidates) {
        const normalizedCandidate = normalize(c);
        for (const [normalizedKey, originalKey] of keyMap.entries()) {
            if (normalizedKey.includes(normalizedCandidate)) {
                return row[originalKey];
            }
        }
    }
    return undefined;
};

const normalizeContentData = (data, isUSFormat = false) => {
    return data.map((row, index) => {
        const keyMap = createKeyMap(row);
        const getValue = (candidates) => findValue(row, keyMap, candidates);

        const reach = parseInt(getValue(['Alcance', 'Reach']) || 0, 10);
        const likes = parseInt(getValue(['Curtidas', 'Likes', 'Curtida', 'Like', 'Reações', 'Reacoes', 'Reactions']) || 0, 10);
        const shares = parseInt(getValue(['Compartilhamentos', 'Shares', 'Share']) || 0, 10);
        const comments = parseInt(getValue(['Respostas', 'Comentários', 'Comments', 'Comentarios', 'Comentario', 'Comment', 'Res']) || 0, 10);
        const saved = parseInt(getValue(['Salvamentos', 'Saved', 'Save']) || 0, 10);
        // Facebook video reports use 'Visualizações de 3 segundos', general reports use 'Visualizações' or 'Impressões'
        const views = parseInt(getValue(['Visualizações de 3 segundos', 'Visualizações', 'Views', 'Visualizacoes', 'View', 'Impressões do anúncio', 'Impressões']) || 0, 10);
        const duration = parseInt(getValue(['Duração (s)', 'Duration (s)', 'Duracao']) || 0, 10);
        const clicks = parseInt(getValue(['Cliques no link', 'Link Clicks', 'Cliques']) || 0, 10);

        const permalink = getValue(['Link permanente', 'Permalink', 'Link']) || '';
        const author = getValue(['Nome de usuário da conta', 'Account username', 'Username', 'Nome da Página']) || '';

        const engagements = likes + shares + comments + saved + clicks;
        const virality = reach > 0 ? ((engagements / reach) * 100).toFixed(1) : 0;
        const status = 'Completed';


        let dateFormatted = null;
        let timeFormatted = null;
        const rawDate = getValue(['Horário de publicação', 'Data', 'Date', 'Horario']);

        // Check if row is a summary row (starts with Total or date is Total)
        if (rawDate === 'Total' || getValue(['Identificação do post']) === 'Total') {
            return null; // Skip this row
        }

        if (rawDate) {
            try {
                // Sanitize: Remove surrounding quotes if present (can happen with papaparse on some CSVs)
                const sanitizedDate = rawDate.replace(/^["']|["']$/g, '').trim();

                // Try basic time extraction with regex (HH:MM)
                const timeMatch = sanitizedDate.match(/(\d{1,2}:\d{2})/);
                if (timeMatch) {
                    timeFormatted = timeMatch[1];
                }

                // Date Parsing
                // 1. Special handling for US Slashed dates (MM/DD/YYYY) if specified
                const slashMatch = sanitizedDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                if (isUSFormat && slashMatch) {
                    const [_, p1, p2, year] = slashMatch;
                    // US: p1=Month, p2=Day
                    dateFormatted = `${year}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
                } else {
                    // 2. Use robust parseDate helper (handles DD/MM/YYYY, Text months "Jan 10", YYYY-MM-DD)
                    dateFormatted = parseDate(sanitizedDate);
                }
            } catch (e) {
                console.error('Date parsing error', rawDate);
            }
        }

        const rawType = (getValue(['Tipo de post', 'Tipo de conteúdo', 'Tipo de conteÃºdo', 'Content type', 'Formato']) || '');
        const typeLower = rawType.toLowerCase();

        let platform = 'social';
        const isVideoReport = getValue(['Número de identificação do ativo de vídeo', 'Identificação do vídeo universal']) !== undefined;

        if (typeLower.includes('story') || typeLower.includes('historia') || typeLower.includes('história')) {
            platform = 'story';
        } else if (typeLower.includes('reel') || typeLower.includes('video') || typeLower.includes('vídeo') || isVideoReport) {
            platform = 'video';
        }

        const titleRaw = getValue(['Descrição', 'TÃ\xadtulo da legenda', 'Legenda', 'Título/Legenda', 'Caption', 'Título', 'TÃ\xadtulo']);
        let title = titleRaw;

        // Fallback para Facebook Stories: se não tem link e veio de relatório de vídeo, ou título indica
        if (permalink === '' || permalink === 'N/A') {
            if (isVideoReport || !title || title.trim() === '') {
                platform = 'story';
            }
        }

        if (platform === 'social' && title && (title.toLowerCase().startsWith('story') || title.toLowerCase().startsWith('história'))) {
            platform = 'story';
        }

        if (!title || title.trim() === '') {
            if (platform === 'story') {
                title = `Story - ${dateFormatted || ''}`;
            } else {
                title = 'Post sem legenda';
            }
        }

        if (!dateFormatted) {
            // If date cannot be parsed, this is likely a summary row or invalid data. Skip it.
            return null;
        }

        // Robust ID generation
        let id = getValue(['Identificação do post', 'Número de identificação do ativo de vídeo', 'Identificação do vídeo universal', 'Identificador multimídia', 'Identificador', 'Post ID', 'ID']);
        if (!id || id === 'Total') {
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

    // Optimization: Avoid splitting the entire large file into lines just to read headers.
    // We scan for the first few newlines to extract metadata and detect the header line.
    const MAX_SCAN_LINES = 20;
    const lineEndings = [];
    let pos = 0;

    // Find newline positions for the first MAX_SCAN_LINES
    while (lineEndings.length < MAX_SCAN_LINES && pos < csvText.length) {
        const nextLF = csvText.indexOf('\n', pos);
        if (nextLF === -1) {
            lineEndings.push(csvText.length);
            break;
        }
        lineEndings.push(nextLF);
        pos = nextLF + 1;
    }

    // Extract first few lines for inspection
    const firstFewLines = [];
    let prevStart = 0;
    for (const end of lineEndings) {
        let line = csvText.substring(prevStart, end);
        if (line.endsWith('\r')) line = line.slice(0, -1); // Handle CRLF
        firstFewLines.push(line);
        prevStart = end + 1;
    }

    const fileNameLower = fileName.toLowerCase();
    const firstLines = firstFewLines.slice(0, 5).join('\n').toLowerCase();

    // Check for Audience/Demographics
    if (fileNameLower.includes('público') || fileNameLower.includes('audience') || firstLines.includes('faixa etária')) {
        // Demographics parsing relies on full line iteration, so we split here if needed.
        const lines = csvText.split(/\r\n|\n/);
        const audienceData = normalizeAudienceData(lines);
        return { type: 'demographics', data: audienceData };
    }

    // Check for "Principais formatos" to ignore/handle gracefully
    if (fileNameLower.includes('formatos') || firstLines.includes('conteúdo publicado')) {
        // Return dummy success or specific type that front-end ignores or handles
        return { type: 'ignored', data: {} };
    }

    // BLOCK FACEBOOK FILES STRICTLY - REMOVED: Instagram exports from Meta Suite also have these headers now.
    // if (firstLines.includes('identificação do post') || firstLines.includes('número de identificação do ativo de vídeo')) {
    //    return { type: 'unknown', message: 'Este arquivo parece ser do Facebook. Por favor selecione a aba Facebook.' };
    // }

    let headerIndex = 0;
    // Find header linest of logic
    for (let i = 0; i < Math.min(firstFewLines.length, 10); i++) {
        const line = firstFewLines[i].toLowerCase();
        if (line.includes('"data"') || line.includes('data,') || line.includes('data;') ||
            line.includes('"identificador') || line.includes('identificador') ||
            // Removed "identificação" checks as they are Facebook specific
            line.includes('alcance,') || line.includes('alcance;') ||
            line.includes('link permanente') || line.includes('permalink')) {
            headerIndex = i;
            break;
        }
    }

    const metadataLines = firstFewLines.slice(0, headerIndex).join('\n');

    // Calculate start index for cleanCSV
    // headerIndex is the line number (0-based) where the header starts.
    // If headerIndex is 0, start is 0.
    // If headerIndex > 0, start is after the newline of the previous line (lineEndings[headerIndex - 1]).
    let cleanCsvStartIndex = 0;
    if (headerIndex > 0) {
        cleanCsvStartIndex = lineEndings[headerIndex - 1] + 1;
    }

    const cleanCSV = csvText.substring(cleanCsvStartIndex);

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
                const linkHeader = headers.find(h => h.toLowerCase() === 'video link' || h.toLowerCase() === 'link do vídeo' || h.toLowerCase() === 'link do video' || h.toLowerCase() === 'link para o vídeo' || h.toLowerCase() === 'link para o video');
                const titleHeader = headers.find(h => h.toLowerCase() === 'video title' || h.toLowerCase() === 'título do vídeo' || h.toLowerCase() === 'titulo do video');

                if (linkHeader && titleHeader) {
                    const contentData = data.map(row => {
                        const link = row[linkHeader] || '';
                        const idMatch = link.match(/\/video\/(\d+)/);
                        const original_id = idMatch ? idMatch[1] : link;

                        // Find other headers dynamically
                        const postTimeHeader = headers.find(h => h.toLowerCase() === 'post time' || h.toLowerCase() === 'tempo de publicação' || h.toLowerCase() === 'tempo de publicacao' || h.toLowerCase() === 'hora da publicação' || h.toLowerCase() === 'hora da publicacao');
                        const likesHeader = headers.find(h => h.toLowerCase() === 'total likes' || h.toLowerCase() === 'curtidas' || h.toLowerCase() === 'total curtidas');
                        const commentsHeader = headers.find(h => h.toLowerCase() === 'total comments' || h.toLowerCase() === 'comentários' || h.toLowerCase() === 'total comentários' || h.toLowerCase() === 'comentarios');
                        const sharesHeader = headers.find(h => h.toLowerCase() === 'total shares' || h.toLowerCase() === 'compartilhamentos' || h.toLowerCase() === 'total compartilhamentos');
                        const viewsHeader = headers.find(h => h.toLowerCase() === 'total views' || h.toLowerCase() === 'visualizações' || h.toLowerCase() === 'total visualizações' || h.toLowerCase() === 'visualizacoes' || h.toLowerCase() === 'visualizações do vídeo' || h.toLowerCase() === 'visualizacoes do video');
                        const savedHeader = headers.find(h => h.toLowerCase() === 'adicionar aos favoritos' || h.toLowerCase() === 'salvamentos' || h.toLowerCase() === 'favoritos');

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
                            saved: parseInt(row[savedHeader] || 0, 10),
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
                if ((headersLower.includes('hour') && headersLower.includes('active followers')) || (headersLower.includes('hora') && headersLower.includes('seguidores ativos'))) {
                    const activityMap = {};
                    let daysCount = new Set();
                    
                    data.forEach(row => {
                        const date = row['Date'] || row['Data'];
                        const hourStr = row['Hour'] || row['Hora'];
                        const followers = parseInt(row['Active followers'] || row['Seguidores ativos'] || row['Active Followers'] || 0, 10);
                        
                        if (hourStr !== undefined && !isNaN(followers)) {
                            if (date) daysCount.add(date);
                            const hour = parseInt(hourStr, 10);
                            if (!activityMap[hour]) activityMap[hour] = 0;
                            activityMap[hour] += followers;
                        }
                    });
                    
                    const numDays = Math.max(1, daysCount.size);
                    const avgActivity = Object.keys(activityMap).map(hour => ({
                        hour: parseInt(hour, 10),
                        value: Math.round(activityMap[hour] / numDays)
                    })).sort((a,b) => a.hour - b.hour);

                    resolve({ type: 'activity', data: avgActivity });
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
                    else if (fileNameLower.includes('visualizadores')) metricName = 'reach';
                    else if (fileNameLower.includes('visualizacoes') || fileNameLower.includes('visualizações') || fileNameLower.includes('visualiza')) metricName = 'impressions';

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

                if (headersLower.some(h => h.includes('dentificacao') || h.includes('id') || h.includes('link'))) {
                    const rawContent = normalizeContentData(data, true); // Use US Format detection for FB slashed dates

                    // Aggregate by ID to handle daily breakdown rows
                    const aggregated = {};
                    rawContent.forEach(item => {
                        if (!aggregated[item.id]) {
                            aggregated[item.id] = { ...item };
                        } else {
                            // Sum metrics
                            aggregated[item.id].reach += item.reach;
                            aggregated[item.id].likes += item.likes;
                            aggregated[item.id].shares += item.shares;
                            aggregated[item.id].comments += item.comments;
                            aggregated[item.id].saved += item.saved;
                            aggregated[item.id].views += item.views;
                            aggregated[item.id].clicks += item.clicks;
                        }
                    });

                    // Recalculate virality and return array
                    const finalContent = Object.values(aggregated).map(item => {
                        const engagements = item.likes + item.shares + item.comments + item.saved + item.clicks;
                        item.virality = item.reach > 0 ? ((engagements / item.reach) * 100).toFixed(1) : 0;
                        return item;
                    });

                    resolve({ type: 'content', data: finalContent });
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

const parseYouTubeCSV = (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        let decodedContent = decodeBuffer(fileBuffer);

        // Remove "sep=," if present
        if (decodedContent.trim().startsWith('sep=,')) {
            decodedContent = decodedContent.replace(/^sep=,[\r\n]+/, '');
        }

        Papa.parse(decodedContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: h => h.trim(),
            complete: (results) => {
                const data = results.data;
                const headers = results.meta.fields || [];
                const headersNorm = headers.map(h => stripAccents(h.trim()));

                console.log('[YouTube] Headers detected:', headers.slice(0, 6));

                const findKey = (matchFn) => headers.find((h, i) => matchFn(headersNorm[i]));

                const hasDate = headersNorm.some(h => h === 'data' || h === 'date');
                const hasTituloVideo = headersNorm.some(h => h.includes('titulo do video') || h === 'video title');
                const hasConteudo = headersNorm.some(h => h === 'conteudo' || h === 'content');

                const dateKey = findKey(n => n === 'data' || n === 'date');
                const conteudoKey = findKey(n => n === 'conteudo' || n === 'content');
                const tituloKey = findKey(n => n.includes('titulo do video') || n === 'video title');
                const pubTimeKey = findKey(n => n.includes('horario de publicacao') || n.includes('publication time'));
                const viewsKey = findKey(n => n === 'visualizacoes' || n === 'views');
                const impressoesKey = findKey(n => n === 'impressoes' || n === 'impressions');
                const watchTimeKey = findKey(n => n.includes('tempo de exibicao') || n.includes('watch time'));
                const inscritosKey = findKey(n => n.includes('inscritos conquistados') || n === 'inscritos' || n === 'subscribers gained' || n === 'subscribers');
                const ctrKey = findKey(n => n.includes('taxa de cliques') || n.includes('click-through rate') || n.includes('ctr'));
                const durationKey = findKey(n => n === 'duracao' || n === 'duration');

                // 1. DETECT: Dados do gráfico (Daily Video Level)
                if (hasDate && hasTituloVideo && hasConteudo && dateKey && viewsKey) {
                    console.log('[YouTube] Detected: Dados do gráfico (daily views per video)');
                    const aggregatedByDate = {};
                    const metricKeys = {
                        views: viewsKey,
                        impressions: impressoesKey,
                        watch_time: watchTimeKey,
                        subscribers: inscritosKey
                    };

                    for (const row of data) {
                        const dateVal = row[dateKey];
                        if (!dateVal || dateVal === 'Total') continue;
                        const parsedDate = parseDate(dateVal);
                        if (!parsedDate) continue;

                        if (!aggregatedByDate[parsedDate]) {
                            aggregatedByDate[parsedDate] = { views: 0, impressions: 0, watch_time: 0, subscribers: 0 };
                        }

                        Object.entries(metricKeys).forEach(([key, header]) => {
                            if (header && row[header]) {
                                const val = parseFloat(row[header].toString().replace(',', '.').replace('%', '')) || 0;
                                aggregatedByDate[parsedDate][key] += val;
                            }
                        });
                    }

                    const metricsData = [];
                    Object.entries(aggregatedByDate).forEach(([date, values]) => {
                        Object.entries(values).forEach(([metric, value]) => {
                            if (value > 0) {
                                metricsData.push({ date, value, metric, platform: 'youtube' });
                            }
                        });
                    });
                    resolve({ type: 'metric', data: metricsData });
                    return;
                }

                // 2. DETECT: Dados da tabela (Video List)
                if (hasTituloVideo && !hasDate && tituloKey) {
                    console.log('[YouTube] Detected: Dados da tabela (video list/content)');
                    const contentData = data.map(row => {
                        if (conteudoKey && (row[conteudoKey] === 'Total' || row[conteudoKey] === 'total')) return null;
                        const id = conteudoKey ? row[conteudoKey] : null;
                        if (!id) return null;
                        return {
                            id,
                            title: row[tituloKey] || '',
                            date: parseDate(row[pubTimeKey]),
                            views: parseInt(row[viewsKey] || 0, 10),
                            reach: parseInt(row[impressoesKey] || 0, 10),
                            impressions: parseInt(row[impressoesKey] || 0, 10),
                            watch_time: parseFloat((row[watchTimeKey] || '0').toString().replace(',', '.')),
                            subscribers: parseInt(row[inscritosKey] || 0, 10),
                            ctr: parseFloat((row[ctrKey] || '0').toString().replace(',', '.')),
                            duration: parseInt(row[durationKey] || 0, 10),
                            social_network: 'youtube',
                            platform: 'video'
                        };
                    }).filter(item => item !== null && item.date);
                    resolve({ type: 'content', data: contentData });
                    return;
                }

                // 3. DETECT: Dimension Reports (Daily Chart with specific categories)
                if (hasDate && dateKey) {
                    console.log('[YouTube] Detected: Dimension daily report');
                    const dimensionHeader = headers.find((h, i) => {
                        const hn = headersNorm[i];
                        return h !== dateKey && 
                               hn !== 'visualizacoes' && hn !== 'views' && 
                               !hn.includes('tempo de exibicao') && !hn.includes('watch time') &&
                               !hn.includes('impressoes') && !hn.includes('impressions') &&
                               !hn.includes('inscritos') && !hn.includes('subscribers') &&
                               hn !== 'data' && hn !== 'date' && hn !== 'total';
                    });

                    const readableNameHeader = findKey(n => n.includes('nome da cidade') || n.includes('city name')) || 
                                             findKey(n => n === 'pais' || n === 'country') ||
                                             dimensionHeader;

                    const metricKeys = {
                        views: viewsKey,
                        watch_time: watchTimeKey,
                        impressions: impressoesKey,
                        subscribers: inscritosKey
                    };

                    let prefix = 'other_';
                    const dimNorm = stripAccents((dimensionHeader || '').toLowerCase());
                    if (dimNorm.includes('origem do trafego') || dimNorm.includes('traffic source')) prefix = 'traffic_source_';
                    else if (dimNorm.includes('cidade') || dimNorm.includes('city')) prefix = 'geography_city_';
                    else if (dimNorm.includes('pais') || dimNorm.includes('country')) prefix = 'geography_country_';
                    else if (dimNorm.includes('genero') || dimNorm.includes('gender')) prefix = 'gender_';
                    else if (dimNorm.includes('idade') || dimNorm.includes('age')) prefix = 'age_';
                    else if (dimNorm.includes('dispositivo') || dimNorm.includes('device')) prefix = 'device_';

                    const metricsData = [];
                    data.forEach(row => {
                        const dateVal = row[dateKey];
                        if (!dateVal || dateVal === 'Total') return;
                        const parsedDate = parseDate(dateVal);
                        if (!parsedDate) return;

                        const categoryName = readableNameHeader ? row[readableNameHeader] : 'unknown';
                        if (!categoryName || categoryName === 'Total' || categoryName === 'total') return;

                        const normalizedCategory = categoryName
                            .toLowerCase()
                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9]+/g, '_')
                            .replace(/^_|_$/g, '');

                        Object.entries(metricKeys).forEach(([metric, header]) => {
                            if (header && row[header]) {
                                const value = parseFloat(row[header].toString().replace(',', '.').replace('%', '')) || 0;
                                if (value > 0) {
                                    metricsData.push({
                                        date: parsedDate,
                                        value,
                                        metric: `${prefix}${metric}_${normalizedCategory}`,
                                        platform: 'youtube'
                                    });
                                }
                            }
                        });
                    });

                    if (metricsData.length > 0) {
                        resolve({ type: 'metric', data: metricsData });
                        return;
                    }
                }

                // 4. DETECT: Table Summary (Totals per Dimension)
                if (!hasDate) {
                    const genderKey = findKey(n => n.includes('genero') || n.includes('gender'));
                    const ageKey = findKey(n => n.includes('idade') || n.includes('age'));
                    const countryKey = findKey(n => n.includes('pais') || n.includes('country'));
                    const cityKey = findKey(n => n.includes('nome da cidade') || n.includes('city name'));
                    const trafficKey = findKey(n => n.includes('origem do trafego') || n.includes('traffic source'));
                    const deviceKey = findKey(n => n.includes('dispositivo') || n.includes('device'));
                    const osKey = findKey(n => n.includes('sistema operacional') || n.includes('operating system'));

                    const dimKey = genderKey || ageKey || countryKey || cityKey || trafficKey || deviceKey || osKey;

                    if (dimKey) {
                        console.log('[YouTube] Detected: Summary Table (Totals) ->', fileName);
                        
                        let type = 'other';
                        const dimNorm = stripAccents(dimKey.toLowerCase());
                        if (dimNorm.includes('genero') || dimNorm.includes('gender')) type = 'gender';
                        else if (dimNorm.includes('idade') || dimNorm.includes('age')) type = 'age';
                        else if (dimNorm.includes('pais') || dimNorm.includes('country')) type = 'country';
                        else if (dimNorm.includes('cidade') || dimNorm.includes('city')) type = 'city';
                        else if (dimNorm.includes('origem do trafego') || dimNorm.includes('traffic source')) type = 'traffic_source';
                        else if (dimNorm.includes('dispositivo') || dimNorm.includes('device')) type = 'device';
                        else if (dimNorm.includes('sistema operacional') || dimNorm.includes('operating system')) type = 'operating_system';

                        resolve({
                            type: 'demographics',
                            data: {
                                type: type,
                                data: data.map(row => {
                                    if (!row[dimKey] || row[dimKey] === 'Total') return null;
                                    return {
                                        name: row[dimKey],
                                        value: viewsKey ? parseInt(row[viewsKey] || 0, 10) : 0,
                                        percentage: headers.find(h => h.includes('%')) ? parseFloat(row[headers.find(h => h.includes('%'))].toString().replace(',', '.')) : 0
                                    };
                                }).filter(Boolean)
                            }
                        });
                        return;
                    }
                }

                console.warn('Unknown YouTube CSV format:', fileName);
                resolve({ type: 'unknown', data: [], message: `Formato desconhecido para: ${fileName}.` });
            },
            error: (err) => reject(err)
        });
    });
};

module.exports = { parseInstagramCSV, parseTikTokCSV, parseFacebookCSV, parseYouTubeCSV };
