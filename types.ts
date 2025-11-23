export interface Beer {
  id: string;
  name: string;
  brewery: string;
  type: string; // e.g., IPA, Stout, Lager
  abv: string;
  emoji?: string; // A fun emoji assigned to the beer
  description?: string; // Short fun fact
  imageUrl?: string; // Optional image if provided by external APIs
  ibu?: string;
  brewerId?: string;
  brewerUrl?: string;
  brewerVerified?: boolean;
  cbVerified?: boolean;
  country?: string;
  locations?: CatalogLocation[];
}

export interface CatalogLocation {
  id: string;
  name: string;
  country?: string;
  city?: string;
  state?: string;
}

export interface LogEntry {
  id: string;
  beerId: string;
  timestamp: number;
  note?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  SEARCH = 'SEARCH',
  DETAIL = 'DETAIL',
  PROFILE = 'PROFILE'
}

export interface UserStats {
  totalBeers: number;
  uniqueBeers: number;
  favoriteType: string;
}
