import { Beer, LogEntry } from '../../types';

// Calculate favorite beer style based on logs
export const calculateFavoriteStyle = (logs: LogEntry[], beers: Beer[]): string => {
    const styleCounts: Record<string, number> = {};
    logs.forEach(log => {
        const beer = beers.find(b => b.id === log.beerId);
        if (beer?.type) {
            styleCounts[beer.type] = (styleCounts[beer.type] || 0) + 1;
        }
    });
    const sorted = Object.entries(styleCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'N/A';
};

// Calculate most logged brewery
export const calculateMostLoggedBrewery = (logs: LogEntry[], beers: Beer[]): string => {
    const breweryCounts: Record<string, number> = {};
    logs.forEach(log => {
        const beer = beers.find(b => b.id === log.beerId);
        if (beer?.brewery) {
            breweryCounts[beer.brewery] = (breweryCounts[beer.brewery] || 0) + 1;
        }
    });
    const sorted = Object.entries(breweryCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'N/A';
};

// Calculate average ABV
export const calculateAverageABV = (logs: LogEntry[], beers: Beer[]): string => {
    if (logs.length === 0) return '0.0';
    const total = logs.reduce((sum, log) => {
        const beer = beers.find(b => b.id === log.beerId);
        const abv = parseFloat(beer?.abv || '0');
        return sum + abv;
    }, 0);
    return (total / logs.length).toFixed(1);
};

// Calculate current logging streak
export const calculateStreak = (logs: LogEntry[]): number => {
    if (logs.length === 0) return 0;
    const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);
    let currentStreak = 1;
    let lastDate = new Date(sortedLogs[0].timestamp);
    lastDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sortedLogs.length; i++) {
        const logDate = new Date(sortedLogs[i].timestamp);
        logDate.setHours(0, 0, 0, 0);
        const dayDiff = Math.floor((lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
            currentStreak++;
            lastDate = logDate;
        } else if (dayDiff > 1) {
            break;
        }
    }
    return currentStreak;
};

// Check if Weekend Warrior achievement is unlocked
export const checkWeekendWarrior = (logs: LogEntry[]): boolean => {
    const now = new Date();
    const thisWeekend = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const day = logDate.getDay();
        const isSameWeek = Math.abs(now.getTime() - logDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
        return isSameWeek && (day === 0 || day === 6); // Sunday or Saturday
    });
    return thisWeekend.length >= 10;
};

// Check if Style Master achievement is unlocked
export const checkStyleMaster = (logs: LogEntry[], beers: Beer[]): boolean => {
    const majorStyles = ['Lager', 'IPA', 'Stout', 'Ale', 'Pilsner', 'Wheat', 'Sour'];
    const triedStyles = new Set(logs.map(log => {
        const beer = beers.find(b => b.id === log.beerId);
        return beer?.type;
    }).filter(Boolean));
    const matchedStyles = majorStyles.filter(style =>
        Array.from(triedStyles).some(tried => (tried as string)?.toLowerCase().includes(style.toLowerCase()))
    );
    return matchedStyles.length >= 7;
};

// Check if Local Hero achievement is unlocked
export const checkLocalHero = (logs: LogEntry[], beers: Beer[]): boolean => {
    const breweries = new Set(logs.map(log => {
        const beer = beers.find(b => b.id === log.beerId);
        return beer?.brewery;
    }).filter(Boolean));
    return breweries.size >= 5;
};

// Get beer statistics (count for a specific beer)
export const getBeerStats = (beerId: string, logs: LogEntry[]): number => {
    return logs.filter(log => log.beerId === beerId).length;
};
