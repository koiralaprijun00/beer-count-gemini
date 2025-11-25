// Helper function to get country flag emoji
export const getCountryFlag = (country: string): string => {
    const countryFlags: Record<string, string> = {
        'USA': '🇺🇸',
        'Belgium': '🇧🇪',
        'Germany': '🇩🇪',
        'UK': '🇬🇧',
        'Ireland': '🇮🇪',
        'Mexico': '🇲🇽',
        'Japan': '🇯🇵',
        'Canada': '🇨🇦',
        'Australia': '🇦🇺',
        'Singapore': '🇸🇬',
        'Thailand': '🇹🇭',
        'Italy': '🇮🇹',
        'Czechia': '🇨🇿',
        'Netherlands': '🇳🇱',
        'China': '🇨🇳',
        'India': '🇮🇳',
        'Brazil': '🇧🇷',
        'Argentina': '🇦🇷',
        'Russia': '🇷🇺',
        'Turkey': '🇹🇷',
    };
    return countryFlags[country] || '🌍';
};

// Detect country from beer name or brewery
export const detectCountry = (beer: { name: string; brewery: string }): string | null => {
    const lowerName = beer.name.toLowerCase();
    const lowerBrewery = beer.brewery.toLowerCase();

    if (lowerName.includes('guinness') || lowerBrewery.includes('guinness')) return 'Ireland';
    if (lowerName.includes('heineken') || lowerBrewery.includes('heineken')) return 'Netherlands';
    if (lowerName.includes('corona') || lowerName.includes('modelo')) return 'Mexico';
    if (lowerName.includes('asahi') || lowerName.includes('sapporo') || lowerName.includes('kirin')) return 'Japan';
    if (lowerName.includes('budweiser') || lowerName.includes('coors') || lowerName.includes('miller')) return 'USA';
    if (lowerName.includes('stella') || lowerName.includes('leffe') || lowerName.includes('chimay')) return 'Belgium';
    if (lowerName.includes('beck') || lowerName.includes('warsteiner')) return 'Germany';
    if (lowerName.includes('fosters') || lowerBrewery.includes('australia')) return 'Australia';
    if (lowerName.includes('tsingtao')) return 'China';
    if (lowerName.includes('kingfisher')) return 'India';
    if (lowerName.includes('brahma') || lowerName.includes('skol')) return 'Brazil';
    if (lowerName.includes('quilmes')) return 'Argentina';
    if (lowerName.includes('efes')) return 'Turkey';
    if (lowerName.includes('singha')) return 'Thailand';
    if (lowerName.includes('tiger') && lowerBrewery.includes('singapore')) return 'Singapore';
    if (lowerBrewery.includes('canada') || lowerName.includes('molson') || lowerName.includes('labatt')) return 'Canada';
    if (lowerBrewery.includes('italy') || lowerName.includes('peroni') || lowerName.includes('moretti')) return 'Italy';
    if (lowerBrewery.includes('czech') || lowerName.includes('pilsner urquell') || lowerName.includes('budvar')) return 'Czechia';

    return null;
};
