import { Beer } from '../types';
import beersData from '../src/data/beers.json';

// Simulate async operations to match previous API signatures if needed, 
// or keep it synchronous for simplicity since it's local.
// We'll use async to mimic the "service" feel and allow for potential future expansion (e.g. IndexedDB).

const allBeers: Beer[] = beersData as Beer[];

export const fetchCatalogBulk = async (max: number = 1000): Promise<Beer[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return allBeers.slice(0, max);
};

export const fetchCatalogBeerFull = async (beerId: string): Promise<Beer | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return allBeers.find(b => b.id === beerId) || null;
};

export const fetchCatalogDetailByName = async (name: string): Promise<Beer | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return allBeers.find(b => b.name.toLowerCase() === name.toLowerCase()) || null;
};

export const searchCatalogBeers = async (query: string): Promise<Beer[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const normalized = query.toLowerCase().trim();
    if (!normalized) return [];

    return allBeers.filter(b =>
        b.name.toLowerCase().includes(normalized) ||
        b.brewery.toLowerCase().includes(normalized) ||
        b.type.toLowerCase().includes(normalized)
    );
};
