async function debugAPI() {
    const country = 'BR';
    const platform = 'Instagram';
    const apiUrl = 'https://api.meganalise.pro';
    
    try {
        console.log(`Calling: ${apiUrl}/api/dashboard/${country}/${platform}`);
        const response = await fetch(`${apiUrl}/api/dashboard/${country}/${platform}`);
        const data = await response.json();
        
        if (data.content && data.content.length > 0) {
            // Sort by date desc
            const sorted = data.content.filter(c => c.date).sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log('Most recent 5 content items:');
            sorted.slice(0, 5).forEach(c => console.log(`${c.date} | ${c.type || c.platform_type}: ${c.title || 'Untitled'}`));
        } else {
            console.log('No content found.');
        }
        
    } catch (err) {
        console.error('Error debugging API:', err.message);
    }
}

debugAPI();
