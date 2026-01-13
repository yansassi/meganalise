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

// ... existing code ...

const findValue = (row, possibleKeys) => {
    const keys = Object.keys(row);
    for (const pKey of possibleKeys) {
        const found = keys.find(k => k.trim().toLowerCase() === pKey.toLowerCase());
        if (found) return row[found];
    }
    return null;
};

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
        // Handle ISO with T (e.g. 2025-01-09T00:00:00)
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
            if (!yearPart) {
                const currentYear = new Date().getFullYear();
                const tempDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
                if (tempDate > new Date()) {
                    year = currentYear - 1;
                }
            }
            return `${year}-${month}-${day.toString().padStart(2, '0')}`;
        }
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }

    return str.replace('T', ' ').split(' ')[0];
};

const normalizeDailyMetric = (data, metricName) => {
    return data.map(row => {
        const keys = Object.keys(row);
        const dateKey = keys.find(k => k.toLowerCase().trim() === 'data' || k.toLowerCase().trim() === 'date');

        if (!dateKey) return null;

        const dateVal = row[dateKey];
        // Value key is typically the one that is NOT the date.
        // For Facebook metrics: "Data", "Primary". "Primary" holds the value.
        const valueKey = keys.find(k => k !== dateKey && k.toLowerCase() !== 'undefined');

        if (!dateVal || !valueKey) return null;

        return {
            date: parseDate(dateVal),
            value: parseInt(row[valueKey] || 0, 10),
            metric: metricName
        };
    }).filter(item => item && item.date);
};

const normalizeContentData = (data, isUSFormat = false) => {
    return data.map((row, index) => {
        const reach = parseInt(findValue(row, ['Alcance', 'Reach']) || 0, 10);
        const likes = parseInt(findValue(row, ['Reações', 'Curtidas', 'Likes', 'Reacoes']) || 0, 10);
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
        // Facebook: "Horário de publicação" or "Data"
        const rawDate = findValue(row, ['Horário de publicação', 'Data', 'Date', 'Horario']);

        if (rawDate === 'Total' || findValue(row, ['Identificação do post']) === 'Total') {
            return null;
        }

        if (rawDate) {
            dateFormatted = parseDate(rawDate);
            // Extract time if present
            if (rawDate.includes(' ')) {
                const timePart = rawDate.split(' ')[1];
                if (timePart) timeFormatted = timePart.substring(0, 5);
            }
        }

        const rawType = (findValue(row, ['Tipo de post', 'Tipo de conteúdo', 'Content type']) || '');
        const typeLower = rawType.toLowerCase();

        let platform = 'facebook'; // Default to generic facebook
        // Facebook doesn't explicitly separate Reels/Posts in all exports, but we can infer
        // For now, keep as 'facebook'

        let title = findValue(row, ['Descrição', 'Título', 'Legenda', 'Título/Legenda', 'Caption']);
        if (!title || title.trim() === '') {
            title = 'Post sem legenda';
        }

        if (!dateFormatted) {
            return null;
        }

        let id = findValue(row, ['Identificação do post', 'Identificador multimídia', 'Identificador', 'Post ID', 'ID', 'Número de identificação do ativo de vídeo']);
        if (!id) {
            const uniqueString = `${title}-${dateFormatted}-${timeFormatted}-${platform}`;
            id = `gen-${crypto.createHash('md5').update(uniqueString).digest('hex')}`;
        }

        return {
            id, title, imageUrl: '', permalink, platform, manager: 'Time Social', author,
            date: dateFormatted, posting_time: timeFormatted, virality, status, reach, likes, shares, comments, saved, views, clicks, duration
        };
    }).filter(item => item !== null);
};

