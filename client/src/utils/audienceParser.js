/**
 * Parser para o arquivo "Público.csv" exportado da Meta (Instagram/Facebook).
 * Este arquivo contém múltiplas seções separadas por quebras de linha e títulos.
 */

export const parseAudienceCSV = (text) => {
    // Remover o cabeçalho 'sep=,' se existir
    const cleanText = text.replace(/^sep=,\r?\n/, '');
    
    // Dividir em seções baseadas em linhas duplas ou títulos entre aspas
    const sections = {};
    const lines = cleanText.split(/\r?\n/);
    
    let currentSection = null;
    let sectionLines = [];

    const sectionTitles = [
        "Faixa etária e gênero",
        "Principais países",
        "Principais cidades",
        "Seguidores",
        "Principais Páginas"
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const cleanLine = line.replace(/^"|"$/g, '');

        if (sectionTitles.includes(cleanLine)) {
            if (currentSection) {
                sections[currentSection] = sectionLines;
            }
            currentSection = cleanLine;
            sectionLines = [];
            continue;
        }

        if (line !== "" || (currentSection && sectionLines.length > 0)) {
            sectionLines.push(line);
        }
    }
    // Adicionar a última seção
    if (currentSection) {
        sections[currentSection] = sectionLines;
    }

    const result = {
        genderAge: {},
        countries: [],
        cities: [],
        followers: [],
        similarPages: []
    };

    // 1. Processar Faixa etária e gênero
    if (sections["Faixa etária e gênero"]) {
        // Pular cabeçalho ("","Homens","Mulheres")
        const dataLines = sections["Faixa etária e gênero"].filter(l => l.trim() !== "" && !l.includes("Homens"));
        dataLines.forEach(line => {
            const parts = line.split(',').map(p => p.replace(/^"|"$/g, ''));
            if (parts.length >= 3) {
                const age = parts[0];
                result.genderAge[age] = {
                    male: parseFloat(parts[1]) || 0,
                    female: parseFloat(parts[2]) || 0
                };
            }
        });
    }

    // 2. Processar Principais países
    if (sections["Principais países"]) {
        const names = sections["Principais países"][0].split(',').map(p => p.replace(/^"|"$/g, ''));
        const values = sections["Principais países"][1].split(',').map(p => p.replace(/^"|"$/g, ''));
        result.countries = names.map((name, i) => ({
            name,
            value: parseFloat(values[i]) || 0
        })).filter(c => c.name);
    }

    // 3. Processar Principais cidades
    if (sections["Principais cidades"]) {
        const names = sections["Principais cidades"][0].split(',').map(p => p.replace(/^"|"$/g, ''));
        const values = sections["Principais cidades"][1].split(',').map(p => p.replace(/^"|"$/g, ''));
        result.cities = names.map((name, i) => ({
            name,
            value: parseFloat(values[i]) || 0
        })).filter(c => c.name);
    }

    // 4. Processar Seguidores
    if (sections["Seguidores"]) {
        // Pular cabeçalho ("Data","Primary")
        const dataLines = sections["Seguidores"].filter(l => l.trim() !== "" && !l.includes("Primary") && !l.includes("Data"));
        result.followers = dataLines.map(line => {
            const parts = line.split(',').map(p => p.replace(/^"|"$/g, ''));
            return {
                date: parts[0],
                value: parseInt(parts[1]) || 0
            };
        });
    }

    // 5. Processar Principais Páginas
    if (sections["Principais Páginas"]) {
        const names = sections["Principais Páginas"][0].split(',').map(p => p.replace(/^"|"$/g, ''));
        const values = sections["Principais Páginas"][1].split(',').map(p => p.replace(/^"|"$/g, ''));
        result.similarPages = names.map((name, i) => ({
            name,
            value: parseFloat(values[i]) || 0
        })).filter(p => p.name);
    }

    return result;
};
