import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Beer, LogEntry } from '../../types';
import { fetchCatalogBulk, searchCatalogBeers } from '../../services/localBeerService';
import { subscribeToUserData, saveBeerLogToCloud } from '../../services/firebase';

const mergeBeers = (base: Beer[], extras: Beer[]) => {
    const map = new Map<string, Beer>();
    base.forEach(beer => map.set(beer.id, beer));
    extras.forEach(beer => {
        const existing = map.get(beer.id);
        map.set(beer.id, existing ? { ...existing, ...beer } : beer);
    });
    return Array.from(map.values());
};

export const useBeerData = (user: FirebaseUser | null, isGuest: boolean) => {
    const [myBeers, setMyBeers] = useState<Beer[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [allBeers, setAllBeers] = useState<Beer[]>([]);
    const [isCatalogLoading, setIsCatalogLoading] = useState(true);

    // Load beer catalog
    useEffect(() => {
        const loadCatalog = async () => {
            setIsCatalogLoading(true);
            try {
                const catalogBeers = await fetchCatalogBulk();
                setAllBeers(catalogBeers);
                setMyBeers(catalogBeers);
            } catch (error) {
                console.error('Error loading catalog:', error);
            } finally {
                setIsCatalogLoading(false);
            }
        };
        loadCatalog();
    }, []);

    // Subscribe to user data from Firebase
    useEffect(() => {
        if (!user) {
            // Load from localStorage for guest mode
            const savedLogs = localStorage.getItem('beerLogs');
            if (savedLogs) {
                try {
                    setLogs(JSON.parse(savedLogs));
                } catch (e) {
                    console.error('Error parsing saved logs:', e);
                }
            }
            return;
        }

        const unsubscribe = subscribeToUserData(user.uid, (data) => {
            if (data?.logs) {
                setLogs(data.logs);
            }
            if (data?.beers?.length) {
                setAllBeers(prev => mergeBeers(prev, data.beers));
                setMyBeers(prev => mergeBeers(prev, data.beers));
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Save logs to localStorage for guest mode
    useEffect(() => {
        if (isGuest && !user) {
            localStorage.setItem('beerLogs', JSON.stringify(logs));
        }
    }, [logs, isGuest, user]);

    const handleAddBeerLog = async (beer: Beer) => {
        const newLog: LogEntry = {
            id: `${Date.now()}-${Math.random()}`,
            beerId: beer.id,
            timestamp: Date.now(),
        };

        const updatedLogs = [...logs, newLog];
        setLogs(updatedLogs);

        if (user) {
            try {
                await saveBeerLogToCloud(user.uid, newLog, beer);
            } catch (error) {
                console.error('Error saving to cloud:', error);
            }
        }
    };

    const executeSearch = async (query: string) => {
        if (!query.trim()) {
            setMyBeers(allBeers);
            return allBeers;
        }

        try {
            const results = await searchCatalogBeers(query);
            setMyBeers(results);
            return results;
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    };

    return {
        myBeers,
        setMyBeers,
        logs,
        setLogs,
        allBeers,
        isCatalogLoading,
        handleAddBeerLog,
        executeSearch,
    };
};