// ... (normalizeAudienceData) ...
const normalizeAudienceData = (lines) => {
    // ... (existing implementation) ...
    // Reuse existing audience logic?
    // Facebook Audience is complex. Let's adapt it inside parseFacebookCSV or check if this works.
    // The existing normalizeAudienceData logic seems tailored for "Faixa etária e gênero", "Principais cidades", "Principais países"
    // which matches Facebook structure perfectly. So we can reuse or adapt.

    const data = {
        gender_age: {},
        cities: [],
        countries: []
    };

    let currentSection = null;
    let pendingKeys = [];

    const parsePercentage = (val) => {
        if (!val) return 0;
        return parseFloat(val.replace(',', '.').replace('%', ''));
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const lowerLine = line.toLowerCase();

        // Remove Byte Order Mark if present at start of line
        const safeLine = lowerLine.replace(/^\uFEFF/, '');

        if (safeLine.includes('faixa etária e gênero') || safeLine.includes('age range and gender')) {
            currentSection = 'gender_age';
            pendingKeys = [];
            continue;
        } else if (safeLine.includes('principais cidades') || safeLine.includes('top cities')) {
            currentSection = 'cities';
            pendingKeys = [];
            continue;
        } else if (safeLine.includes('principais países') || safeLine.includes('top countries')) {
            currentSection = 'countries';
            pendingKeys = [];
            continue;
        }

        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cols = parts.map(p => p.replace(/['"]/g, '').trim());

        if (currentSection === 'gender_age') {
            if (cols[0] && /\d{2}-\d{2}|65\+/.test(cols[0])) {
                const age = cols[0];
                const val1 = parsePercentage(cols[1]); // Women? usually
                const val2 = parsePercentage(cols[2]); // Men?
                // Facebook header usually: "", "Mulheres", "Homens"
                // So col 1 is Female, col 2 is Male
                data.gender_age[age] = { female: val2, male: val1 || 0 }; // ACTUALLY CHECK HEADER
                // Wait, typically Facebook export is:
                // "","Mulheres","Homens"
                // "18-24","1.4","2"
                // So col 1 = Female, col 2 = Male.
                // Correction: existing logic assumes structure.

                // Let's assume generic structure for now and refining.
                data.gender_age[age] = { female: val1, male: val2 || 0 };
            }
        } else if (currentSection === 'cities' || currentSection === 'countries') {
            // ... existing logic ...
            const isNumericRow = cols.some(c => !isNaN(parseFloat(c.replace(',', '.'))));

            if (!isNumericRow) {
                pendingKeys = cols;
            } else if (pendingKeys.length > 0 && isNumericRow) {
                const collection = currentSection === 'cities' ? data.cities : data.countries;

                cols.forEach((val, idx) => {
                    if (pendingKeys[idx]) {
                        collection.push({ name: pendingKeys[idx], value: parsePercentage(val) });
                    }
                });
                pendingKeys = []; // Reset for single row
            }
        }
    }
    return data;
};


// ... parseInstagramCSV ...
// ... parseTikTokCSV ...

const parseFacebookCSV = (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        const decodedContent = decodeBuffer(fileBuffer);
        const fileNameLower = fileName.toLowerCase();

        // 1. Audience (Público) -> Text Parsing
        if (fileNameLower.includes('público') || fileNameLower.includes('audience')) {
            const lines = decodedContent.split(/\r?\n/);
            // Use our normalizeAudienceData logic (it might need a tweak for Facebook specifics if headers vary)
            const audienceData = normalizeAudienceData(lines);
            resolve({ type: 'audience', data: audienceData });
            return;
        }

        // 2. Metrics (Visitas, Seguidores, etc.)
        // Facebook Metrics usually start with "sep=," or a title line, then headers.
        // Or sometimes just headers.
        // We know from inspection:
        // Line 1: sep=, (optional)
        // Line 2: Title (e.g. "Visitas ao Facebook")
        // Line 3: "Data","Primary"
        if (fileNameLower.includes('visitas') || fileNameLower.includes('seguidores') ||
            fileNameLower.includes('interações') || fileNameLower.includes('cliques') ||
            fileNameLower.includes('visualizações')) {

            Papa.parse(decodedContent, {
                header: true,
                skipEmptyLines: true,
                transformHeader: h => h.trim(),
                beforeFirstChunk: (chunk) => {
                    // Facebook usually puts "Data","Primary" on line 3 or 2.
                    // We need to find the header line.
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
                    else if (fileNameLower.includes('interações')) metricName = 'interactions';
                    else if (fileNameLower.includes('cliques')) metricName = 'website_clicks';
                    else if (fileNameLower.includes('visualizações')) metricName = 'reach'; // Default to reach or impressions

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
                // Try to strip potential Byte Order Mark if Papa doesn't
                // Also ensure headers are clean.
                return chunk;
            },
            complete: (results) => {
                const data = results.data;
                const headers = results.meta.fields || [];
                const headersLower = headers.map(h => h.toLowerCase());

                if (headersLower.some(h => h.includes('dentificação do post') || h.includes('número de identificação') || h.includes('active video id'))) {
                    const content = normalizeContentData(data);
                    resolve({ type: 'content', data: content });
                } else {
                    // Fallback/Unknown
                    console.warn('Unknown Facebook CSV format:', fileName);
                    resolve({ type: 'unknown', data: [] });
                }
            },
            error: (err) => reject(err)
        });
    });
};

module.exports = { parseInstagramCSV, parseTikTokCSV, parseFacebookCSV };
