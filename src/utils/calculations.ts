import { Beer, LogEntry } from '../../types';
import { detectCountry } from './helpers';

const normalize = (value?: string) => (value || '').toLowerCase();
const getBeerById = (beers: Beer[], id: string) => beers.find(b => b.id === id);

export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'latenight';

export const getTimeBucket = (date: Date): TimeBucket => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 11) return 'morning';
    if (hour >= 12 && hour < 16) return 'afternoon';
    if (hour >= 16 && hour <= 23) return 'evening';
    return 'latenight';
};

export const ensureTimeBucket = (log: LogEntry): LogEntry => {
    if (log.timeBucket) return log;
    return { ...log, timeBucket: getTimeBucket(new Date(log.timestamp)) };
};

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

// --- Expanded Achievements helpers ---
export const getUniqueStyles = (logs: LogEntry[], beers: Beer[]): number => {
    const styles = new Set<string>();
    logs.forEach(log => {
        const beer = getBeerById(beers, log.beerId);
        if (beer?.type) styles.add(normalize(beer.type));
    });
    return styles.size;
};

export const countLogsByPredicate = (logs: LogEntry[], beers: Beer[], predicate: (beer: Beer) => boolean): number =>
    logs.reduce((count, log) => {
        const beer = getBeerById(beers, log.beerId);
        return beer && predicate(beer) ? count + 1 : count;
    }, 0);

export const countBucket = (logs: LogEntry[], bucket: TimeBucket): number =>
    logs.filter(log => ensureTimeBucket(log).timeBucket === bucket).length;

export const hasConsecutiveDayLogging = (logs: LogEntry[], days: number): boolean => {
    if (logs.length === 0) return false;
    const dates = Array.from(new Set(logs.map(log => {
        const d = new Date(log.timestamp);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }))).sort((a, b) => b - a);
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
        const diff = (dates[i - 1] - dates[i]) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            streak++;
            if (streak >= days) return true;
        } else if (diff > 1) {
            streak = 1;
        }
    }
    return false;
};

export const hasConsecutiveWeeks = (logs: LogEntry[], weeks: number): boolean => {
    if (logs.length === 0) return false;
    const weekKeys = Array.from(new Set(logs.map(log => {
        const d = new Date(log.timestamp);
        const year = d.getFullYear();
        const week = Math.floor((d.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        return `${year}-${week}`;
    }))).sort((a, b) => (a > b ? -1 : 1));
    let streak = 1;
    for (let i = 1; i < weekKeys.length; i++) {
        const [yearPrev, weekPrev] = weekKeys[i - 1].split('-').map(Number);
        const [yearCurr, weekCurr] = weekKeys[i].split('-').map(Number);
        const prevIndex = yearPrev * 52 + weekPrev;
        const currIndex = yearCurr * 52 + weekCurr;
        if (prevIndex - currIndex === 1) {
            streak++;
            if (streak >= weeks) return true;
        } else if (prevIndex - currIndex > 1) {
            streak = 1;
        }
    }
    return false;
};

export const hasWeekdayStreak = (logs: LogEntry[], days: number): boolean => {
    if (logs.length === 0) return false;
    const dates = Array.from(new Set(logs.map(log => {
        const d = new Date(log.timestamp);
        d.setHours(0, 0, 0, 0);
        return d;
    }))).sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    for (let i = 0; i < dates.length; i++) {
        const day = dates[i].getDay();
        if (day === 0 || day === 6) { // weekend breaks it
            streak = 0;
            continue;
        }
        if (i === 0) {
            streak = 1;
        } else {
            const diff = (dates[i - 1].getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                streak++;
            } else if (diff > 1) {
                streak = 1;
            }
        }
        if (streak >= days) return true;
    }
    return false;
};

export const uniqueCountries = (logs: LogEntry[], beers: Beer[]): number => {
    const countries = new Set<string>();
    logs.forEach(log => {
        const beer = getBeerById(beers, log.beerId);
        if (!beer) return;
        const country = beer.country || detectCountry(beer);
        if (country) countries.add(country);
    });
    return countries.size;
};

export const hasBreweryBestie = (logs: LogEntry[], beers: Beer[], threshold = 5): boolean => {
    const map: Record<string, Set<string>> = {};
    logs.forEach(log => {
        const beer = getBeerById(beers, log.beerId);
        if (!beer?.brewery) return;
        if (!map[beer.brewery]) map[beer.brewery] = new Set<string>();
        map[beer.brewery].add(beer.id);
    });
    return Object.values(map).some(set => set.size >= threshold);
};

// BeerCount-specific: 5 unique beers logged within 5 minutes
export const hasFastFlight = (logs: LogEntry[]): boolean => {
    if (logs.length < 5) return false;
    const sorted = [...logs].sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 0; i < sorted.length; i++) {
        const windowStart = sorted[i].timestamp;
        const seen = new Set<string>();
        for (let j = i; j < sorted.length; j++) {
            if (sorted[j].timestamp - windowStart > 5 * 60 * 1000) break;
            seen.add(sorted[j].beerId);
            if (seen.size >= 5) return true;
        }
    }
    return false;
};
